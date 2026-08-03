from __future__ import annotations

import asyncio
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
OUT_DIR = ROOT / "public/auto-factory/audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)
PLAN = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
DURATION = float(PLAN["duration"])
VOICE = os.getenv("VOICE") or ("tr-TR-AhmetNeural" if PLAN["language"] == "tr" else "en-US-GuyNeural")
VOICE_RATE = os.getenv("VOICE_RATE", "+2%")
SAMPLE_RATE = 48_000
TARGET_SAMPLES = int(round(DURATION * SAMPLE_RATE))
INITIAL_PREROLL = 0.20
INTER_SCENE_PAUSE = 0.36
FINAL_TAIL = 0.55


def run(*args: str, capture: bool = False) -> str:
    result = subprocess.run(args, check=True, text=True, capture_output=capture)
    if not capture:
        return ""
    return f"{result.stdout}\n{result.stderr}".strip()


def probe_duration(path: Path) -> float:
    output = run(
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", str(path), capture=True,
    )
    return float(output.splitlines()[0])


def probe_samples(path: Path) -> int:
    output = run(
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=duration_ts", "-of", "default=nw=1:nk=1",
        str(path), capture=True,
    )
    value = output.splitlines()[0].strip() if output.splitlines() else ""
    return int(value) if value and value != "N/A" else int(round(probe_duration(path) * SAMPLE_RATE))


def detect_silence(path: Path, minimum: float = 0.12) -> list[tuple[float, float]]:
    output = run(
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-af", f"silencedetect=noise=-38dB:d={minimum}", "-f", "null", "-",
        capture=True,
    )
    starts = [float(value) for value in re.findall(r"silence_start: ([0-9.]+)", output)]
    ends = [float(value) for value in re.findall(r"silence_end: ([0-9.]+)", output)]
    return list(zip(starts, ends))


def atempo_chain(speed: float) -> str:
    parts: list[str] = []
    value = speed
    while value > 2.0:
        parts.append("atempo=2.0")
        value /= 2.0
    while value < 0.5:
        parts.append("atempo=0.5")
        value /= 0.5
    parts.append(f"atempo={value:.6f}")
    return ",".join(parts)


def complete_sentence(value: str) -> str:
    line = re.sub(r"\s+", " ", value).strip()
    line = re.sub(r"\s+([,.!?;:])", r"\1", line)
    if line and not re.search(r"[.!?]$", line):
        line += "."
    return line


def words(value: str) -> list[str]:
    return re.findall(r"[0-9A-Za-zÇĞİÖŞÜçğıöşü']+", value)


async def synthesize(index: int, line: str) -> tuple[Path, float, float]:
    """Synthesize one complete sentence and trim silence only, never speech.

    Each sentence is rendered independently so its ending cannot be swallowed by the
    next sentence. The clips are then joined into one continuous master with a
    controlled pause; Remotion still receives one WAV file, not per-scene audio.
    """
    mp3 = OUT_DIR / f"scene-{index:02d}-raw.mp3"
    decoded = OUT_DIR / f"scene-{index:02d}-decoded.wav"
    trimmed = OUT_DIR / f"scene-{index:02d}-trimmed.wav"

    communicate = edge_tts.Communicate(line, VOICE, rate=VOICE_RATE, pitch="-2Hz")
    await communicate.save(str(mp3))
    if not mp3.exists() or mp3.stat().st_size < 2_000:
        raise RuntimeError(f"Scene {index} TTS output is missing")

    run("ffmpeg", "-y", "-i", str(mp3), "-ar", str(SAMPLE_RATE), "-ac", "2", str(decoded))
    raw_duration = probe_duration(decoded)
    silences = detect_silence(decoded, minimum=0.08)

    start = 0.0
    end = raw_duration
    if silences and silences[0][0] <= 0.03:
        # Keep a tiny onset cushion, but remove Edge's long initial padding.
        start = max(0.0, silences[0][1] - 0.035)
    if silences and silences[-1][1] >= raw_duration - 0.03:
        # Keep 140 ms after the last phoneme. This avoids clipped sentence endings.
        end = min(raw_duration, silences[-1][0] + 0.14)
    if end - start < 0.35:
        raise RuntimeError(f"Scene {index} became too short after silence trim")

    run(
        "ffmpeg", "-y", "-i", str(decoded),
        "-af", f"atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS",
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(trimmed),
    )
    return trimmed, raw_duration, probe_duration(trimmed)


