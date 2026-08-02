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
OUT_DIR.mkdir(parents=True, exist_ok=True)
PLAN = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
DURATION = float(PLAN["duration"])
SAMPLE_RATE = 48_000
FRAMES = int(DURATION * SAMPLE_RATE)
SEED = int(PLAN["seed"])
VOICE = os.getenv("VOICE") or ("tr-TR-AhmetNeural" if PLAN["language"] == "tr" else "en-US-GuyNeural")
VOICE_RATE = os.getenv("VOICE_RATE", "+12%")


def run(*args: str, capture: bool = False) -> str:
    result = subprocess.run(args, check=True, text=True, capture_output=capture)
    return result.stdout.strip() if capture else ""


def probe_duration(path: Path) -> float:
    return float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path), capture=True))


def atempo_chain(speed: float) -> str:
    speed = max(0.5, min(2.0, speed))
    return f"atempo={speed:.5f}"


async def create_narration() -> Path:
    raw = OUT_DIR / "narration-raw.mp3"
    communicate = edge_tts.Communicate(PLAN["narration"], VOICE, rate=VOICE_RATE, pitch="-2Hz")
    await communicate.save(str(raw))
    if raw.stat().st_size < 50_000:
        raise RuntimeError("Edge TTS narration is unexpectedly small")
    raw_duration = probe_duration(raw)
    target = max(8.0, DURATION - 1.6)
    speed = max(0.88, min(1.28, raw_duration / target))
    narration = OUT_DIR / "narration.wav"
    run(
        "ffmpeg", "-y", "-i", str(raw),
        "-af",
        f"{atempo_chain(speed)},highpass=f=72,lowpass=f=12000,acompressor=threshold=-19dB:ratio=2.0:attack=14:release=180,alimiter=limit=0.91,apad",
        "-t", str(DURATION), "-ar", str(SAMPLE_RATE), "-ac", "2", str(narration)
    )
    return narration


def envelope(index: int, length: int, attack: float, release: float) -> float:
    attack_samples = max(1, int(SAMPLE_RATE * attack))
    release_samples = max(1, int(SAMPLE_RATE * release))
    return max(0.0, min(1.0, index / attack_samples, (length - index - 1) / release_samples))


def add_tone(left: array, right: array, start: float, duration: float, frequency: float, amplitude: float,
             attack: float = 0.05, release: float = 0.25, pan: float = 0.0, wave_type: str = "sine") -> None:
    begin = max(0, int(start * SAMPLE_RATE))
    end = min(FRAMES, int((start + duration) * SAMPLE_RATE))
    length = end - begin
    if length <= 1:
        return
    left_gain = math.sqrt((1.0 - pan) * 0.5)
    right_gain = math.sqrt((1.0 + pan) * 0.5)
    for local in range(length):
        t = local / SAMPLE_RATE
        if wave_type == "triangle":
            value = 2.0 * abs(2.0 * ((t * frequency) % 1.0) - 1.0) - 1.0
        elif wave_type == "saw":
            value = 2.0 * ((t * frequency) % 1.0) - 1.0
        else:
            value = math.sin(2.0 * math.pi * frequency * t)
        gain = amplitude * envelope(local, length, attack, release)
        pos = begin + local
        left[pos] += value * gain * left_gain
        right[pos] += value * gain * right_gain


def add_noise(left: array, right: array, start: float, duration: float, amplitude: float,
              seed: int, attack: float = 0.02, release: float = 0.25, pan: float = 0.0, smoothing: int = 110) -> None:
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
        pos = begin + local
        left[pos] += filtered * gain * left_gain
        right[pos] += filtered * gain * right_gain


def write_stereo(path: Path, left: array, right: array) -> None:
    peak = max(1.0, max(abs(v) for v in left), max(abs(v) for v in right))
    scale = 0.94 / peak
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        chunk = bytearray()
        for l_value, r_value in zip(left, right):
            chunk.extend(struct.pack("<hh", int(max(-1, min(1, l_value * scale)) * 32767), int(max(-1, min(1, r_value * scale)) * 32767)))
            if len(chunk) >= 262_144:
                output.writeframesraw(chunk)
                chunk.clear()
        if chunk:
            output.writeframesraw(chunk)


