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
    first = output.splitlines()[0].strip() if output.splitlines() else ""
    if first and first != "N/A":
        return int(first)
    return int(round(probe_duration(path) * SAMPLE_RATE))


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
    lines: list[str] = []
    for scene in PLAN["scenes"]:
        line = str(scene.get("voiceLine") or scene.get("title") or "").strip()
        if not line:
            continue
        line = re.sub(r"\s+", " ", line)
        line = re.sub(r"[,.!?;:]+", "", line)
        lines.append(line)
    return " ".join(lines) + "."


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


def detect_silence(path: Path, minimum: float = 0.12) -> list[tuple[float, float]]:
    output = run(
        "ffmpeg", "-hide_banner", "-i", str(path),
        "-af", f"silencedetect=noise=-38dB:d={minimum}", "-f", "null", "-",
        capture=True,
    )
    starts = [float(value) for value in re.findall(r"silence_start: ([0-9.]+)", output)]
    ends = [float(value) for value in re.findall(r"silence_end: ([0-9.]+)", output)]
    return list(zip(starts, ends))


def merge_ranges(ranges: list[tuple[float, float]]) -> list[tuple[float, float]]:
    merged: list[list[float]] = []
    for start, end in sorted(ranges):
        if end <= start:
            continue
        if not merged or start > merged[-1][1] + 0.005:
            merged.append([start, end])
        else:
            merged[-1][1] = max(merged[-1][1], end)
    return [(start, end) for start, end in merged]


def planned_removals(silences: list[tuple[float, float]], duration: float) -> list[tuple[float, float]]:
    removals: list[tuple[float, float]] = []
    for start, end in silences:
        gap = end - start
        if gap < 0.36:
            continue
        if start <= 0.25:
            remove_start, remove_end = 0.0, max(0.0, end - 0.03)
        elif end >= duration - 0.30:
            remove_start, remove_end = min(duration, start + 0.04), duration
        else:
            remove_start, remove_end = start + 0.06, end - 0.06
        if remove_end - remove_start > 0.04:
            removals.append((remove_start, remove_end))
    return merge_ranges(removals)


def complement_ranges(removals: list[tuple[float, float]], duration: float) -> list[tuple[float, float]]:
    kept: list[tuple[float, float]] = []
    cursor = 0.0
    for start, end in removals:
        if start > cursor + 0.005:
            kept.append((cursor, start))
        cursor = max(cursor, end)
    if cursor < duration - 0.005:
        kept.append((cursor, duration))
    return kept


def compact_audio(decoded: Path) -> tuple[Path, list[tuple[float, float]], float]:
    decoded_duration = probe_duration(decoded)
    raw_silences = detect_silence(decoded)
    removals = planned_removals(raw_silences, decoded_duration)
    compacted = OUT_DIR / "narration-compacted.wav"
    if not removals:
        shutil.copyfile(decoded, compacted)
        return compacted, [], 0.0

    kept = complement_ranges(removals, decoded_duration)
    if not kept:
        raise RuntimeError("Silence compactor removed the whole narration")

    filter_parts: list[str] = []
    labels: list[str] = []
    for index, (start, end) in enumerate(kept):
        label = f"k{index}"
        labels.append(f"[{label}]")
        filter_parts.append(
            f"[0:a]atrim=start={start:.6f}:end={end:.6f},asetpts=PTS-STARTPTS[{label}]"
        )
    if len(kept) == 1:
        filter_parts.append(f"{labels[0]}anull[out]")
    else:
        filter_parts.append(f"{''.join(labels)}concat=n={len(kept)}:v=0:a=1[out]")
    run(
        "ffmpeg", "-y", "-i", str(decoded),
        "-filter_complex", ";".join(filter_parts), "-map", "[out]",
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(compacted),
    )
    removed_seconds = sum(end - start for start, end in removals)
    return compacted, removals, removed_seconds


def compact_timestamp(timestamp: float, removals: list[tuple[float, float]]) -> float:
    removed_before = 0.0
    for start, end in removals:
        if timestamp >= end:
            removed_before += end - start
            continue
        if timestamp > start:
            return max(0.0, start - removed_before)
        break
    return max(0.0, timestamp - removed_before)


def remap_boundaries(boundaries: list[dict], removals: list[tuple[float, float]]) -> list[dict]:
    return [
        {
            **item,
            "offset": compact_timestamp(float(item.get("offset", 0)), removals),
        }
        for item in boundaries
    ]


