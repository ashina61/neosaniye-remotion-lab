from __future__ import annotations

import asyncio
import json
import math
import os
import random
import shutil
import struct
import subprocess
import wave
from array import array
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
OUT_DIR = ROOT / "public/auto-factory/audio"
SCENE_DIR = OUT_DIR / "scenes"
OUT_DIR.mkdir(parents=True, exist_ok=True)
SCENE_DIR.mkdir(parents=True, exist_ok=True)
PLAN = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
DURATION = float(PLAN["duration"])
SAMPLE_RATE = 48_000
FRAMES = int(round(DURATION * SAMPLE_RATE))
SEED = int(PLAN["seed"])
VOICE = os.getenv("VOICE") or ("tr-TR-AhmetNeural" if PLAN["language"] == "tr" else "en-US-GuyNeural")
VOICE_RATE = os.getenv("VOICE_RATE", "+5%")
MUSIC_MODE = os.getenv("MUSIC_MODE", PLAN.get("musicMode", "off"))


def run(*args: str, capture: bool = False) -> str:
    result = subprocess.run(args, check=True, text=True, capture_output=capture)
    return result.stdout.strip() if capture else ""


def probe_duration(path: Path) -> float:
    return float(
        run(
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
            capture=True,
        )
    )


def atempo_chain(speed: float) -> str:
    speed = max(0.5, min(2.0, speed))
    return f"atempo={speed:.6f}"


def empty_stereo() -> tuple[array, array]:
    return array("f", [0.0]) * FRAMES, array("f", [0.0]) * FRAMES


def read_pcm_stereo(path: Path) -> tuple[array, array, int]:
    with wave.open(str(path), "rb") as source:
        if source.getframerate() != SAMPLE_RATE or source.getnchannels() != 2 or source.getsampwidth() != 2:
            raise RuntimeError(f"Unexpected WAV format: {path}")
        count = source.getnframes()
        values = array("h")
        values.frombytes(source.readframes(count))
    left = array("f", (values[index] / 32768.0 for index in range(0, len(values), 2)))
    right = array("f", (values[index] / 32768.0 for index in range(1, len(values), 2)))
    return left, right, count


def place_clip(target_left: array, target_right: array, clip_left: array, clip_right: array, start_seconds: float) -> None:
    start = max(0, int(round(start_seconds * SAMPLE_RATE)))
    usable = min(len(clip_left), FRAMES - start)
    for index in range(max(0, usable)):
        target_left[start + index] += clip_left[index]
        target_right[start + index] += clip_right[index]


def write_stereo(path: Path, left: array, right: array, normalize_peak: float | None = None) -> None:
    peak = max(0.000001, max(abs(value) for value in left), max(abs(value) for value in right))
    scale = 1.0 if normalize_peak is None or peak <= normalize_peak else normalize_peak / peak
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        chunk = bytearray()
        for left_value, right_value in zip(left, right):
            chunk.extend(
                struct.pack(
                    "<hh",
                    int(max(-1.0, min(1.0, left_value * scale)) * 32767),
                    int(max(-1.0, min(1.0, right_value * scale)) * 32767),
                )
            )
            if len(chunk) >= 262_144:
                output.writeframesraw(chunk)
                chunk.clear()
        if chunk:
            output.writeframesraw(chunk)