def build_music() -> Path:
    left = array("f", [0.0]) * FRAMES
    right = array("f", [0.0]) * FRAMES
    category_roots = {
        "history": 65.41, "science": 73.42, "economy": 61.74, "geopolitics": 55.0,
        "technology": 82.41, "mystery": 58.27, "nature": 69.30
    }
    root = category_roots.get(PLAN.get("category"), 61.74)
    chords = [(1.0, 1.5, 2.0), (1.0, 4/3, 5/3), (1.0, 1.25, 1.5), (1.0, 1.5, 1.875)]
    for index, scene in enumerate(PLAN["scenes"]):
        start = max(0.0, float(scene["start"]) - 0.65)
        duration = float(scene["duration"]) + 1.15
        chord = chords[index % len(chords)]
        for note_index, ratio in enumerate(chord):
            add_tone(left, right, start, duration, root * ratio, 0.024 / (note_index + 1), attack=0.9, release=1.1, pan=-0.22 + note_index * 0.22)
        add_tone(left, right, start, duration, root / 2, 0.010, attack=1.0, release=1.2, wave_type="triangle")
        add_tone(left, right, float(scene["start"]), 0.55, 48.0 + (index % 3) * 5, 0.012, attack=0.01, release=0.34, wave_type="triangle")
    fade_start = max(0.0, DURATION - 4.8)
    for pos in range(int(fade_start * SAMPLE_RATE), FRAMES):
        t = (pos / SAMPLE_RATE - fade_start) / max(0.1, DURATION - fade_start)
        fade = max(0.0, 1.0 - t) ** 1.7
        left[pos] *= fade
        right[pos] *= fade
    path = OUT_DIR / "music.wav"
    write_stereo(path, left, right)
    return path


def build_sfx() -> Path:
    left = array("f", [0.0]) * FRAMES
    right = array("f", [0.0]) * FRAMES
    used = 0
    for scene in PLAN["scenes"]:
        cue = scene.get("sfx", "none")
        if cue == "none" or used >= 7:
            continue
        start = float(scene["start"]) + 0.08
        pan = -0.3 + (used % 4) * 0.2
        if cue == "impact":
            add_tone(left, right, start, 0.55, 52, 0.24, attack=0.003, release=0.36, wave_type="triangle")
            add_noise(left, right, start, 0.42, 0.16, SEED + used, release=0.3, smoothing=30)
        elif cue in ("paper", "whoosh"):
            add_noise(left, right, start, 0.38, 0.18, SEED + used * 17, release=0.26, pan=pan, smoothing=38)
            add_tone(left, right, start + 0.04, 0.2, 340 + used * 30, 0.018, release=0.12, pan=-pan)
        elif cue == "stamp":
            add_tone(left, right, start, 0.38, 78, 0.22, attack=0.002, release=0.22, wave_type="saw")
            add_tone(left, right, start + 0.02, 0.55, 39, 0.13, attack=0.002, release=0.36)
        elif cue == "click":
            for offset in (0.0, 0.18, 0.36):
                add_tone(left, right, start + offset, 0.11, 850, 0.025, attack=0.001, release=0.055, pan=pan)
        elif cue == "crack":
            add_noise(left, right, start, 0.5, 0.28, SEED + 1971 + used, release=0.28, smoothing=18)
            add_tone(left, right, start + 0.03, 0.58, 44, 0.18, attack=0.003, release=0.38)
        elif cue == "pulse":
            add_tone(left, right, start, 0.48, 62, 0.14, attack=0.02, release=0.3, wave_type="triangle")
            add_tone(left, right, start + 0.08, 0.24, 620, 0.015, attack=0.004, release=0.12, pan=pan)
        used += 1
    path = OUT_DIR / "sfx.wav"
    write_stereo(path, left, right)
    return path


def mix(narration: Path, music: Path, sfx: Path) -> Path:
    final = OUT_DIR / "final.wav"
    run(
        "ffmpeg", "-y", "-i", str(narration), "-i", str(music), "-i", str(sfx),
        "-filter_complex",
        "[1:a][0:a]sidechaincompress=threshold=0.018:ratio=9:attack=16:release=300[ducked];"
        "[0:a]volume=1.0[voice];[ducked]volume=0.56[music];[2:a]volume=0.62[sfx];"
        "[voice][music][sfx]amix=inputs=3:duration=first:normalize=0,"
        "acompressor=threshold=-16dB:ratio=1.7:attack=12:release=210,alimiter=limit=0.93[out]",
        "-map", "[out]", "-t", str(DURATION), "-ar", str(SAMPLE_RATE), "-ac", "2", str(final)
    )
    return final


async def main() -> None:
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        raise RuntimeError("ffmpeg and ffprobe are required")
    narration = await create_narration()
    music = build_music()
    sfx = build_sfx()
    final = mix(narration, music, sfx)
    print(final)


if __name__ == "__main__":
    asyncio.run(main())