def build_timing(boundaries: list[dict], speed: float, voice_start: float, fitted_duration: float) -> list[dict]:
    scene_word_counts = [max(1, len(words(str(scene.get("voiceLine", ""))))) for scene in PLAN["scenes"]]
    total_words = sum(scene_word_counts)
    if len(boundaries) < max(3, int(total_words * 0.6)):
        boundaries = []
        cursor = 0
        for count in scene_word_counts:
            for _ in range(count):
                boundaries.append({
                    "offset": cursor * fitted_duration / total_words * speed,
                    "duration": 0.0,
                    "text": "",
                })
                cursor += 1

    scaled = [{**item, "time": voice_start + float(item["offset"]) / speed} for item in boundaries]
    timings: list[dict] = []
    word_cursor = 0
    for index, (scene, count) in enumerate(zip(PLAN["scenes"], scene_word_counts)):
        first = min(word_cursor, len(scaled) - 1)
        next_first = min(word_cursor + count, len(scaled))
        start = 0.0 if index == 0 else max(0.0, scaled[first]["time"] - 0.08)
        if index + 1 < len(scene_word_counts) and next_first < len(scaled):
            end = max(start + 0.75, scaled[next_first]["time"] - 0.04)
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
    decoded = OUT_DIR / "narration-decoded.wav"
    run(
        "ffmpeg", "-y", "-i", str(raw),
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(decoded),
    )
    raw_duration = probe_duration(decoded)
    compacted, removals, removed_seconds = compact_audio(decoded)
    compacted_duration = probe_duration(compacted)
    remapped_boundaries = remap_boundaries(boundaries, removals)

    voice_start = 0.08
    target_voice = DURATION - voice_start - 0.55
    speed = compacted_duration / target_voice
    if speed > 1.22:
        raise RuntimeError(f"Narration is too dense for V3 ({speed:.2f}x required)")
    if speed < 0.70:
        raise RuntimeError(f"Narration is too short for continuous V3 pacing ({speed:.2f}x)")
    speed = max(0.70, min(1.22, speed))

    narration = OUT_DIR / "narration-continuous.wav"
    run(
        "ffmpeg", "-y", "-i", str(compacted),
        "-af", (
            f"{atempo_chain(speed)},"
            "highpass=f=68,lowpass=f=11000,"
            "acompressor=threshold=-20dB:ratio=1.65:attack=10:release=170,"
            "alimiter=limit=0.92:latency=1"
        ),
        "-ar", str(SAMPLE_RATE), "-ac", "2", str(narration),
    )
    fitted_duration = probe_duration(narration)

    final = OUT_DIR / "final.wav"
    delay_ms = int(voice_start * 1000)
    run(
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"anullsrc=r={SAMPLE_RATE}:cl=stereo:d={DURATION + 0.25}",
        "-i", str(narration),
        "-filter_complex", (
            f"[1:a]adelay={delay_ms}|{delay_ms}[v];"
            "[0:a][v]amix=inputs=2:duration=longest:normalize=0,"
            "alimiter=limit=0.93:latency=1,"
            f"atrim=start_sample=0:end_sample={TARGET_SAMPLES},"
            "asetpts=N/SR/TB[out]"
        ),
        "-map", "[out]", "-ar", str(SAMPLE_RATE), "-ac", "2", str(final),
    )

    final_samples = probe_samples(final)
    if final_samples != TARGET_SAMPLES:
        raise RuntimeError(
            f"Final WAV sample lock failed: {final_samples} != {TARGET_SAMPLES}"
        )

    silences = detect_silence(final)
    internal = [(start, end) for start, end in silences if start > 0.25 and end < DURATION - 0.50]
    max_gap = max((end - start for start, end in internal), default=0.0)
    if max_gap > 0.48:
        raise RuntimeError(f"Continuous narration contains a long internal silence after compaction: {max_gap:.2f}s")

    timings = build_timing(remapped_boundaries, speed, voice_start, fitted_duration)
    PLAN["narration"] = continuous_text()
    PLAN["version"] = 3
    PLAN_PATH.write_text(json.dumps(PLAN, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "scene-timing.json").write_text(json.dumps({
        "mode": "continuous-word-timed",
        "duration": DURATION,
        "targetSamples": TARGET_SAMPLES,
        "finalSamples": final_samples,
        "voice": VOICE,
        "voiceRate": VOICE_RATE,
        "rawDuration": raw_duration,
        "compactedDuration": compacted_duration,
        "removedSilenceSeconds": removed_seconds,
        "removedRanges": removals,
        "fittedDuration": fitted_duration,
        "speed": speed,
        "maxInternalSilence": max_gap,
        "wordBoundaryCount": len(boundaries),
        "scenes": timings,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        f"V3 continuous narration ready: {fitted_duration:.2f}s, speed {speed:.2f}x, "
        f"removed {removed_seconds:.2f}s, max gap {max_gap:.2f}s, samples {final_samples}"
    )


if __name__ == "__main__":
    asyncio.run(main())
