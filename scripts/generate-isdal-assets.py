from pathlib import Path
import base64, math, struct, subprocess, wave

OUT = Path('public/isdal')
AUDIO = OUT / 'audio'
OUT.mkdir(parents=True, exist_ok=True)
AUDIO.mkdir(parents=True, exist_ok=True)

# Decode the real generated Isdal artwork committed to the repository.
raw = base64.b64decode(Path('assets/isdal-scene-real.b64').read_text(encoding='utf-8'))
for i in range(1, 7):
    (OUT / f'scene-{i}.jpg').write_bytes(raw)

text = '''1970’te Norveç’te yürüyüş yapan bir aile, vadinin içinde yanmış bir kadın cesedi buldu. Kadının kıyafetlerindeki bütün etiketler kesilmişti ve üzerinde kimliğini gösterecek hiçbir şey yoktu. Polis, tren istasyonunda ona ait iki valiz buldu: peruklar, farklı para birimleri ve şifreli notlarla doluydu. Kadın otellere sürekli farklı isimlerle kayıt olmuş, birçok dil konuşmuş ve ülke boyunca gizemli bir rota izlemişti. Otopsi, uyku haplarıyla karbonmonoksiti işaret etti; polis olayı muhtemel intihar olarak kapattı. Ama gerçek adı hâlâ bilinmiyor. Isdal Kadını bir casus muydu, yoksa kimliği özellikle mi silindi?'''
subprocess.run([
    'edge-tts', '--voice', 'tr-TR-AhmetNeural', '--rate', '+14%', '--pitch=-4Hz',
    '--text', text, '--write-media', str(AUDIO / 'narration.mp3')
], check=True)

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
