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
SCENE_SECONDS = [frames / FPS for frames in SCENE_FRAMES]
SCENE_STARTS = [0.0]
for duration in SCENE_SECONDS[:-1]:
    SCENE_STARTS.append(SCENE_STARTS[-1] + duration)

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


def duration_of(path: Path) -> float:
    output = subprocess.check_output(
        [
            'ffprobe',
            '-v',
            'error',
            '-show_entries',
            'format=duration',
            '-of',
            'default=noprint_wrappers=1:nokey=1',
            str(path),
        ],
        text=True,
    )
    return float(output.strip())


async def narration_master() -> None:
    voice = 'tr-TR-AhmetNeural'
    clips: list[Path] = []

    for index, (line, scene_duration) in enumerate(
        zip(LINES, SCENE_SECONDS),
        start=1,
    ):
        mp3 = AUDIO / f'v8-line-{index:02d}.mp3'
        wav = AUDIO / f'v8-line-{index:02d}.wav'
        await edge_tts.Communicate(
            line,
            voice=voice,
            rate='+9%',
            pitch='-3Hz',
        ).save(str(mp3))

        raw_duration = duration_of(mp3)
        max_duration = scene_duration - (0.78 if index < 6 else 1.35)
        speed = max(1.0, raw_duration / max_duration)
        output_duration = raw_duration / speed
        fade_out_start = max(0.25, output_duration - 0.14)

        filters = [
            'highpass=f=72',
            'lowpass=f=11200',
            'volume=1.08',
        ]
        if speed > 1.001:
            filters.append(f'atempo={speed:.5f}')
        filters.extend(
            [
                'afade=t=in:st=0:d=0.035',
                f'afade=t=out:st={fade_out_start:.4f}:d=0.14',
            ],
        )

        run(
            'ffmpeg',
            '-y',
            '-i',
            str(mp3),
            '-af',
            ','.join(filters),
            '-ar',
            '44100',
            '-ac',
            '2',
            str(wav),
        )
        mp3.unlink(missing_ok=True)
        clips.append(wav)

    command = ['ffmpeg', '-y']
    for clip in clips:
        command.extend(['-i', str(clip)])

    filter_parts: list[str] = []
    labels: list[str] = []
    for index, start in enumerate(SCENE_STARTS):
        delay_ms = int((start + 0.30) * 1000)
        label = f'n{index}'
        filter_parts.append(
            f'[{index}:a]adelay={delay_ms}|{delay_ms}[{label}]',
        )
        labels.append(f'[{label}]')

    filter_parts.append(
        ''.join(labels)
        + f'amix=inputs={len(labels)}:duration=longest:normalize=0,'
        + 'acompressor=threshold=-18dB:ratio=1.8:attack=18:release=220,'
        + 'alimiter=limit=0.94[narration]',
    )

    command.extend(
        [
            '-filter_complex',
            ';'.join(filter_parts),
            '-map',
            '[narration]',
            '-t',
            f'{sum(SCENE_SECONDS):.3f}',
            '-ar',
            '44100',
            '-ac',
            '2',
            '-c:a',
            'pcm_s16le',
            str(AUDIO / 'narration-master-v8.wav'),
        ],
    )
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    for clip in clips:
        clip.unlink(missing_ok=True)


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


def edge_envelope(time: float, duration: float) -> float:
    fade_in = min(1.0, time / 1.1)
    fade_out = min(1.0, max(0.0, duration - time) / 2.0)
    return max(0.0, min(fade_in, fade_out))


def chord_value(
    frequencies: tuple[float, float, float],
    time: float,
    phase_seed: float,
) -> float:
    value = 0.0
    for tone_index, frequency in enumerate(frequencies):
        phase = phase_seed + tone_index * 0.82
        value += math.sin(2 * math.pi * frequency * time + phase) * (
            0.0155 / (tone_index + 1)
        )
    return value


def make_score_v8() -> None:
    rate = 44100
    duration = sum(SCENE_SECONDS)
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
    transition = 1.25

    for sample_index in range(total):
        time = sample_index / rate
        scene_index = len(SCENE_STARTS) - 1
        for index, start in enumerate(SCENE_STARTS):
            if index + 1 < len(SCENE_STARTS) and time < SCENE_STARTS[index + 1]:
                scene_index = index
                break

        current = chord_value(chords[scene_index], time, scene_index * 0.47)
        value = current

        if scene_index + 1 < len(chords):
            boundary = SCENE_STARTS[scene_index + 1]
            blend_start = boundary - transition
            if time >= blend_start:
                blend = max(0.0, min(1.0, (time - blend_start) / transition))
                blend = blend * blend * (3 - 2 * blend)
                next_value = chord_value(
                    chords[scene_index + 1],
                    time,
                    (scene_index + 1) * 0.47,
                )
                value = current * (1 - blend) + next_value * blend

        value += math.sin(2 * math.pi * 41.2 * time) * 0.007
        value += math.sin(2 * math.pi * 0.085 * time) * 0.003
        sea_pulse = max(0.0, math.sin(2 * math.pi * 0.09 * time - 0.4)) ** 10
        value += math.sin(2 * math.pi * 247 * time) * sea_pulse * 0.0038
        sonar = max(0.0, math.sin(2 * math.pi * 0.052 * time - 1.1)) ** 20
        value += math.sin(2 * math.pi * 392 * time) * sonar * 0.0028
        samples[sample_index] = value * edge_envelope(time, duration)

    write_wav(AUDIO / 'score-v8.wav', samples, rate)


def envelope(
    time: float,
    duration: float,
    attack: float = 0.08,
    release: float = 0.35,
) -> float:
    return max(
        0.0,
        min(
            1.0,
            time / max(attack, 1e-6),
            (duration - time) / max(release, 1e-6),
        ),
    )


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
        for start, frequency, amp in [
            (0.03, 1260, 0.13),
            (0.22, 980, 0.09),
            (0.46, 1260, 0.075),
        ]:
            local = time - start
            if 0 <= local <= 0.11:
                value += (
                    math.sin(2 * math.pi * frequency * local)
                    * envelope(local, 0.11, 0.004, 0.05)
                    * amp
                )
        value += (
            math.sin(2 * math.pi * 58 * time)
            * envelope(time, duration, 0.01, 0.22)
            * 0.045
        )
        return value

    render('radio-alert.wav', 0.78, radio_alert)

    render(
        'ship-horn.wav',
        2.1,
        lambda t, d: (
            math.sin(2 * math.pi * 91 * t) * 0.14
            + math.sin(2 * math.pi * 137 * t) * 0.07
            + math.sin(2 * math.pi * 182 * t) * 0.03
        )
        * envelope(t, d, 0.22, 0.85),
    )

    render(
        'gate-lock.wav',
        0.9,
        lambda t, d: (
            math.sin(2 * math.pi * (93 - 45 * t) * t) * 0.19
            + math.sin(2 * math.pi * 37 * t) * 0.09
            + math.sin(2 * math.pi * 620 * t) * (0.06 if t < 0.07 else 0.0)
        )
        * envelope(t, d, 0.008, 0.42),
    )


async def main() -> None:
    await narration_master()
    make_score_v8()
    make_sfx()


if __name__ == '__main__':
    asyncio.run(main())
