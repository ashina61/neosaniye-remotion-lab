#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
import math
import os
import shutil
import subprocess
from pathlib import Path

import edge_tts

FPS = 30
VOICE = os.getenv("DB_COOPER_VOICE", "tr-TR-AhmetNeural")
RATE = os.getenv("DB_COOPER_VOICE_RATE", "+8%")
PITCH = os.getenv("DB_COOPER_VOICE_PITCH", "-2Hz")
OUTPUT = Path("public/db-cooper/audio")

SCENES = [
    {
        "id": 1,
        "frames": 180,
        "text": "24 Kasım 1971'de takım elbiseli bir adam, Dan Cooper adıyla Portland'dan Seattle'a giden 305 seferine bindi.",
    },
    {
        "id": 2,
        "frames": 210,
        "text": "Kalkıştan sonra hostese bir not verdi. Çantasında bomba olduğunu gösterip sakin kalmasını söyledi.",
    },
    {
        "id": 3,
        "frames": 210,
        "text": "İsteği netti: iki yüz bin dolar ve dört paraşüt. Seattle'da otuz altı yolcu serbest bırakıldı.",
    },
    {
        "id": 4,
        "frames": 240,
        "text": "Uçak yeniden havalandı. Gece sekizi geçerken, yağmur ve sert rüzgârın içinde Boeing 727'nin arka merdiveninden atladı.",
    },
    {
        "id": 5,
        "frames": 240,
        "text": "FBI, NORJAK soruşturmasında yüzlerce kişiyi inceledi. 1980'de nehir kıyısında fidyenin yalnızca beş bin sekiz yüz doları bulundu.",
    },
    {
        "id": 6,
        "frames": 285,
        "text": "Gerçek adı neydi? Atlayıştan sağ çıktı mı? Para nereye gitti? FBI aktif soruşturmayı 2016'da bıraktı. D. B. Cooper gizemi hâlâ çözülmedi.",
    },
]


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def duration_seconds(path: Path) -> float:
    value = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    ).strip()
    return float(value)


def atempo_chain(tempo: float) -> list[str]:
    values: list[float] = []
    while tempo > 2.0:
        values.append(2.0)
        tempo /= 2.0
    while tempo < 0.5:
        values.append(0.5)
        tempo /= 0.5
    values.append(tempo)
    return [f"atempo={value:.6f}" for value in values]


async def synthesize_scene(scene: dict[str, object]) -> dict[str, object]:
    scene_id = int(scene["id"])
    target_duration = int(scene["frames"]) / FPS
    raw_path = OUTPUT / f"scene-{scene_id:02d}-raw.mp3"
    final_path = OUTPUT / f"scene-{scene_id:02d}.mp3"

    communicator = edge_tts.Communicate(
        text=str(scene["text"]),
        voice=VOICE,
        rate=RATE,
        pitch=PITCH,
    )
    await communicator.save(str(raw_path))

    raw_duration = duration_seconds(raw_path)
    speech_window = max(1.0, target_duration - 0.38)
    tempo = raw_duration / speech_window
    filters = atempo_chain(tempo)
    filters.extend(
        [
            "highpass=f=65",
            "lowpass=f=13500",
            "loudnorm=I=-16:TP=-1.5:LRA=7",
            f"apad=pad_dur={target_duration:.3f}",
            f"atrim=duration={target_duration:.3f}",
            "afade=t=in:st=0:d=0.08",
            f"afade=t=out:st={max(0.0, target_duration - 0.22):.3f}:d=0.22",
        ]
    )

    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(raw_path),
            "-af",
            ",".join(filters),
            "-ar",
            "48000",
            "-ac",
            "2",
            "-b:a",
            "192k",
            str(final_path),
        ]
    )
    raw_path.unlink(missing_ok=True)

    return {
        "id": scene_id,
        "text": scene["text"],
        "frames": scene["frames"],
        "duration": target_duration,
        "rawDuration": raw_duration,
        "tempo": tempo,
        "file": final_path.as_posix(),
    }


def generate_ambience(total_duration: float) -> None:
    ambience = OUTPUT / "ambience.wav"
    fade_out_start = max(0.0, total_duration - 2.0)
    filter_complex = (
        "[0:a]highpass=f=28,lowpass=f=620,volume=0.16[n];"
        "[1:a]volume=0.028[s];"
        "[n][s]amix=inputs=2:normalize=0,"
        "afade=t=in:st=0:d=1.4,"
        f"afade=t=out:st={fade_out_start:.3f}:d=2.0,"
        "loudnorm=I=-31:TP=-8:LRA=5[a]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=brown:amplitude=0.08:d={total_duration:.3f}:sample_rate=48000",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=54:d={total_duration:.3f}:sample_rate=48000",
            "-filter_complex",
            filter_complex,
            "-map",
            "[a]",
            "-ar",
            "48000",
            "-ac",
            "2",
            "-c:a",
            "pcm_s16le",
            str(ambience),
        ]
    )


async def main() -> None:
    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise RuntimeError("ffmpeg ve ffprobe gerekli")

    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for scene in SCENES:
        result = await synthesize_scene(scene)
        manifest.append(result)
        print(f"Ses hazır: scene-{int(scene['id']):02d}.mp3")

    total_duration = sum(int(scene["frames"]) for scene in SCENES) / FPS
    generate_ambience(total_duration)

    (OUTPUT / "voice-manifest.json").write_text(
        json.dumps(
            {
                "voice": VOICE,
                "rate": RATE,
                "pitch": PITCH,
                "totalDuration": total_duration,
                "scenes": manifest,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"D.B. Cooper ses paketi hazır: {total_duration:.1f} saniye")


if __name__ == "__main__":
    asyncio.run(main())
