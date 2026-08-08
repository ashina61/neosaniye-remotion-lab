"""Generate V9 narration + a restrained documentary score.
Run after installing edge-tts: pip install edge-tts
"""
import asyncio
import math
import subprocess
import wave
from pathlib import Path

import edge_tts

TOTAL_SECONDS = 30.0
SCENE_SECONDS = 5.0
ROOT = Path('public/hormuz-crisis-v9/audio')
ROOT.mkdir(parents=True, exist_ok=True)
LINES = [
    'Dünya petrolünün yaklaşık beşte biri, İran ile Umman arasındaki bu dar geçitten akıyor: Hürmüz Boğazı.',
    '2026’da ABD ve İran arasındaki savaş yeniden alevlenince, bu ticaret yolu bir anda cephe hattına dönüştü.',
    'İran’ın gemi geçişlerini kısıtlaması ve saldırı tehdidi, dünyanın en önemli enerji rotalarından birini felç etti.',
    'Washington ise seyrüsefer özgürlüğünü savunarak donanmasını bölgede tutuyor ve İran’ın kontrol taleplerine karşı çıkıyor.',
    'Şimdi Umman arabuluculuğunda yeni bir geçiş düzeni konuşuluyor; fakat Hürmüz hâlâ eski normaline dönmüş değil.',
    'Çünkü burada yapılacak tek bir yanlış hesap, petrol fiyatlarından küresel ticarete kadar bütün dünyayı sarsabilir.',
]


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def duration(path: Path) -> float:
    return float(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(path),
    ], text=True).strip())


async def narration() -> None:
    clips = []
    for i, line in enumerate(LINES):
        mp3 = ROOT / f'line-{i + 1:02d}.mp3'
        wav = ROOT / f'line-{i + 1:02d}.wav'
        await edge_tts.Communicate(line, voice='tr-TR-AhmetNeural', rate='+14%', pitch='-3Hz').save(str(mp3))
        raw = duration(mp3)
        target = 4.62
        speed = max(1.0, raw / target)
        run('ffmpeg', '-y', '-i', str(mp3), '-af', f'highpass=f=75,lowpass=f=11500,atempo={speed:.5f},alimiter=limit=0.95', '-ar', '44100', '-ac', '2', str(wav))
        mp3.unlink(missing_ok=True)
        clips.append(wav)

    cmd = ['ffmpeg', '-y']
    for clip in clips:
        cmd += ['-i', str(clip)]
    filters = []
    labels = []
    for i in range(6):
        delay = int((i * SCENE_SECONDS + 0.16) * 1000)
        filters.append(f'[{i}:a]adelay={delay}|{delay}[a{i}]')
        labels.append(f'[a{i}]')
    filters.append(''.join(labels) + 'amix=inputs=6:duration=longest:normalize=0,alimiter=limit=0.96[out]')
    cmd += ['-filter_complex', ';'.join(filters), '-map', '[out]', '-t', '30', '-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le', str(ROOT / 'narration-master-v9.wav')]
    run(*cmd)
    for clip in clips:
        clip.unlink(missing_ok=True)


def score() -> None:
    rate = 44100
    n = int(rate * TOTAL_SECONDS)
    samples = []
    for i in range(n):
        t = i / rate
        pulse = max(0, math.sin(2 * math.pi * 0.52 * t)) ** 10
        tension = 0.007 * math.sin(2 * math.pi * 44 * t) + 0.004 * math.sin(2 * math.pi * 73.4 * t)
        tick = 0.0025 * math.sin(2 * math.pi * 430 * t) * pulse
        env = min(1, t / 0.8, (TOTAL_SECONDS - t) / 1.1)
        samples.append((tension + tick) * max(0, env))
    peak = max(abs(x) for x in samples) or 1
    with wave.open(str(ROOT / 'score-v9.wav'), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        buf = bytearray()
        for sample in samples:
            value = int(max(-1, min(1, sample / peak * 0.55)) * 32767)
            chunk = value.to_bytes(2, 'little', signed=True)
            buf += chunk + chunk
        output.writeframes(bytes(buf))


async def main() -> None:
    await narration()
    score()
    print('Generated', ROOT / 'narration-master-v9.wav', 'and', ROOT / 'score-v9.wav')


if __name__ == '__main__':
    asyncio.run(main())
