from __future__ import annotations

import asyncio
import json
import math
import random
import shutil
import struct
import subprocess
import wave
from pathlib import Path

import edge_tts

FPS = 30
SAMPLE_RATE = 48_000
SCENES = [
    (1, 180, 'Yirmi dokuz Mayıs bin dört yüz elli üç sabahı, yalnız bir şehir değil, Akdeniz dünyasının dengesi değişmek üzereydi.'),
    (2, 195, 'Genç Sultan İkinci Mehmet, aylar süren hazırlığın ardından dev topları İstanbul surlarının karşısına yerleştirdi.'),
    (3, 180, 'Theodosius surları yüzyıllardır orduları durdurmuştu. Bu kez sürekli top ateşi, taş duvarları parça parça zayıflatıyordu.'),
    (4, 210, 'Haliç zincirle kapatılınca Osmanlı gemileri karadan yürütüldü. Bir gecede savunmanın arkasında yeni bir cephe açıldı.'),
    (5, 195, 'Son hücum şafaktan önce başladı. Dalgalar hâlinde ilerleyen birlikler, açılan gediklere ve sur kapılarına yöneldi.'),
    (6, 180, 'Şehir düştüğünde İkinci Mehmet artık Fatih diye anılacaktı. İstanbul, Osmanlı başkentinin yeni merkezi oldu.'),
    (7, 210, 'Fetih bir çağın tek cümlelik sonu değildi; ticaret yollarını, siyaseti ve imparatorlukların geleceğini değiştiren büyük bir dönüm noktasıydı.'),
]

ROOT = Path('public/istanbul-conquest')
AUDIO_DIR = ROOT / 'audio'
SFX_DIR = ROOT / 'sfx'
TMP_DIR = Path('.tmp-istanbul-conquest')


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
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
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def write_stereo_wav(path: Path, left: list[float], right: list[float]) -> None:
    if len(left) != len(right):
        raise ValueError('Stereo channel length mismatch')
    data = bytearray()
    for l_value, r_value in zip(left, right):
        l = int(max(-1.0, min(1.0, l_value)) * 32767)
        r = int(max(-1.0, min(1.0, r_value)) * 32767)
        data.extend(struct.pack('<hh', l, r))
    with wave.open(str(path), 'wb') as wav:
        wav.setnchannels(2)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        wav.writeframes(data)


def make_score(duration: float) -> None:
    count = int(duration * SAMPLE_RATE)
    rng = random.Random(1453)
    left: list[float] = []
    right: list[float] = []
    noise_l = 0.0
    noise_r = 0.0
    scene_marks = [0.0, 6.0, 12.5, 18.5, 25.5, 32.0, 38.0]

    for i in range(count):
        t = i / SAMPLE_RATE
        fade_in = min(1.0, t / 2.0)
        fade_out = min(1.0, max(0.0, duration - t) / 3.2)
        envelope = fade_in * fade_out

        resolve = max(0.0, min(1.0, (t - 37.5) / 4.5))
        root = 55.0 + 18.4 * resolve
        drone = (
            math.sin(2 * math.pi * root * t) * 0.42
            + math.sin(2 * math.pi * (root * 1.5) * t + 0.7) * 0.20
            + math.sin(2 * math.pi * (root * 2.0) * t + 1.1) * 0.10
        )
        slow_breath = 0.72 + 0.28 * math.sin(2 * math.pi * 0.075 * t + 0.3)

        noise_l = noise_l * 0.996 + (rng.random() * 2 - 1) * 0.004
        noise_r = noise_r * 0.996 + (rng.random() * 2 - 1) * 0.004

        pulse = 0.0
        for mark in scene_marks:
            dt = t - mark
            if 0 <= dt < 1.3:
                pulse += math.sin(2 * math.pi * (46 - 14 * dt) * dt) * math.exp(-4.2 * dt) * 0.18

        high_air = math.sin(2 * math.pi * 220 * t + math.sin(t * 0.6)) * 0.012
        base = (drone * 0.12 * slow_breath + pulse + high_air) * envelope
        left.append(base + noise_l * 0.18 * envelope)
        right.append(base * 0.98 + noise_r * 0.18 * envelope)

    write_stereo_wav(AUDIO_DIR / 'score.wav', left, right)


def make_cannon() -> None:
    duration = 2.4
    count = int(duration * SAMPLE_RATE)
    rng = random.Random(29)
    left: list[float] = []
    right: list[float] = []
    low_noise = 0.0
    for i in range(count):
        t = i / SAMPLE_RATE
        env = math.exp(-2.35 * t)
        freq = 62.0 - 28.0 * min(1.0, t / 1.2)
        low = math.sin(2 * math.pi * freq * t) * env * 0.70
        low_noise = low_noise * 0.986 + (rng.random() * 2 - 1) * 0.014
        crack = (rng.random() * 2 - 1) * math.exp(-18 * t) * 0.32
        echo_t = max(0.0, t - 0.22)
        echo = math.sin(2 * math.pi * 35 * echo_t) * math.exp(-3.7 * echo_t) * (1 if t >= 0.22 else 0) * 0.18
        sample = (low + low_noise * env * 0.46 + crack + echo) * 0.72
        left.append(sample)
        right.append(sample * 0.96)
    write_stereo_wav(SFX_DIR / 'cannon.wav', left, right)


