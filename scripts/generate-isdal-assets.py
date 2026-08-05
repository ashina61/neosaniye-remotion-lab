from pathlib import Path
from urllib.parse import quote
import subprocess, urllib.request, wave, math, struct

OUT=Path('public/isdal'); AUDIO=OUT/'audio'; OUT.mkdir(parents=True,exist_ok=True); AUDIO.mkdir(parents=True,exist_ok=True)
style='vertical 9:16 dark true crime documentary collage, 1970s Norway, realistic editorial photography, layered paper textures, muted cream black dark red mustard palette, cinematic lighting, film grain, no readable text, no logos'
prompts=[
'misty Isdalen Norwegian mountain valley, scorched patch among rocks, red evidence marker, distant hiking family silhouettes',
'dim forensic evidence table, dark womens coat, labels cut from clothing, scissors and evidence tags, top down',
'old European railway luggage locker hall, two open brown suitcases, wigs, foreign banknotes and coded notebook',
'unidentified dark haired European woman portrait surrounded by hotel cards, Norway map, red travel route and aliases',
'autopsy investigation desk, sleeping pill bottle, old camping stove, police file stamped closed, ominous',
'dark investigation evidence wall, anonymous woman portrait, black censorship bars, blank identity card, red strings forming question mark'
]
for i,p in enumerate(prompts,1):
    url='https://image.pollinations.ai/prompt/'+quote(style+', '+p)+'?width=1080&height=1920&model=flux&nologo=true&seed='+str(6100+i)
    target=OUT/f'scene-{i}.jpg'
    print('downloading',target)
    urllib.request.urlretrieve(url,target)

text='''1970’te Norveç’te yürüyüş yapan bir aile, vadinin içinde yanmış bir kadın cesedi buldu. Kadının kıyafetlerindeki bütün etiketler kesilmişti ve üzerinde kimliğini gösterecek hiçbir şey yoktu. Polis, tren istasyonunda ona ait iki valiz buldu: peruklar, farklı para birimleri ve şifreli notlarla doluydu. Kadın otellere sürekli farklı isimlerle kayıt olmuş, birçok dil konuşmuş ve ülke boyunca gizemli bir rota izlemişti. Otopsi, uyku haplarıyla karbonmonoksiti işaret etti; polis olayı muhtemel intihar olarak kapattı. Ama gerçek adı hâlâ bilinmiyor. Isdal Kadını bir casus muydu, yoksa kimliği özellikle mi silindi?'''
subprocess.run(['edge-tts','--voice','tr-TR-AhmetNeural','--rate','+14%','--pitch','-4Hz','--text',text,'--write-media',str(AUDIO/'narration.mp3')],check=True)
rate=44100; dur=40
with wave.open(str(AUDIO/'ambience.wav'),'w') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
    for n in range(rate*dur):
        t=n/rate
        v=(math.sin(2*math.pi*47*t)*0.12+math.sin(2*math.pi*71*t)*0.07+math.sin(2*math.pi*0.13*t)*0.05)
        w.writeframesraw(struct.pack('<h',int(max(-1,min(1,v))*32767)))
subprocess.run(['ffmpeg','-y','-i',str(AUDIO/'ambience.wav'),'-codec:a','libmp3lame','-b:a','128k',str(AUDIO/'ambience.mp3')],check=True)