def make_silence(path: Path, duration: float) -> None:
    samples = int(round(duration * SAMPLE_RATE))
    run(
        "ffmpeg", "-y", "-f", "lavfi", "-i",
        f"anullsrc=r={SAMPLE_RATE}:cl=stereo:d={duration + 0.02}",
        "-af", f"atrim=start_sample=0:end_sample={samples},asetpts=N/SR/TB",
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(path),
    )


async def main() -> None:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe are required")

    scenes = PLAN.get("scenes", [])
    if not 10 <= len(scenes) <= 12:
        raise RuntimeError(f"V3.1 readability expects 10-12 scenes, received {len(scenes)}")

    lines = [complete_sentence(str(scene.get("voiceLine") or scene.get("title") or "")) for scene in scenes]
    if any(not line for line in lines):
        raise RuntimeError("Every V3.1 scene needs a complete narration sentence")

    raw_total = 0.0
    trimmed_total = 0.0
    trimmed_files: list[Path] = []
    for index, line in enumerate(lines, start=1):
        trimmed, raw_duration, trimmed_duration = await synthesize(index, line)
        trimmed_files.append(trimmed)
        raw_total += raw_duration
        trimmed_total += trimmed_duration

    target_speech = DURATION - INITIAL_PREROLL - FINAL_TAIL - INTER_SCENE_PAUSE * (len(scenes) - 1)
    speed = trimmed_total / target_speech
    if not 0.82 <= speed <= 1.18:
        raise RuntimeError(f"Narration density is outside V3.1 readability range ({speed:.2f}x required)")

    fitted_files: list[Path] = []
    fitted_durations: list[float] = []
    for index, trimmed in enumerate(trimmed_files, start=1):
        fitted = OUT_DIR / f"scene-{index:02d}-fitted.wav"
        run(
            "ffmpeg", "-y", "-i", str(trimmed),
            "-af", (
                f"{atempo_chain(speed)},"
                "highpass=f=68,lowpass=f=11000,"
                "acompressor=threshold=-20dB:ratio=1.65:attack=10:release=170,"
                "alimiter=limit=0.92:latency=1"
            ),
            "-ar", str(SAMPLE_RATE), "-ac", "2", str(fitted),
        )
        fitted_files.append(fitted)
        fitted_durations.append(probe_duration(fitted))

    initial_file = OUT_DIR / "pause-initial.wav"
    gap_file = OUT_DIR / "pause-between-scenes.wav"
    tail_file = OUT_DIR / "pause-final.wav"
    make_silence(initial_file, INITIAL_PREROLL)
    make_silence(gap_file, INTER_SCENE_PAUSE)
    make_silence(tail_file, FINAL_TAIL)

    concat_items: list[Path] = [initial_file]
    for index, fitted in enumerate(fitted_files):
        concat_items.append(fitted)
        if index + 1 < len(fitted_files):
            concat_items.append(gap_file)
    concat_items.append(tail_file)

    concat_list = OUT_DIR / "v31-concat.txt"
    concat_list.write_text(
        "".join(f"file '{path.resolve().as_posix()}'\n" for path in concat_items),
        encoding="utf-8",
    )
    stitched = OUT_DIR / "narration-continuous.wav"
    run(
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c:a", "pcm_s16le", "-ar", str(SAMPLE_RATE), "-ac", "2", str(stitched),
    )

    final = OUT_DIR / "final.wav"
    run(
        "ffmpeg", "-y", "-i", str(stitched),
        "-af", (
            "alimiter=limit=0.93:latency=1,"
            f"apad=whole_len={TARGET_SAMPLES},"
            f"atrim=start_sample=0:end_sample={TARGET_SAMPLES},"
            "asetpts=N/SR/TB"
        ),
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(final),
    )
    final_samples = probe_samples(final)
    if final_samples != TARGET_SAMPLES:
        raise RuntimeError(f"Final WAV sample lock failed: {final_samples} != {TARGET_SAMPLES}")

    # Exact scene starts come from the audio pieces rather than word-count estimates.
    timings: list[dict] = []
    visual_start = 0.0
    speech_start = INITIAL_PREROLL
    for index, (scene, line, speech_duration) in enumerate(zip(scenes, lines, fitted_durations)):
        voice_end = speech_start + speech_duration
        if index + 1 < len(scenes):
            next_visual_start = voice_end + INTER_SCENE_PAUSE / 2
            scene_end = next_visual_start
        else:
            scene_end = DURATION
            next_visual_start = DURATION
        post_speech_hold = max(0.0, scene_end - voice_end)
        timings.append({
            "sceneId": int(scene["id"]),
            "line": line,
            "wordStart": sum(len(words(previous)) for previous in lines[:index]),
            "wordCount": len(words(line)),
            "startOnTimeline": visual_start,
            "speechStart": speech_start,
            "voiceEnd": voice_end,
            "postSpeechHold": post_speech_hold,
            "fittedDuration": speech_duration,
            "requestedSpeed": speed,
            "speed": speed,
        })
        scene["start"] = round(visual_start, 3)
        scene["duration"] = round(max(0.72, scene_end - visual_start), 3)
        scene["voiceStart"] = round(max(0.0, speech_start - visual_start), 3)
        scene["voiceEndPadding"] = round(post_speech_hold, 3)
        visual_start = next_visual_start
        speech_start = voice_end + INTER_SCENE_PAUSE

    scenes[-1]["duration"] = round(DURATION - float(scenes[-1]["start"]), 3)
    PLAN["narration"] = " ".join(lines)
    PLAN["version"] = 3
    PLAN.setdefault("v3", {})["audioTiming"] = "exact-scene-master"
    PLAN["v3"]["interScenePause"] = INTER_SCENE_PAUSE
    PLAN["v3"]["minimumPostSpeechHold"] = min(item["postSpeechHold"] for item in timings)
    PLAN_PATH.write_text(json.dumps(PLAN, ensure_ascii=False, indent=2), encoding="utf-8")

    silences = detect_silence(final)
    internal = [(start, end) for start, end in silences if start > 0.25 and end < DURATION - 0.50]
    max_gap = max((end - start for start, end in internal), default=0.0)
    if max_gap > 0.48:
        raise RuntimeError(f"V3.1 contains a long internal silence: {max_gap:.2f}s")

    (OUT_DIR / "scene-timing.json").write_text(json.dumps({
        "mode": "continuous-word-timed",
        "timingSource": "exact-scene-master",
        "duration": DURATION,
        "targetSamples": TARGET_SAMPLES,
        "finalSamples": final_samples,
        "voice": VOICE,
        "voiceRate": VOICE_RATE,
        "rawDuration": raw_total,
        "trimmedSpeechDuration": trimmed_total,
        "fittedDuration": sum(fitted_durations),
        "speed": speed,
        "interScenePause": INTER_SCENE_PAUSE,
        "maxInternalSilence": max_gap,
        "wordBoundaryCount": 0,
        "scenes": timings,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(
        f"V3.1 exact narration ready: {len(scenes)} complete sentences, speed {speed:.2f}x, "
        f"pause {INTER_SCENE_PAUSE:.2f}s, min hold {min(item['postSpeechHold'] for item in timings):.2f}s, "
        f"max gap {max_gap:.2f}s, samples {final_samples}"
    )


if __name__ == "__main__":
    asyncio.run(main())