def make_wood_creak() -> None:
    duration = 1.65
    count = int(duration * SAMPLE_RATE)
    rng = random.Random(22)
    left: list[float] = []
    right: list[float] = []
    filtered = 0.0
    for i in range(count):
        t = i / SAMPLE_RATE
        attack = min(1.0, t / 0.12)
        release = math.exp(-1.75 * t)
        bend = 152 + 58 * math.sin(math.pi * min(1.0, t / duration))
        tone = math.sin(2 * math.pi * bend * t + 1.6 * math.sin(2 * math.pi * 3.1 * t))
        filtered = filtered * 0.94 + (rng.random() * 2 - 1) * 0.06
        scrape = filtered * (0.4 + 0.6 * abs(math.sin(2 * math.pi * 6.4 * t)))
        sample = (tone * 0.20 + scrape * 0.18) * attack * release
        left.append(sample * 0.9)
        right.append(sample)
    write_stereo_wav(SFX_DIR / 'wood-creak.wav', left, right)


def make_stamp() -> None:
    duration = 0.9
    count = int(duration * SAMPLE_RATE)
    rng = random.Random(53)
    left: list[float] = []
    right: list[float] = []
    filtered = 0.0
    for i in range(count):
        t = i / SAMPLE_RATE
        thump = math.sin(2 * math.pi * (74 - 28 * t) * t) * math.exp(-8.5 * t) * 0.52
        filtered = filtered * 0.78 + (rng.random() * 2 - 1) * 0.22
        paper = filtered * math.exp(-14 * t) * 0.28
        sample = (thump + paper) * 0.72
        left.append(sample)
        right.append(sample * 0.97)
    write_stereo_wav(SFX_DIR / 'stamp.wav', left, right)


async def make_narration() -> list[dict[str, object]]:
    manifest: list[dict[str, object]] = []
    for scene_id, frames, text in SCENES:
        target = frames / FPS
        mp3 = TMP_DIR / f'scene-{scene_id:02d}.mp3'
        wav = AUDIO_DIR / f'scene-{scene_id:02d}.wav'
        communicate = edge_tts.Communicate(
            text,
            voice='tr-TR-AhmetNeural',
            rate='-4%',
            pitch='-2Hz',
            volume='+0%',
        )
        await communicate.save(str(mp3))
        source_duration = probe_duration(mp3)
        available = max(1.0, target - 0.72)
        speed = max(1.0, source_duration / available)
        if speed > 2.0:
            raise RuntimeError(f'Scene {scene_id} narration is too long: {source_duration:.2f}s')
        filters = [f'atempo={speed:.6f}' if speed > 1.001 else 'anull']
        filters.extend(
            [
                'adelay=240|240',
                f'apad=pad_dur={target:.3f}',
                f'atrim=duration={target:.3f}',
                'afade=t=in:st=0:d=0.08',
                f'afade=t=out:st={max(0.0, target - 0.48):.3f}:d=0.42',
            ]
        )
        run(
            'ffmpeg',
            '-y',
            '-loglevel',
            'error',
            '-i',
            str(mp3),
            '-af',
            ','.join(filters),
            '-ar',
            str(SAMPLE_RATE),
            '-ac',
            '2',
            '-c:a',
            'pcm_s16le',
            str(wav),
        )
        manifest.append(
            {
                'scene': scene_id,
                'frames': frames,
                'targetSeconds': target,
                'sourceSeconds': source_duration,
                'speed': speed,
                'file': str(wav),
            }
        )
    return manifest


async def main() -> None:
    for directory in (AUDIO_DIR, SFX_DIR, TMP_DIR):
        directory.mkdir(parents=True, exist_ok=True)

    narration_manifest = await make_narration()
    total_duration = sum(frames for _, frames, _ in SCENES) / FPS
    make_score(total_duration)
    make_cannon()
    make_wood_creak()
    make_stamp()

    manifest = {
        'durationSeconds': total_duration,
        'voice': 'tr-TR-AhmetNeural',
        'narration': narration_manifest,
        'sfx': [
            {'file': 'cannon.wav', 'purpose': 'Dev topun ateşlenmesi'},
            {'file': 'wood-creak.wav', 'purpose': 'Gemilerin karadan taşınması'},
            {'file': 'stamp.wav', 'purpose': 'Fatih unvanının görsel damgası'},
        ],
        'mixNote': 'SFX sayısı bilinçli olarak üçle sınırlandı; score sonunda 3.2 saniyede tamamen çözülür.',
    }
    (ROOT / 'audio-manifest.json').write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8'
    )
    shutil.rmtree(TMP_DIR, ignore_errors=True)
    print('İstanbul’un Fethi için anlatım, yumuşak score ve yalnızca 3 anlamlı SFX üretildi.')


if __name__ == '__main__':
    asyncio.run(main())
