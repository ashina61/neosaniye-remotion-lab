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


def run(*args: str, capture: bool = False) -> str:
    result = subprocess.run(args, check=True, text=True, capture_output=capture)
    return result.stdout.strip() if capture else ""


def probe_duration(path: Path) -> float:
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path), capture=True))


def words(value: str) -> list[str]:
    return re.findall(r"[0-9A-Za-zÇĞİÖŞÜçğıöşü']+", value)


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


def continuous_text() -> str:
    lines = []
    for scene in PLAN["scenes"]:
        line = str(scene.get("voiceLine") or scene.get("title") or "").strip()
        if not line:
            continue
        line = re.sub(r"\s+", " ", line)
        line = re.sub(r"[.!?;:]+$", "", line)
        lines.append(line)
    # A single synthesis call keeps the voice timbre and breath continuous.
    return ". ".join(lines) + "."


async def synthesize_continuous() -> tuple[Path, list[dict]]:
    mp3 = OUT_DIR / "narration-v3-raw.mp3"
    boundaries: list[dict] = []
    communicate = edge_tts.Communicate(continuous_text(), VOICE, rate=VOICE_RATE, pitch="-2Hz")
    with mp3.open("wb") as output:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                output.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                boundaries.append({
                    "offset": float(chunk.get("offset", 0)) / 10_000_000,
                    "duration": float(chunk.get("duration", 0)) / 10_000_000,
                    "text": str(chunk.get("text", "")),
                })
    if not mp3.exists() or mp3.stat().st_size < 20_000:
        raise RuntimeError("Continuous Edge TTS output is missing")
    return mp3, boundaries


def detect_silence(path: Path) -> list[tuple[float, float]]:
    output = run("ffmpeg", "-hide_banner", "-i", str(path), "-af", "silencedetect=noise=-38dB:d=0.12", "-f", "null", "-", capture=True)
    starts = [float(value) for value in re.findall(r"silence_start: ([0-9.]+)", output)]
    ends = [float(value) for value in re.findall(r"silence_end: ([0-9.]+)", output)]
    return list(zip(starts, ends))


def build_timing(boundaries: list[dict], speed: float, voice_start: float, fitted_duration: float) -> list[dict]:
    scene_word_counts = [max(1, len(words(str(scene.get("voiceLine", ""))))) for scene in PLAN["scenes"]]
    total_words = sum(scene_word_counts)
    if len(boundaries) < max(3, int(total_words * 0.6)):
        # Safe fallback: weighted timing across the continuous narration duration.
        boundaries = []
        cursor = 0
        for count in scene_word_counts:
            for _ in range(count):
                boundaries.append({"offset": cursor * fitted_duration / total_words * speed, "duration": 0.0, "text": ""})
                cursor += 1

    scaled = [{**item, "time": voice_start + float(item["offset"]) / speed} for item in boundaries]
    timings: list[dict] = []
    word_cursor = 0
    for index, (scene, count) in enumerate(zip(PLAN["scenes"], scene_word_counts)):
        first = min(word_cursor, len(scaled) - 1)
        next_first = min(word_cursor + count, len(scaled))
        start = 0.0 if index == 0 else max(0.0, scaled[first]["time"] - 0.07)
        if index + 1 < len(scene_word_counts) and next_first < len(scaled):
            end = max(start + 0.75, scaled[next_first]["time"] - 0.05)
        else:
            end = min(DURATION, voice_start + fitted_duration + 0.42)
        timings.append({
            "sceneId": int(scene["id"]),
            "line": scene.get("voiceLine", ""),
            "wordStart": word_cursor,
            "wordCount": count,
            "startOnTimeline": start,
            "voiceEnd": end,
            "fittedDuration": max(0.1, end - start),
            "requestedSpeed": speed,
            "speed": speed,
        })
        word_cursor += count

    # Scene boundaries follow the spoken words; no independent delayed animation timeline remains.
    for index, timing in enumerate(timings):
        start = 0.0 if index == 0 else timing["startOnTimeline"]
        end = timings[index + 1]["startOnTimeline"] if index + 1 < len(timings) else DURATION
        PLAN["scenes"][index]["start"] = round(start, 3)
        PLAN["scenes"][index]["duration"] = round(max(0.72, end - start), 3)
        PLAN["scenes"][index]["voiceStart"] = 0.0
        PLAN["scenes"][index]["voiceEndPadding"] = 0.05
    PLAN["scenes"][-1]["duration"] = round(DURATION - float(PLAN["scenes"][-1]["start"]), 3)
    return timings


async def main() -> None:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe are required")

    raw, boundaries = await synthesize_continuous()
    raw_duration = probe_duration(raw)
    voice_start = 0.08
    target_voice = DURATION - voice_start - 0.55
    speed = raw_duration / target_voice
    if speed > 1.22:
        raise RuntimeError(f"Narration is too dense for V3 ({speed:.2f}x required)")
    if speed < 0.78:
        raise RuntimeError(f"Narration is too short for continuous V3 pacing ({speed:.2f}x)")
    speed = max(0.78, min(1.22, speed))

    narration = OUT_DIR / "narration-continuous.wav"
    run(
        "ffmpeg", "-y", "-i", str(raw),
        "-af", (
            f"{atempo_chain(speed)},"
            "highpass=f=68,lowpass=f=12500,"
            "acompressor=threshold=-20dB:ratio=1.65:attack=10:release=170,"
            "deesser=i=0.35:m=0.45:f=0.55,"
            "alimiter=limit=0.92"
        ),
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(narration)
    )
    fitted_duration = probe_duration(narration)

    final = OUT_DIR / "final.wav"
    run(
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=stereo:d={DURATION}",
        "-i", str(narration),
        "-filter_complex", f"[1:a]adelay={int(voice_start*1000)}|{int(voice_start*1000)}[v];[0:a][v]amix=inputs=2:duration=first:normalize=0,atrim=0:{DURATION},alimiter=limit=0.93[out]",
        "-map", "[out]", "-ar", str(SAMPLE_RATE), "-ac", "2", str(final)
    )

    silences = detect_silence(final)
    internal = [(start, end) for start, end in silences if start > 0.25 and end < DURATION - 0.5]
    max_gap = max((end - start for start, end in internal), default=0.0)
    if max_gap > 0.48:
        raise RuntimeError(f"Continuous narration contains a long internal silence: {max_gap:.2f}s")

    timings = build_timing(boundaries, speed, voice_start, fitted_duration)
    PLAN["narration"] = continuous_text()
    PLAN["version"] = 3
    PLAN_PATH.write_text(json.dumps(PLAN, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "scene-timing.json").write_text(json.dumps({
        "mode": "continuous-word-timed",
        "duration": DURATION,
        "voice": VOICE,
        "voiceRate": VOICE_RATE,
        "rawDuration": raw_duration,
        "fittedDuration": fitted_duration,
        "speed": speed,
        "maxInternalSilence": max_gap,
        "wordBoundaryCount": len(boundaries),
        "scenes": timings,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"V3 continuous narration ready: {fitted_duration:.2f}s, speed {speed:.2f}x, max gap {max_gap:.2f}s")


if __name__ == "__main__":
    asyncio.run(main())
