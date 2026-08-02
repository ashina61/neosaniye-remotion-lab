import asyncio
import math
import subprocess
import wave
from pathlib import Path

import edge_tts

ROOT = Path('public/covid-pandemic')
AUDIO = ROOT / 'audio'
SFX = ROOT / 'sfx'
AUDIO.mkdir(parents=True, exist_ok=True)
SFX.mkdir(parents=True, exist_ok=True)

FPS = 30
SCENE_FRAMES = [195, 210, 225, 240, 240, 240]
LINES = [
    "2019'un sonunda, yeni bir solunum yolu hastalığı haberi kısa sürede dünyanın dikkatini çekti.",
    "Virüs aylar içinde ülkeler arasında yayıldı. Dünya Sağlık Örgütü, 11 Mart 2020'de Covid-19'u pandemi olarak tanımladı.",
    "Uçuşlar azaldı, okullar ve iş yerleri kapandı. Maske ve mesafe, günlük hayatın parçası oldu.",
    "Hastanelerde en ağır yükü sağlık çalışanları taşıdı. Yoğun bakımlar, salgının görünmeyen cephesi haline geldi.",
    "Araştırmacılar rekor hızda aşı geliştirdi. Aşılama, ağır hastalık riskini azaltan en önemli araçlardan biri oldu.",
    "Pandemi, kayıpların yanında çalışma, eğitim ve sağlık sistemlerini de değiştirdi. Geriye bilim, hazırlık ve dayanışma dersi kaldı.",
]


def run(*args: str) -> None:
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


async def narration() -> None:
    voice = 'tr-TR-AhmetNeural'
    for index, (line, frames) in enumerate(zip(LINES, SCENE_FRAMES), start=1):
        mp3 = AUDIO / f'scene-{index:02d}.mp3'
        wav = AUDIO / f'scene-{index:02d}.wav'
        duration = frames / FPS
        await edge_tts.Communicate(line, voice=voice, rate='+7%', pitch='-2Hz').save(str(mp3))
        run(
            'ffmpeg', '-y', '-i', str(mp3),
            '-af', f'adelay=260|260,volume=1.12,highpass=f=70,lowpass=f=11500,afade=t=out:st={max(0.5, duration - 0.35)}:d=0.3,apad=pad_dur={duration}',
            '-t', f'{duration:.3f}', '-ar', '44100', '-ac', '2', str(wav),
        )
        mp3.unlink(missing_ok=True)


def write_wav(path: Path, samples: list[float], rate: int = 44100) -> None:
    peak = max(1e-6, max(abs(value) for value in samples))
    scale = 0.86 / peak
    pcm = bytearray()
    for value in samples:
        sample = max(-1.0, min(1.0, value * scale))
        integer = int(sample * 32767)
        pcm += integer.to_bytes(2, 'little', signed=True)
        pcm += integer.to_bytes(2, 'little', signed=True)
    with wave.open(str(path), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes(bytes(pcm))


def envelope(time: float, duration: float, attack: float = 0.08, release: float = 0.3) -> float:
    return min(1.0, time / max(attack, 1e-6), (duration - time) / max(release, 1e-6))


def make_score() -> None:
    rate = 44100
    duration = sum(SCENE_FRAMES) / FPS
    total = int(duration * rate)
    samples = [0.0] * total
    chords = [
        (98.0, 146.83, 196.0),
        (87.31, 130.81, 174.61),
        (110.0, 164.81, 220.0),
        (82.41, 123.47, 164.81),
        (98.0, 146.83, 220.0),
        (73.42, 110.0, 146.83),
    ]
    scene_starts = [0.0]
    for frames in SCENE_FRAMES[:-1]:
        scene_starts.append(scene_starts[-1] + frames / FPS)

    for scene_index, (start, frames) in enumerate(zip(scene_starts, SCENE_FRAMES)):
        scene_duration = frames / FPS
        frequencies = chords[scene_index]
        begin = int(start * rate)
        end = min(total, int((start + scene_duration) * rate))
        for sample_index in range(begin, end):
            local = (sample_index - begin) / rate
            value = 0.0
            for tone_index, frequency in enumerate(frequencies):
                phase = tone_index * 0.7
                value += math.sin(2 * math.pi * frequency * local + phase) * (0.018 / (tone_index + 1))
            value += math.sin(2 * math.pi * 49 * local) * 0.008
            pulse = max(0.0, math.sin(2 * math.pi * 0.125 * local)) ** 8
            value += math.sin(2 * math.pi * 294 * local) * pulse * 0.006
            scene_env = envelope(local, scene_duration, 0.9, 1.15)
            samples[sample_index] += value * scene_env

    fade_start = duration - 3.4
    for sample_index in range(total):
        time = sample_index / rate
        if time > fade_start:
            samples[sample_index] *= max(0.0, (duration - time) / (duration - fade_start)) ** 1.45

    write_wav(AUDIO / 'score.wav', samples, rate)


def make_sfx() -> None:
    rate = 44100

    def render(name: str, duration: float, maker) -> None:
        samples = []
        for index in range(int(duration * rate)):
            time = index / rate
            samples.append(maker(time, duration))
        write_wav(SFX / name, samples, rate)

    render(
        'alert.wav',
        0.72,
        lambda t, d: (
            math.sin(2 * math.pi * 740 * t) * envelope(t, d, 0.012, 0.2) * (0.36 if t < 0.18 else 0.0)
            + math.sin(2 * math.pi * 520 * max(0.0, t - 0.27)) * envelope(max(0.0, t - 0.27), d - 0.27, 0.012, 0.18) * (0.25 if t > 0.27 else 0.0)
        ),
    )

    render(
        'shutter.wav',
        1.25,
        lambda t, d: (
            math.sin(2 * math.pi * (105 - 42 * t) * t) * envelope(t, d, 0.02, 0.36) * 0.34
            + math.sin(2 * math.pi * 31 * t) * envelope(t, d, 0.02, 0.25) * 0.18
        ),
    )

    def monitor(time: float, duration: float) -> float:
        value = 0.0
        for beat in [0.12, 0.92, 1.72, 2.52, 3.32, 4.12]:
            local = time - beat
            if 0 <= local <= 0.12:
                value += math.sin(2 * math.pi * 980 * local) * envelope(local, 0.12, 0.006, 0.06) * 0.16
        return value

    render('monitor-bed.wav', 4.5, monitor)

    render(
        'vial-click.wav',
        0.72,
        lambda t, d: (
            math.sin(2 * math.pi * 1250 * t) * envelope(t, d, 0.004, 0.12) * 0.22
            + math.sin(2 * math.pi * 1780 * t) * envelope(t, d, 0.004, 0.16) * 0.11
        ),
    )


async def main() -> None:
    await narration()
    make_score()
    make_sfx()


if __name__ == '__main__':
    asyncio.run(main())
