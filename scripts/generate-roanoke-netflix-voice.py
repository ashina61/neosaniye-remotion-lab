#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
import os
import shutil
import subprocess
from pathlib import Path

import edge_tts

FPS = 30
VOICE = os.getenv("ROANOKE_VOICE", "tr-TR-AhmetNeural")
RATE = os.getenv("ROANOKE_VOICE_RATE", "+5%")
PITCH = os.getenv("ROANOKE_VOICE_PITCH", "-3Hz")
OUTPUT = Path("public/roanoke-netflix/audio")

SCENES = [
    {
        "id": 1,
        "frames": 165,
        "text": "1587'de, 115 İngiliz kolonist Roanoke Adası'nda yeni bir hayat kurdu.",
    },
    {
        "id": 2,
        "frames": 210,
        "text": "Üç yıl sonra yardım gemisi geri döndüğünde, yerleşim tamamen boştu. Ne ceset vardı, ne de çatışma izi.",
    },
    {
        "id": 3,
        "frames": 210,
        "text": "Geride yalnızca iki işaret kalmıştı: Bir ağaca kazınmış CRO ve bir direğe yazılmış CROATOAN.",
    },
    {
        "id": 4,
        "frames": 240,
        "text": "Vali John White bunun yakındaki Croatoan Adası'na bir mesaj olduğunu düşündü; ancak fırtına aramayı durdurdu.",
    },
    {
        "id": 5,
        "frames": 240,
        "text": "Katliam, açlık, İspanyollar ya da yerli halka karışmaları... Her teori bir parçayı açıklıyor, hiçbiri bütününü değil.",
    },
    {
        "id": 6,
        "frames": 270,
        "text": "115 kişi nereye gitti? Dört yüz yıldan uzun süre geçti. Roanoke Kayıp Kolonisi hâlâ cevap vermiyor.",
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
    speech_window = max(1.0, target_duration - 0.42)
    tempo = raw_duration / speech_window
    filters = atempo_chain(tempo)
    filters.extend(
        [
            "highpass=f=62",
            "lowpass=f=13200",
            "acompressor=threshold=-18dB:ratio=2.2:attack=12:release=120",
            "loudnorm=I=-16:TP=-1.5:LRA=7",
            f"apad=pad_dur={target_duration:.3f}",
            f"atrim=duration={target_duration:.3f}",
            "afade=t=in:st=0:d=0.08",
            f"afade=t=out:st={max(0.0, target_duration - 0.24):.3f}:d=0.24",
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
    fade_out_start = max(0.0, total_duration - 2.2)
    filter_complex = (
        "[0:a]highpass=f=24,lowpass=f=520,volume=0.19[n];"
        "[1:a]volume=0.025[s];"
        "[2:a]highpass=f=900,lowpass=f=5200,volume=0.012[w];"
        "[n][s][w]amix=inputs=3:normalize=0,"
        "afade=t=in:st=0:d=1.3,"
        f"afade=t=out:st={fade_out_start:.3f}:d=2.2,"
        "loudnorm=I=-31:TP=-8:LRA=5[a]"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=brown:amplitude=0.085:d={total_duration:.3f}:sample_rate=48000",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency=49:d={total_duration:.3f}:sample_rate=48000",
            "-f",
            "lavfi",
            "-i",
            f"anoisesrc=color=pink:amplitude=0.025:d={total_duration:.3f}:sample_rate=48000",
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
    print(f"Roanoke ses paketi hazır: {total_duration:.1f} saniye")


if __name__ == "__main__":
    asyncio.run(main())