async def synthesize_scene(scene: dict, semaphore: asyncio.Semaphore) -> dict:
    scene_id = int(scene["id"])
    voice_line = str(scene.get("voiceLine") or scene.get("title") or "").strip()
    if not voice_line:
        raise RuntimeError(f"Scene {scene_id} has no voiceLine")
    voice_start = float(scene.get("voiceStart", 0.12))
    end_padding = float(scene.get("voiceEndPadding", 0.26))
    available = max(0.72, float(scene["duration"]) - voice_start - end_padding)
    raw = SCENE_DIR / f"scene-{scene_id:02d}-raw.mp3"
    fitted = SCENE_DIR / f"scene-{scene_id:02d}-fitted.wav"

    async with semaphore:
        communicate = edge_tts.Communicate(voice_line, VOICE, rate=VOICE_RATE, pitch="-2Hz")
        await communicate.save(str(raw))
    if not raw.exists() or raw.stat().st_size < 2_000:
        raise RuntimeError(f"Scene {scene_id} TTS output is missing")

    raw_duration = probe_duration(raw)
    requested_speed = raw_duration / available
    speed = max(0.82, min(1.36, requested_speed))
    run(
        "ffmpeg",
        "-y",
        "-i",
        str(raw),
        "-af",
        (
            f"{atempo_chain(speed)},"
            "highpass=f=78,lowpass=f=11800,"
            "acompressor=threshold=-20dB:ratio=1.8:attack=12:release=170,"
            f"afade=t=out:st={max(0.05, available - 0.08):.4f}:d=0.08,"
            f"apad=pad_dur={available:.4f},atrim=0:{available:.4f},"
            "alimiter=limit=0.91"
        ),
        "-ar",
        str(SAMPLE_RATE),
        "-ac",
        "2",
        str(fitted),
    )
    fitted_duration = probe_duration(fitted)
    return {
        "sceneId": scene_id,
        "line": voice_line,
        "sceneStart": float(scene["start"]),
        "sceneDuration": float(scene["duration"]),
        "voiceStart": voice_start,
        "voiceWindow": available,
        "rawDuration": raw_duration,
        "speed": speed,
        "requestedSpeed": requested_speed,
        "fittedDuration": fitted_duration,
        "startOnTimeline": float(scene["start"]) + voice_start,
        "path": str(fitted),
    }


