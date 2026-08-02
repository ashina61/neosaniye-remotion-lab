from __future__ import annotations

import math
import random
import shutil
import struct
import subprocess
import urllib.request
import wave
from pathlib import Path

SAMPLE_RATE = 48_000
DURATION = 46.5
FRAMES = int(SAMPLE_RATE * DURATION)
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "dollar-v16" / "audio"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VOICE_URL = (
    "https://resource2.heygen.ai/text_to_speech/"
    "48f0581c8a8c497bb4c555eee4d87d10/"
    "7f6838b1b0f141deba891800621a4fe8/"
    "id=6473d6c4-3c3a-4662-9808-2ad8c5bba74a.wav"
)


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def download_voice(path: Path) -> None:
    request = urllib.request.Request(
        VOICE_URL,
        headers={"User-Agent": "Mozilla/5.0 NeoSaniye-Render/1.0"},
    )
    with urllib.request.urlopen(request, timeout=90) as response, path.open("wb") as target:
        shutil.copyfileobj(response, target)
    if path.stat().st_size < 100_000:
        raise RuntimeError("HeyGen narration download is unexpectedly small")


def envelope(index: int, length: int, attack: float, release: float) -> float:
    attack_samples = max(1, int(SAMPLE_RATE * attack))
    release_samples = max(1, int(SAMPLE_RATE * release))
    attack_gain = min(1.0, index / attack_samples)
    release_gain = min(1.0, (length - index - 1) / release_samples)
    return max(0.0, min(attack_gain, release_gain, 1.0))


def add_tone(
    buffer_left: list[float],
    buffer_right: list[float],
    start: float,
    duration: float,
    frequency: float,
    amplitude: float,
    *,
    attack: float = 0.08,
    release: float = 0.3,
    pan: float = 0.0,
    wave_type: str = "sine",
) -> None:
    start_index = max(0, int(start * SAMPLE_RATE))
    end_index = min(FRAMES, int((start + duration) * SAMPLE_RATE))
    length = end_index - start_index
    if length <= 1:
        return
    left_gain = math.sqrt((1.0 - pan) * 0.5)
    right_gain = math.sqrt((1.0 + pan) * 0.5)
    for local_index in range(length):
        t = local_index / SAMPLE_RATE
        phase = 2.0 * math.pi * frequency * t
        if wave_type == "triangle":
            value = 2.0 * abs(2.0 * ((t * frequency) % 1.0) - 1.0) - 1.0
        elif wave_type == "saw":
            value = 2.0 * ((t * frequency) % 1.0) - 1.0
        else:
            value = math.sin(phase)
        gain = amplitude * envelope(local_index, length, attack, release)
        position = start_index + local_index
        buffer_left[position] += value * gain * left_gain
        buffer_right[position] += value * gain * right_gain


def add_noise(
    buffer_left: list[float],
    buffer_right: list[float],
    start: float,
    duration: float,
    amplitude: float,
    *,
    seed: int,
    attack: float = 0.02,
    release: float = 0.25,
    pan: float = 0.0,
    smoothing: int = 120,
) -> None:
    rng = random.Random(seed)
    start_index = max(0, int(start * SAMPLE_RATE))
    end_index = min(FRAMES, int((start + duration) * SAMPLE_RATE))
    length = end_index - start_index
    if length <= 1:
        return
    left_gain = math.sqrt((1.0 - pan) * 0.5)
    right_gain = math.sqrt((1.0 + pan) * 0.5)
    recent = [0.0] * smoothing
    total = 0.0
    cursor = 0
    for local_index in range(length):
        raw = rng.uniform(-1.0, 1.0)
        total -= recent[cursor]
        recent[cursor] = raw
        total += raw
        cursor = (cursor + 1) % smoothing
        value = total / smoothing
        gain = amplitude * envelope(local_index, length, attack, release)
        position = start_index + local_index
        buffer_left[position] += value * gain * left_gain
        buffer_right[position] += value * gain * right_gain


def write_stereo(path: Path, left: list[float], right: list[float]) -> None:
    peak = max(1.0, max(abs(sample) for sample in left), max(abs(sample) for sample in right))
    scale = 0.96 / peak
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(SAMPLE_RATE)
        chunks = bytearray()
        for l_value, r_value in zip(left, right):
            l_int = int(max(-1.0, min(1.0, l_value * scale)) * 32767)
            r_int = int(max(-1.0, min(1.0, r_value * scale)) * 32767)
            chunks.extend(struct.pack("<hh", l_int, r_int))
        output.writeframes(bytes(chunks))


def build_music() -> Path:
    left = [0.0] * FRAMES
    right = [0.0] * FRAMES
    scenes = [
        (0.0, 3.0, (73.42, 110.0, 146.83)),
        (3.0, 4.5, (82.41, 123.47, 164.81)),
        (7.5, 4.5, (65.41, 98.0, 146.83)),
        (12.0, 5.0, (69.30, 103.83, 155.56)),
        (17.0, 4.0, (73.42, 110.0, 164.81)),
        (21.0, 5.0, (61.74, 92.50, 138.59)),
        (26.0, 5.0, (55.0, 82.41, 123.47)),
        (31.0, 7.0, (61.74, 92.50, 146.83)),
        (38.0, 8.5, (55.0, 82.41, 123.47)),
    ]
    for scene_index, (start, duration, chord) in enumerate(scenes):
        overlap_start = max(0.0, start - 0.75)
        overlap_duration = duration + 1.35
        for note_index, frequency in enumerate(chord):
            add_tone(
                left,
                right,
                overlap_start,
                overlap_duration,
                frequency,
                0.035 / (note_index + 1),
                attack=1.0,
                release=1.25,
                pan=(-0.22 + note_index * 0.22),
            )
        add_tone(
            left,
            right,
            overlap_start,
            overlap_duration,
            chord[0] / 2.0,
            0.018,
            attack=1.1,
            release=1.3,
            wave_type="triangle",
            pan=0.0,
        )
        if scene_index % 2 == 0:
            add_tone(left, right, start + 0.25, 1.6, chord[1] * 2.0, 0.006, attack=0.2, release=0.8, pan=0.3)

    for pulse_time in [0.0, 3.0, 7.5, 12.0, 17.0, 21.0, 26.0, 31.0, 38.0]:
        add_tone(left, right, pulse_time, 0.75, 54.0, 0.026, attack=0.01, release=0.5, wave_type="triangle")

    fade_start = 42.0
    for index in range(int(fade_start * SAMPLE_RATE), FRAMES):
        t = (index / SAMPLE_RATE - fade_start) / (DURATION - fade_start)
        fade = max(0.0, 1.0 - t) ** 1.6
        left[index] *= fade
        right[index] *= fade

    path = OUT_DIR / "music.wav"
    write_stereo(path, left, right)
    return path


