import asyncio
import math
import subprocess
import wave
from pathlib import Path

import edge_tts

ROOT = Path('public/hormuz-crisis')
AUDIO = ROOT / 'audio'
SFX = ROOT / 'sfx'
AUDIO.mkdir(parents=True, exist_ok=True)
SFX.mkdir(parents=True, exist_ok=True)

FPS = 30
SCENE_FRAMES = [225, 225, 240, 240, 240, 330]
LINES = [
    "12 Temmuz'da İran Devrim Muhafızları, Hürmüz Boğazı'nı ikinci bir duyuruya kadar kapattığını açıkladı.",
    "İran ile Umman arasındaki bu dar geçit, Basra Körfezi'ni Umman Körfezi ve açık denizlere bağlar.",
    "Normal akışta boğazdan günde yaklaşık yirmi milyon varil petrol geçer; bu, dünya tüketiminin yaklaşık beşte biridir.",
    "31 Temmuz'da İran, iki gemiyi durdurduğunu ve dört gemiyi geri çevirdiğini söyledi. Geçiş fiilen ağır biçimde kısıtlandı.",
    "Tankerler beklerken petrol fiyatı yükseldi. Alternatif boru hatları, kaybolan akışın yalnızca küçük bir bölümünü telafi edebiliyor.",
    "2 Ağustos itibarıyla boğazı yeniden açmak için görüşmeler sürüyor. Hürmüz'deki tek bir kriz, bütün dünyanın enerji hesabını değiştirebiliyor.",
]


def run(*args: str) -> None:
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


async def narration() -> None:
    voice = 'tr-TR-AhmetNeural'
    for index, (line, frames) in enumerate(zip(LINES, SCENE_FRAMES), start=1):
        mp3 = AUDIO / f'scene-{index:02d}.mp3'
        wav = AUDIO / f'scene-{index:02d}.wav'
        duration = frames / FPS
        await edge_tts.Communicate(
            line,
            voice=voice,
            rate='+8%',
            pitch='-3Hz',
        ).save(str(mp3))
        fade_start = max(0.5, duration - 0.45)
        run(
            'ffmpeg', '-y', '-i', str(mp3),
            '-af',
            f'adelay=280|280,volume=1.1,highpass=f=72,lowpass=f=11200,afade=t=out:st={fade_start}:d=0.35,apad=pad_dur={duration}',
            '-t', f'{duration:.3f}', '-ar', '44100', '-ac', '2', str(wav),
        )
        mp3.unlink(missing_ok=True)


def write_wav(path: Path, samples: list[float], rate: int = 44100) -> None:
    peak = max(1e-6, max(abs(value) for value in samples))
    scale = 0.88 / peak
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


def envelope(time: float, duration: float, attack: float = 0.08, release: float = 0.35) -> float:
    return max(
        0.0,
        min(
            1.0,
            time / max(attack, 1e-6),
            (duration - time) / max(release, 1e-6),
        ),
    )


def make_score() -> None:
    rate = 44100
    duration = sum(SCENE_FRAMES) / FPS
    total = int(duration * rate)
    samples = [0.0] * total
    chords = [
        (73.42, 110.0, 146.83),
        (82.41, 123.47, 164.81),
        (65.41, 98.0, 146.83),
        (58.27, 87.31, 130.81),
        (73.42, 110.0, 164.81),
        (82.41, 123.47, 174.61),
    ]
    scene_starts = [0.0]
    for frames in SCENE_FRAMES[:-1]:
        scene_starts.append(scene_starts[-1] + frames / FPS)

    for scene_index, (start, frames) in enumerate(zip(scene_starts, SCENE_FRAMES)):
        scene_duration = frames / FPS
        begin = int(start * rate)
        end = min(total, int((start + scene_duration) * rate))
        frequencies = chords[scene_index]
        for sample_index in range(begin, end):
            local = (sample_index - begin) / rate
            value = 0.0
            for tone_index, frequency in enumerate(frequencies):
                phase = tone_index * 0.82
                value += math.sin(2 * math.pi * frequency * local + phase) * (0.017 / (tone_index + 1))
            value += math.sin(2 * math.pi * 41.2 * local) * 0.008
            slow_pulse = max(0.0, math.sin(2 * math.pi * 0.105 * local)) ** 9
            value += math.sin(2 * math.pi * 247 * local) * slow_pulse * 0.0045
            distant_sonar = max(0.0, math.sin(2 * math.pi * 0.055 * local - 1.2)) ** 18
            value += math.sin(2 * math.pi * 392 * local) * distant_sonar * 0.0035
            samples[sample_index] += value * envelope(local, scene_duration, 0.9, 1.2)

    fade_start = duration - 5.5
    for sample_index in range(total):
        time = sample_index / rate
        if time > fade_start:
            samples[sample_index] *= max(0.0, (duration - time) / (duration - fade_start)) ** 1.5

    write_wav(AUDIO / 'score.wav', samples, rate)


def make_sfx() -> None:
    rate = 44100

    def render(name: str, duration: float, maker) -> None:
        samples = []
        for index in range(int(duration * rate)):
            time = index / rate
            samples.append(maker(time, duration))
        write_wav(SFX / name, samples, rate)

    def radio_alert(time: float, duration: float) -> float:
        value = 0.0
        for start, frequency, amp in [(0.03, 1260, 0.16), (0.22, 980, 0.12), (0.46, 1260, 0.1)]:
            local = time - start
            if 0 <= local <= 0.11:
                value += math.sin(2 * math.pi * frequency * local) * envelope(local, 0.11, 0.004, 0.05) * amp
        value += math.sin(2 * math.pi * 58 * time) * envelope(time, duration, 0.01, 0.22) * 0.06
        return value

    render('radio-alert.wav', 0.78, radio_alert)

    render(
        'ship-horn.wav',
        2.1,
        lambda t, d: (
            math.sin(2 * math.pi * 91 * t) * 0.18
            + math.sin(2 * math.pi * 137 * t) * 0.09
            + math.sin(2 * math.pi * 182 * t) * 0.04
        ) * envelope(t, d, 0.22, 0.8),
    )

    render(
        'gate-lock.wav',
        0.9,
        lambda t, d: (
            math.sin(2 * math.pi * (93 - 45 * t) * t) * 0.24
            + math.sin(2 * math.pi * 37 * t) * 0.13
            + math.sin(2 * math.pi * 620 * t) * (0.09 if t < 0.07 else 0.0)
        ) * envelope(t, d, 0.008, 0.42),
    )


async def main() -> None:
    await narration()
    make_score()
    make_sfx()


if __name__ == '__main__':
    asyncio.run(main())