async def create_scene_locked_narration() -> tuple[Path, list[dict]]:
    semaphore = asyncio.Semaphore(3)
    timings = await asyncio.gather(*(synthesize_scene(scene, semaphore) for scene in PLAN["scenes"]))
    timings = sorted(timings, key=lambda item: item["sceneId"])
    left, right = empty_stereo()
    for timing in timings:
        clip_left, clip_right, _ = read_pcm_stereo(Path(timing["path"]))
        place_clip(left, right, clip_left, clip_right, timing["startOnTimeline"])
    narration = OUT_DIR / "narration-scene-locked.wav"
    write_stereo(narration, left, right, normalize_peak=0.92)
    (OUT_DIR / "scene-timing.json").write_text(
        json.dumps(
            {
                "mode": "scene-locked-tts",
                "duration": DURATION,
                "voice": VOICE,
                "voiceRate": VOICE_RATE,
                "scenes": timings,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return narration, timings


def envelope(index: int, length: int, attack: float, release: float) -> float:
    attack_samples = max(1, int(SAMPLE_RATE * attack))
    release_samples = max(1, int(SAMPLE_RATE * release))
    return max(0.0, min(1.0, index / attack_samples, (length - index - 1) / release_samples))


def add_tone(
    left: array,
    right: array,
    start: float,
    duration: float,
    frequency: float,
    amplitude: float,
    attack: float = 0.02,
    release: float = 0.2,
    pan: float = 0.0,
    wave_type: str = "sine",
) -> None:
    begin = max(0, int(start * SAMPLE_RATE))
    end = min(FRAMES, int((start + duration) * SAMPLE_RATE))
    length = end - begin
    if length <= 1:
        return
    left_gain = math.sqrt((1.0 - pan) * 0.5)
    right_gain = math.sqrt((1.0 + pan) * 0.5)
    for local in range(length):
        time = local / SAMPLE_RATE
        if wave_type == "triangle":
            value = 2.0 * abs(2.0 * ((time * frequency) % 1.0) - 1.0) - 1.0
        elif wave_type == "saw":
            value = 2.0 * ((time * frequency) % 1.0) - 1.0
        else:
            value = math.sin(2.0 * math.pi * frequency * time)
        gain = amplitude * envelope(local, length, attack, release)
        position = begin + local
        left[position] += value * gain * left_gain
        right[position] += value * gain * right_gain


def add_noise(
    left: array,
    right: array,
    start: float,
    duration: float,
    amplitude: float,
    seed: int,
    attack: float = 0.02,
    release: float = 0.25,
    pan: float = 0.0,
    smoothing: int = 90,
) -> None:
    rng = random.Random(seed)
    begin = max(0, int(start * SAMPLE_RATE))
    end = min(FRAMES, int((start + duration) * SAMPLE_RATE))
    length = end - begin
    if length <= 1:
        return
    recent = [0.0] * smoothing
    total = 0.0
    cursor = 0
    left_gain = math.sqrt((1.0 - pan) * 0.5)
    right_gain = math.sqrt((1.0 + pan) * 0.5)
    for local in range(length):
        value = rng.uniform(-1.0, 1.0)
        total -= recent[cursor]
        recent[cursor] = value
        total += value
        cursor = (cursor + 1) % smoothing
        filtered = total / smoothing
        gain = amplitude * envelope(local, length, attack, release)
        position = begin + local
        left[position] += filtered * gain * left_gain
        right[position] += filtered * gain * right_gain


def build_ambience() -> Path:
    left, right = empty_stereo()
    if MUSIC_MODE == "soft-documentary":
        # Deliberately non-melodic: only very low paper/room texture. No drone or repeating synth.
        rng = random.Random(SEED + 6001)
        for start in [index * 5.5 for index in range(int(DURATION / 5.5) + 1)]:
            add_noise(
                left,
                right,
                start,
                min(4.7, DURATION - start),
                0.012,
                rng.randint(0, 9_999_999),
                attack=0.9,
                release=1.2,
                pan=rng.uniform(-0.18, 0.18),
                smoothing=420,
            )
    path = OUT_DIR / "ambience.wav"
    write_stereo(path, left, right)
    return path


def build_sfx() -> Path:
    left, right = empty_stereo()
    used = 0
    for scene in PLAN["scenes"]:
        cue = scene.get("sfx", "none")
        if cue == "none" or used >= 6:
            continue
        start = float(scene["start"]) + 0.04
        pan = -0.2 + (used % 3) * 0.2
        if cue == "impact":
            add_tone(left, right, start, 0.42, 54, 0.12, attack=0.002, release=0.28, wave_type="triangle")
            add_noise(left, right, start, 0.26, 0.08, SEED + used, release=0.2, smoothing=34)
        elif cue in ("paper", "whoosh"):
            add_noise(left, right, start, 0.3, 0.1, SEED + used * 17, release=0.21, pan=pan, smoothing=46)
        elif cue == "stamp":
            add_tone(left, right, start, 0.25, 82, 0.12, attack=0.002, release=0.18, wave_type="triangle")
            add_noise(left, right, start, 0.18, 0.06, SEED + 91 + used, release=0.12, smoothing=30)
        elif cue == "click":
            for offset in (0.0, 0.16):
                add_tone(left, right, start + offset, 0.08, 760, 0.014, attack=0.001, release=0.04, pan=pan)
        elif cue == "crack":
            add_noise(left, right, start, 0.35, 0.14, SEED + 1971 + used, release=0.23, smoothing=20)
            add_tone(left, right, start + 0.02, 0.34, 48, 0.09, attack=0.002, release=0.26)
        elif cue == "pulse":
            add_tone(left, right, start, 0.32, 64, 0.07, attack=0.01, release=0.22, wave_type="triangle")
        used += 1
    path = OUT_DIR / "sfx.wav"
    write_stereo(path, left, right, normalize_peak=0.62)
    return path


def mix(narration: Path, ambience: Path, sfx: Path) -> Path:
    final = OUT_DIR / "final.wav"
    run(
        "ffmpeg",
        "-y",
        "-i",
        str(narration),
        "-i",
        str(ambience),
        "-i",
        str(sfx),
        "-filter_complex",
        (
            "[0:a]volume=1.0[voice];"
            "[1:a]volume=0.18[amb];"
            "[2:a]volume=0.42[sfx];"
            "[voice][amb][sfx]amix=inputs=3:duration=longest:normalize=0,"
            "acompressor=threshold=-17dB:ratio=1.55:attack=10:release=190,"
            f"apad=pad_dur={DURATION},atrim=0:{DURATION},alimiter=limit=0.92[out]"
        ),
        "-map",
        "[out]",
        "-t",
        f"{DURATION:.3f}",
        "-ar",
        str(SAMPLE_RATE),
        "-ac",
        "2",
        str(final),
    )
    return final


async def main() -> None:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe are required")
    narration, timings = await create_scene_locked_narration()
    ambience = build_ambience()
    sfx = build_sfx()
    final = mix(narration, ambience, sfx)
    measured = probe_duration(final)
    if abs(measured - DURATION) > 0.04:
        raise RuntimeError(f"Final audio duration mismatch: {measured:.3f}s vs {DURATION:.3f}s")
    max_requested_speed = max(float(item["requestedSpeed"]) for item in timings)
    print(f"{final} | scene-locked | max requested speed={max_requested_speed:.3f} | music={MUSIC_MODE}")


if __name__ == "__main__":
    asyncio.run(main())
