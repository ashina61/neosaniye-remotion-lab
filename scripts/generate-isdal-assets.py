from pathlib import Path
import subprocess, wave, math, struct

OUT = Path('public/isdal')
AUDIO = OUT / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
AUDIO.mkdir(parents=True, exist_ok=True)

SCENES = [
    ('ISDALEN', 'MISTY VALLEY', 'A scorched patch among the rocks', '#26332f', '#7f8f82', '#c53b2c'),
    ('FORENSIC FILE', 'CUT LABELS', 'No name. No identity.', '#2a211d', '#8a6f54', '#d0b46a'),
    ('STATION LOCKER', 'TWO SUITCASES', 'Wigs, currencies, coded notes', '#25262a', '#6f7377', '#c9962e'),
    ('FALSE IDENTITIES', 'HOTEL ALIASES', 'A route across Norway', '#30251f', '#83684f', '#b4312c'),
    ('AUTOPSY', 'CASE CLOSED', 'Pills and carbon monoxide', '#211c19', '#66584d', '#d44b33'),
    ('UNKNOWN WOMAN', 'WHO WAS SHE?', 'Spy — or erased identity?', '#171717', '#55504a', '#b22725'),
]

for i, (eyebrow, title, note, c1, c2, accent) in enumerate(SCENES, 1):
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="#0b0b0b"/></linearGradient>
      <radialGradient id="fog"><stop stop-color="{c2}" stop-opacity=".55"/><stop offset="1" stop-color="{c2}" stop-opacity="0"/></radialGradient>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2"/><feColorMatrix values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 .18 0"/></filter>
    </defs>
    <rect width="1080" height="1920" fill="url(#bg)"/>
    <ellipse cx="540" cy="700" rx="650" ry="520" fill="url(#fog)"/>
    <path d="M0 1320 L170 1080 L320 1220 L510 900 L710 1180 L900 980 L1080 1200 L1080 1920 L0 1920Z" fill="#0c0d0d" opacity=".82"/>
    <path d="M0 1450 C240 1330 420 1510 650 1380 C830 1275 980 1380 1080 1310 L1080 1920 L0 1920Z" fill="#171515" opacity=".95"/>
    <rect x="70" y="110" width="940" height="5" fill="{accent}"/>
    <text x="75" y="175" fill="#ead8ac" font-family="monospace" font-size="34" letter-spacing="8">{eyebrow}</text>
    <text x="75" y="300" fill="#f1e4c4" font-family="Arial Black,Arial" font-size="92" font-weight="900">{title}</text>
    <text x="78" y="370" fill="#c8b997" font-family="Arial" font-size="34">{note}</text>
    <g opacity=".88">
      <rect x="90" y="520" width="900" height="620" rx="18" fill="#120f0d" stroke="{accent}" stroke-width="5"/>
      <circle cx="540" cy="830" r="190" fill="none" stroke="{accent}" stroke-width="16" stroke-dasharray="26 18"/>
      <path d="M390 850 Q540 650 690 850 Q540 1040 390 850Z" fill="{accent}" opacity=".18"/>
      <line x1="260" y1="650" x2="820" y2="1010" stroke="#d8c59a" stroke-width="7" opacity=".45"/>
      <line x1="820" y1="650" x2="260" y2="1010" stroke="#d8c59a" stroke-width="7" opacity=".45"/>
    </g>
    <g transform="translate(120 1290)">
      <rect width="840" height="360" rx="18" fill="#e8ddc2" opacity=".9"/>
      <rect x="34" y="40" width="260" height="210" fill="#2b2824"/>
      <circle cx="164" cy="125" r="54" fill="#9b8c75"/>
      <path d="M85 240 Q164 155 243 240" fill="#9b8c75"/>
      <rect x="330" y="50" width="430" height="18" fill="#3f352c" opacity=".8"/>
      <rect x="330" y="95" width="350" height="13" fill="#5b4b3d" opacity=".65"/>
      <rect x="330" y="135" width="390" height="13" fill="#5b4b3d" opacity=".65"/>
      <rect x="330" y="175" width="290" height="13" fill="#5b4b3d" opacity=".65"/>
      <rect x="330" y="230" width="170" height="46" fill="{accent}"/>
      <rect x="520" y="230" width="240" height="46" fill="#16120f"/>
    </g>
    <rect width="1080" height="1920" filter="url(#grain)" opacity=".5"/>
    </svg>'''
    (OUT / f'scene-{i}.svg').write_text(svg, encoding='utf-8')

text = '''1970’te Norveç’te yürüyüş yapan bir aile, vadinin içinde yanmış bir kadın cesedi buldu. Kadının kıyafetlerindeki bütün etiketler kesilmişti ve üzerinde kimliğini gösterecek hiçbir şey yoktu. Polis, tren istasyonunda ona ait iki valiz buldu: peruklar, farklı para birimleri ve şifreli notlarla doluydu. Kadın otellere sürekli farklı isimlerle kayıt olmuş, birçok dil konuşmuş ve ülke boyunca gizemli bir rota izlemişti. Otopsi, uyku haplarıyla karbonmonoksiti işaret etti; polis olayı muhtemel intihar olarak kapattı. Ama gerçek adı hâlâ bilinmiyor. Isdal Kadını bir casus muydu, yoksa kimliği özellikle mi silindi?'''
subprocess.run(['edge-tts', '--voice', 'tr-TR-AhmetNeural', '--rate', '+14%', '--pitch', '-4Hz', '--text', text, '--write-media', str(AUDIO / 'narration.mp3')], check=True)

rate = 44100
dur = 40
with wave.open(str(AUDIO / 'ambience.wav'), 'w') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(rate)
    for n in range(rate * dur):
        t = n / rate
        v = math.sin(2 * math.pi * 47 * t) * .08 + math.sin(2 * math.pi * 71 * t) * .04 + math.sin(2 * math.pi * .13 * t) * .03
        w.writeframesraw(struct.pack('<h', int(max(-1, min(1, v)) * 32767)))
subprocess.run(['ffmpeg', '-y', '-i', str(AUDIO / 'ambience.wav'), '-codec:a', 'libmp3lame', '-b:a', '128k', str(AUDIO / 'ambience.mp3')], check=True)
