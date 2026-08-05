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
VOICE = os.getenv('MARY_CELESTE_VOICE', 'tr-TR-AhmetNeural')
RATE = os.getenv('MARY_CELESTE_VOICE_RATE', '+4%')
PITCH = os.getenv('MARY_CELESTE_VOICE_PITCH', '-3Hz')
OUTPUT = Path('public/mary-celeste/audio')

SCENES = [
    (1, 180, "1872'de Atlantik'te sürüklenen Mary Celeste bulundu. Gemi sağlamdı, ama güverte tamamen sessizdi."),
    (2, 120, "New York'tan Cenova'ya gidiyordu. Azorlar yakınında başıboş kalmıştı."),
    (3, 150, 'Kaptan Benjamin Briggs, eşi Sarah, küçük kızı Sophia ve yedi denizci gemideydi.'),
    (4, 180, 'Yiyecekler, eşyalar ve yük yerindeydi. Ambarında su vardı, fakat gemi hâlâ yüzebiliyordu.'),
    (5, 150, 'Tek filika ve bazı seyir araçları kayıptı. On kişiden hiçbir iz bulunamadı.'),
    (6, 210, 'Korsanlık, isyan ve deniz canavarı hikâyeleri anlatıldı. Ama en güçlü teori, alkol buharının mürettebatı korkutmasıydı.'),
    (7, 150, 'Belki de kaptan, patlama olacağını düşünüp herkesi aceleyle filikaya bindirdi.'),
    (8, 210, "Bağlantı ipi koptuysa, gemi uzaklaştı ve filika Atlantik'te kayboldu. Gerçek cevap ise hâlâ bilinmiyor."),
]


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def duration_seconds(path: Path) -> float:
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(path)
    ], text=True).strip())


def atempo_chain(tempo: float) -> list[str]:
    values: list[float] = []
    while tempo > 2.0:
        values.append(2.0)
        tempo /= 2.0
    while tempo < 0.5:
        values.append(0.5)
        tempo /= 0.5
    values.append(tempo)
    return [f'atempo={value:.6f}' for value in values]


async def synthesize(scene_id: int, frames: int, text: str) -> dict[str, object]:
    target = frames / FPS
    raw = OUTPUT / f'scene-{scene_id:02d}-raw.mp3'
    final = OUTPUT / f'scene-{scene_id:02d}.mp3'
    await edge_tts.Communicate(text=text, voice=VOICE, rate=RATE, pitch=PITCH).save(str(raw))
    raw_duration = duration_seconds(raw)
    speech_window = max(1.0, target - 0.34)
    tempo = raw_duration / speech_window
    filters = atempo_chain(tempo)
    filters += [
        'highpass=f=65',
        'lowpass=f=14000',
        'acompressor=threshold=-18dB:ratio=2.2:attack=10:release=120',
        'loudnorm=I=-16:TP=-1.5:LRA=7',
        f'apad=pad_dur={target:.3f}',
        f'atrim=duration={target:.3f}',
        'afade=t=in:st=0:d=.07',
        f'afade=t=out:st={max(0, target - .22):.3f}:d=.22',
    ]
    run(['ffmpeg', '-y', '-i', str(raw), '-af', ','.join(filters), '-ar', '48000', '-ac', '2', '-b:a', '192k', str(final)])
    raw.unlink(missing_ok=True)
    return {'id': scene_id, 'frames': frames, 'duration': target, 'rawDuration': raw_duration, 'tempo': tempo, 'text': text}


def ambience(total: float) -> None:
    out = OUTPUT / 'ambience.wav'
    fade_out = max(0.0, total - 2.2)
    graph = (
        '[0:a]highpass=f=25,lowpass=f=780,volume=.17[brown];'
        '[1:a]lowpass=f=95,volume=.035[drone];'
        '[2:a]highpass=f=1100,lowpass=f=5200,volume=.018[hiss];'
        '[brown][drone][hiss]amix=inputs=3:normalize=0,'
        'aecho=0.8:0.35:85|170:0.16|0.08,'
        'afade=t=in:st=0:d=1.4,'
        f'afade=t=out:st={fade_out:.3f}:d=2.2,'
        'loudnorm=I=-31:TP=-8:LRA=5[a]'
    )
    run([
        'ffmpeg', '-y',
        '-f', 'lavfi', '-i', f'anoisesrc=color=brown:amplitude=.08:d={total:.3f}:sample_rate=48000',
        '-f', 'lavfi', '-i', f'sine=frequency=47:d={total:.3f}:sample_rate=48000',
        '-f', 'lavfi', '-i', f'anoisesrc=color=white:amplitude=.03:d={total:.3f}:sample_rate=48000',
        '-filter_complex', graph, '-map', '[a]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', str(out)
    ])


async def main() -> None:
    if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):
        raise RuntimeError('ffmpeg ve ffprobe gerekli')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for scene_id, frames, text in SCENES:
        manifest.append(await synthesize(scene_id, frames, text))
        print(f'Ses hazır: scene-{scene_id:02d}.mp3')
    total = sum(frames for _, frames, _ in SCENES) / FPS
    ambience(total)
    (OUTPUT / 'voice-manifest.json').write_text(json.dumps({
        'voice': VOICE, 'rate': RATE, 'pitch': PITCH, 'totalDuration': total, 'scenes': manifest
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Mary Celeste ses paketi hazır: {total:.1f} saniye')


if __name__ == '__main__':
    asyncio.run(main())
