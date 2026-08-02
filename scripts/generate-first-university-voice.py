from __future__ import annotations

import asyncio
import json
import math
import random
import struct
import subprocess
import wave
from pathlib import Path

import edge_tts

ROOT = Path('public/first-university')
AUDIO = ROOT / 'audio'
SFX = ROOT / 'sfx'
AUDIO.mkdir(parents=True, exist_ok=True)
SFX.mkdir(parents=True, exist_ok=True)

FPS = 30
SCENES = [
    (165, 'Dünyanın ilk üniversitesi denince, çoğu kaynak Fas’ın Fes kentindeki Karaviyyin’i gösteriyor.'),
    (180, 'Fes, dokuzuncu yüzyılda ticaretin, zanaatın ve bilginin kesiştiği canlı bir şehirdi.'),
    (195, 'Karaviyyin’in temeli, sekiz yüz elli dokuz yılında bir cami ve öğrenim merkezi olarak atıldı.'),
    (180, 'Kuruluşu, mirasını toplum için kullanan Fatıma el Fihri’ye atfediliyor.'),
    (210, 'Burada din, hukuk, dil ve zamanla başka ilim alanlarında dersler verildi.'),
    (225, 'Kurum yüzyıllar boyunca öğretim geleneğini sürdürdü ve Fes’in kültürel kimliğinin merkezinde kaldı.'),
    (210, 'Üniversite tanımı tarihçilere göre değişse de, Guinness onu dünyanın en eski sürekli eğitim kurumu olarak kaydediyor.'),
]

VOICE = 'tr-TR-AhmetNeural'
RATE = '-7%'
SAMPLE_RATE = 44100
random.seed(859)


def run(*args: str) -> None:
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


async def narration() -> None:
    for index, (frames, text) in enumerate(SCENES, start=1):
        raw = AUDIO / f'raw-{index:02d}.mp3'
        final = AUDIO / f'scene-{index:02d}.mp3'
        await edge_tts.Communicate(text=text, voice=VOICE, rate=RATE, pitch='-2Hz').save(str(raw))
        duration = frames / FPS
        run(
            'ffmpeg', '-y', '-i', str(raw),
            '-af', 'apad=pad_dur=2,highpass=f=75,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=7',
            '-t', f'{duration:.3f}', '-b:a', '192k', str(final),
        )
        raw.unlink(missing_ok=True)


def write_wav(path: Path, duration: float, generator) -> None:
    total = int(duration * SAMPLE_RATE)
    with wave.open(str(path), 'wb') as out:
        out.setnchannels(1)
        out.setsampwidth(2)
        out.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for i in range(total):
            t = i / SAMPLE_RATE
            sample = max(-1.0, min(1.0, generator(t, duration)))
            frames += struct.pack('<h', int(sample * 32767))
        out.writeframes(frames)


def env(t: float, duration: float, attack: float = 0.02, release: float = 0.25) -> float:
    a = min(1.0, t / max(attack, 1e-6))
    r = min(1.0, (duration - t) / max(release, 1e-6))
    return max(0.0, min(a, r))


def noise() -> float:
    return random.uniform(-1.0, 1.0)


def make_sfx() -> None:
    write_wav(SFX / 'ink-drop.wav', 0.65, lambda t, d: env(t, d, .005, .3) * (math.sin(2 * math.pi * (120 - 70 * t) * t) * .5 + noise() * .18))
    write_wav(SFX / 'page-turn.wav', 0.9, lambda t, d: env(t, d, .03, .22) * noise() * (.5 + .4 * math.sin(math.pi * t / d)))
    write_wav(SFX / 'map-whoosh.wav', 1.1, lambda t, d: env(t, d, .06, .28) * noise() * math.sin(math.pi * t / d) * .42)
    write_wav(SFX / 'pin.wav', 0.35, lambda t, d: env(t, d, .002, .18) * (math.sin(2 * math.pi * 530 * t) * .36 + math.sin(2 * math.pi * 790 * t) * .2))
    write_wav(SFX / 'stone-thump.wav', 0.8, lambda t, d: env(t, d, .002, .5) * (math.sin(2 * math.pi * (78 - 25 * t) * t) * .65 + noise() * .1))
    write_wav(SFX / 'bell.wav', 1.8, lambda t, d: env(t, d, .004, 1.5) * (math.sin(2 * math.pi * 620 * t) * .28 + math.sin(2 * math.pi * 930 * t) * .17 + math.sin(2 * math.pi * 1240 * t) * .08))
    write_wav(SFX / 'frame-whoosh.wav', 0.9, lambda t, d: env(t, d, .04, .3) * noise() * (.18 + t / d * .45))
    write_wav(SFX / 'paper-slide.wav', 0.8, lambda t, d: env(t, d, .02, .18) * noise() * (.36 + .22 * math.sin(8 * math.pi * t)))
    write_wav(SFX / 'pen-scratch.wav', 1.7, lambda t, d: env(t, d, .02, .12) * noise() * (.18 + .14 * abs(math.sin(28 * math.pi * t))))
    write_wav(SFX / 'book-pop.wav', 0.38, lambda t, d: env(t, d, .002, .2) * (math.sin(2 * math.pi * 180 * t) * .35 + noise() * .11))
    write_wav(SFX / 'shimmer.wav', 2.0, lambda t, d: env(t, d, .03, 1.2) * (math.sin(2 * math.pi * (820 + 250 * t) * t) * .18 + math.sin(2 * math.pi * (1260 + 420 * t) * t) * .1))
    write_wav(SFX / 'stamp.wav', 0.75, lambda t, d: env(t, d, .001, .45) * (math.sin(2 * math.pi * 92 * t) * .62 + noise() * .2))


def make_ambience() -> None:
    duration = sum(frames for frames, _ in SCENES) / FPS

    def ambient(t: float, d: float) -> float:
        air = noise() * .035
        room = math.sin(2 * math.pi * 52 * t) * .018 + math.sin(2 * math.pi * 104 * t) * .009
        breeze = math.sin(2 * math.pi * .08 * t) * noise() * .018
        distant = 0.0
        for mark in (11.0, 25.0, 39.0):
            dt = t - mark
            if 0 <= dt <= 3.2:
                distant += env(dt, 3.2, .02, 2.5) * (math.sin(2 * math.pi * 440 * dt) * .025 + math.sin(2 * math.pi * 660 * dt) * .012)
        return air + room + breeze + distant

    write_wav(AUDIO / 'ambience.wav', duration, ambient)


async def main() -> None:
    await narration()
    make_sfx()
    make_ambience()
    (ROOT / 'audio-manifest.json').write_text(
        json.dumps({'voice': VOICE, 'rate': RATE, 'duration': sum(x for x, _ in SCENES) / FPS, 'scenes': len(SCENES)}, ensure_ascii=False, indent=2),
        encoding='utf-8',
    )
    print('Türkçe anlatım, ambiyans ve 12 SFX üretildi.')


if __name__ == '__main__':
    asyncio.run(main())