def build_sfx() -> Path:
    left = [0.0] * FRAMES
    right = [0.0] * FRAMES

    # Hook impact and fast paper whoosh.
    add_tone(left, right, 0.06, 0.52, 52.0, 0.34, attack=0.005, release=0.38, wave_type="triangle")
    add_noise(left, right, 0.02, 0.62, 0.34, seed=16, release=0.45, pan=-0.15, smoothing=24)
    add_tone(left, right, 0.26, 0.24, 680.0, 0.055, attack=0.002, release=0.12, pan=0.3)

    # Paper/card transitions.
    for index, cue in enumerate([3.0, 7.5, 17.0, 21.0]):
        add_noise(left, right, cue, 0.34, 0.18, seed=100 + index, release=0.25, pan=-0.35 + index * 0.2, smoothing=38)
        add_tone(left, right, cue + 0.04, 0.22, 310.0 + index * 45, 0.025, attack=0.005, release=0.15, pan=0.25)

    # Bretton Woods stamp.
    add_tone(left, right, 13.35, 0.42, 76.0, 0.30, attack=0.003, release=0.25, wave_type="saw")
    add_tone(left, right, 13.37, 0.62, 38.0, 0.18, attack=0.003, release=0.38)

    # Gold link clicks.
    for cue in [18.95, 19.20, 19.45, 19.70]:
        add_tone(left, right, cue, 0.12, 940.0, 0.035, attack=0.001, release=0.06, pan=-0.2)
        add_tone(left, right, cue, 0.16, 470.0, 0.024, attack=0.001, release=0.08, pan=0.2)

    # 1971 chain break.
    add_tone(left, right, 26.62, 0.36, 92.0, 0.40, attack=0.002, release=0.21, wave_type="saw")
    add_noise(left, right, 26.58, 0.52, 0.42, seed=1971, release=0.31, smoothing=18)
    add_tone(left, right, 26.72, 0.7, 41.0, 0.22, attack=0.004, release=0.48)

    # Oil, bank and network pulses.
    add_tone(left, right, 31.1, 0.55, 62.0, 0.22, attack=0.01, release=0.35, wave_type="triangle")
    for cue, pan in [(32.2, -0.35), (33.3, 0.2), (34.4, -0.1), (35.5, 0.38), (36.6, 0.0)]:
        add_tone(left, right, cue, 0.24, 720.0, 0.022, attack=0.002, release=0.13, pan=pan)
        add_tone(left, right, cue, 0.32, 180.0, 0.016, attack=0.002, release=0.18, pan=-pan)

    # Final resolve.
    add_tone(left, right, 38.15, 1.4, 49.0, 0.20, attack=0.08, release=0.95)
    for index, cue in enumerate([39.0, 39.45, 39.90, 40.35, 40.80]):
        add_tone(left, right, cue, 0.48, 392.0 * (1.0 + index * 0.12), 0.025, attack=0.03, release=0.28, pan=-0.4 + index * 0.2)

    path = OUT_DIR / "sfx.wav"
    write_stereo(path, left, right)
    return path


def main() -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg is required")

    source_voice = OUT_DIR / "heygen-source.wav"
    voice = OUT_DIR / "voice.wav"
    final = OUT_DIR / "final.wav"
    download_voice(source_voice)

    run(
        "ffmpeg",
        "-y",
        "-i",
        str(source_voice),
        "-af",
        (
            "atempo=1.075,highpass=f=70,lowpass=f=12000,"
            "acompressor=threshold=-18dB:ratio=2.2:attack=15:release=180,"
            "alimiter=limit=0.92,apad"
        ),
        "-t",
        str(DURATION),
        "-ar",
        str(SAMPLE_RATE),
        "-ac",
        "2",
        str(voice),
    )

    music = build_music()
    sfx = build_sfx()

    run(
        "ffmpeg",
        "-y",
        "-i",
        str(voice),
        "-i",
        str(music),
        "-i",
        str(sfx),
        "-filter_complex",
        (
            "[1:a][0:a]sidechaincompress=threshold=0.018:ratio=10:attack=18:release=320[ducked];"
            "[0:a]volume=1.0[voice];"
            "[ducked]volume=0.62[music];"
            "[2:a]volume=0.74[sfx];"
            "[voice][music][sfx]amix=inputs=3:duration=first:normalize=0,"
            "acompressor=threshold=-16dB:ratio=1.8:attack=12:release=220,"
            "alimiter=limit=0.94[out]"
        ),
        "-map",
        "[out]",
        "-t",
        str(DURATION),
        "-ar",
        str(SAMPLE_RATE),
        "-ac",
        "2",
        str(final),
    )

    print(final)


if __name__ == "__main__":
    main()
