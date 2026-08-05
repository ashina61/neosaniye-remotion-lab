#!/usr/bin/env python3
from __future__ import annotations

import asyncio
import json
import math
import os
import random
import struct
import wave
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


async def synthesize(scene_id: int, frames: int, text: str) -> dict[str, object]:
    target = frames / FPS
    final = OUTPUT / f'scene-{scene_id:02d}.mp3'
    await edge_tts.Communicate(text=text, voice=VOICE, rate=RATE, pitch=PITCH).save(str(final))
    return {'id': scene_id, 'frames': frames, 'duration': target, 'text': text}


def create_ambience(total: float) -> None:
    sample_rate = 24000
    count = int(total * sample_rate)
    rng = random.Random(1872)
    phase = 0.0
    brown = 0.0
    out = OUTPUT / 'ambience.wav'
    with wave.open(str(out), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        block = bytearray()
        for i in range(count):
            white = rng.uniform(-1.0, 1.0)
            brown = max(-1.0, min(1.0, brown * 0.997 + white * 0.018))
            phase += 2.0 * math.pi * 47.0 / sample_rate
            drone = math.sin(phase) * 0.08
            fade_in = min(1.0, i / (sample_rate * 1.3))
            fade_out = min(1.0, (count - i) / (sample_rate * 2.0))
            value = (brown * 0.22 + drone) * min(fade_in, fade_out)
            block.extend(struct.pack('<h', int(max(-1.0, min(1.0, value)) * 32767)))
            if len(block) >= 65536:
                wav.writeframesraw(block)
                block.clear()
        if block:
            wav.writeframesraw(block)


async def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for scene_id, frames, text in SCENES:
        manifest.append(await synthesize(scene_id, frames, text))
        print(f'Ses hazır: scene-{scene_id:02d}.mp3')
    total = sum(frames for _, frames, _ in SCENES) / FPS
    create_ambience(total)
    (OUTPUT / 'voice-manifest.json').write_text(json.dumps({
        'voice': VOICE,
        'rate': RATE,
        'pitch': PITCH,
        'totalDuration': total,
        'scenes': manifest,
    }, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'Mary Celeste ses paketi hazır: {total:.1f} saniye')


if __name__ == '__main__':
    asyncio.run(main())
