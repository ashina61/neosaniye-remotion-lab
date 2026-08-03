import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {
  FactoryPlanSchema,
  LayoutSchema,
  MotionSchema,
  SfxSchema,
  TransitionSchema,
  VisualKindSchema
} from '../../src/auto-factory/schema.js';
import {z} from 'zod';

const topicMode = process.env.TOPIC_MODE || 'random';
const requestedTopic = (process.env.TOPIC || '').trim();
const requestedCategory = process.env.CATEGORY || 'any';
const duration = Math.max(38, Math.min(55, Number(process.env.TARGET_DURATION || 46)));
const language = process.env.LANGUAGE === 'en' ? 'en' : 'tr';
const seed = Number(process.env.SEED || Date.now() % 1_000_000);
const apiKey = process.env.POLLINATIONS_API_KEY;
const strictAi = process.env.STRICT_AI === 'true';
const researchMode = process.env.RESEARCH_MODE || 'wikipedia';
const musicMode = process.env.MUSIC_MODE === 'soft-documentary' ? 'soft-documentary' : 'off';
const outputPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const poolPath = process.env.TOPIC_POOL_PATH || 'config/auto-factory-topics.json';

const palettes = [
  {paper:'#e4d5b5',ink:'#27221d',red:'#963631',teal:'#42666b',gold:'#ba974e',blue:'#526f9d'},
  {paper:'#dfd0ad',ink:'#222729',red:'#a4493f',teal:'#3f7270',gold:'#b78a3f',blue:'#4e668f'},
  {paper:'#e7d9ba',ink:'#2b2520',red:'#8f352f',teal:'#476a6e',gold:'#c19b50',blue:'#596f98'}
];

const rng = (() => {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 0x100000000;
  };
})();

const clamp = (value:number,min:number,max:number) => Math.max(min,Math.min(max,value));
const slugify = (value:string) => value
  .toLocaleLowerCase('tr-TR')
  .replace(/[ç]/g,'c').replace(/[ğ]/g,'g').replace(/[ı]/g,'i').replace(/[ö]/g,'o').replace(/[ş]/g,'s').replace(/[ü]/g,'u')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,72) || `neosaniye-${seed}`;
const words = (value:string) => value.trim().split(/\s+/).filter(Boolean);
const shortLine = (value:string,maxWords=12) => {
  const clean = value.replace(/\[[^\]]+]/g,'').replace(/\s+/g,' ').trim();
  const selected = words(clean).slice(0,maxWords).join(' ');
  return selected ? `${selected.replace(/[.,;:!?]+$/,'')}.` : '';
};
const titleFrom = (value:string,fallback:string) => {
  const ignored = new Set(['ve','veya','ile','için','bir','bu','şu','da','de','nasıl','neden','olan','olarak','the','and','of','to']);
  const picked = words(value.replace(/[.,;:!?]/g,' ')).filter(word=>!ignored.has(word.toLocaleLowerCase('tr-TR'))).slice(0,4);
  return (picked.join(' ') || fallback).toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,60);
};

const pool = JSON.parse(await readFile(poolPath,'utf8')) as Record<string,string[]>;
const categories = Object.keys(pool);
const category = requestedCategory !== 'any' && pool[requestedCategory]
  ? requestedCategory
  : categories[Math.floor(rng()*categories.length)];
const candidates = pool[category] ?? Object.values(pool).flat();
const topic = topicMode === 'custom' && requestedTopic ? requestedTopic : candidates[Math.floor(rng()*candidates.length)];
const slug = slugify(topic);
const sceneCount = Math.max(14,Math.min(18,Math.round(duration/2.8)));

const ResearchItemSchema = z.object({title:z.string(),url:z.string().url(),excerpt:z.string()});
type ResearchItem = z.infer<typeof ResearchItemSchema>;

const fetchWikipediaResearch = async (): Promise<ResearchItem[]> => {
  if (researchMode === 'none') return [];
  const endpoint = language === 'tr' ? 'https://tr.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  const searchUrl = `${endpoint}?action=query&list=search&srsearch=${encodeURIComponent(topic)}&utf8=1&format=json&origin=*&srlimit=5`;
  const response = await fetch(searchUrl,{headers:{'user-agent':'NeoSaniye-AutoFactory/2.0'}});
  if (!response.ok) return [];
  const result = await response.json() as any;
  const titles = (result?.query?.search ?? []).map((item:any)=>String(item.title)).slice(0,5);
  if (!titles.length) return [];
  const extractUrl = `${endpoint}?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}`;
  const extractResponse = await fetch(extractUrl,{headers:{'user-agent':'NeoSaniye-AutoFactory/2.0'}});
  if (!extractResponse.ok) return [];
  const extracts = await extractResponse.json() as any;
  return Object.values(extracts?.query?.pages ?? {}).map((page:any)=>({
    title:String(page.title ?? ''),
    url:`${language === 'tr' ? 'https://tr.wikipedia.org/wiki/' : 'https://en.wikipedia.org/wiki/'}${encodeURIComponent(String(page.title ?? '').replace(/ /g,'_'))}`,
    excerpt:String(page.extract ?? '').replace(/\s+/g,' ').slice(0,1800)
  })).filter((item:ResearchItem)=>item.title && item.excerpt).slice(0,5);
};

let research:ResearchItem[]=[];
try { research=await fetchWikipediaResearch(); } catch(error) { console.warn('Wikipedia araştırması kullanılamadı.',error); }

const BeatSchema = z.object({
  at:z.number().min(0).max(1),
  label:z.string().min(1).max(42),
  action:z.enum(['reveal','connect','focus','stamp','swap','highlight'])
});
const RawSceneSchema = z.object({
  title:z.string().min(1),
  kicker:z.string().default(''),
  voiceLine:z.string().min(4).max(260),
  visualKind:VisualKindSchema,
  layout:LayoutSchema,
  transition:TransitionSchema,
  motion:MotionSchema,
  sfx:SfxSchema,
  accent:z.enum(['red','teal','gold','blue']),
  props:z.array(z.string()).min(2).max(6),
  beats:z.array(BeatSchema).min(2).max(5),
  detailLevel:z.number().int().min(1).max(3).default(2),
  imagePrompt:z.string().min(20),
  sourceNote:z.string().max(160).optional()
});
const RawPlanSchema=z.object({
  title:z.string().min(2),
  hook:z.string().min(5),
  scenes:z.array(RawSceneSchema).min(12)
});
type RawScene=z.infer<typeof RawSceneSchema>;
type RawPlan=z.infer<typeof RawPlanSchema>;
const extractJson=(raw:string)=>JSON.parse(raw.trim().replace(/^```json\s*/i,'').replace(/```$/i,'').trim());

const generateWithAi=async():Promise<RawPlan|undefined>=>{
  if(!apiKey)return undefined;
  const facts=research.length
    ? research.map((item,index)=>`SOURCE ${index+1}: ${item.title}\n${item.excerpt}`).join('\n\n')
    : 'No source excerpt was available. Avoid unstable precise claims and explain the core mechanism cautiously.';
  const prompt=`You are directing a fast premium vertical documentary for NeoSaniye about: ${topic}.
Language: ${language==='tr'?'Turkish':'English'}. Runtime: ${duration} seconds. Exact scenes: ${sceneCount}.
The reference grammar is a Netflix-style editorial documentary: hand-cut archival paper, torn edges, dossier cards, maps, diagrams, red thread, stamps, halftone, parallax, match cuts and meaningful micro-animation. Do not imitate any copyrighted title design or logo. Do not use persistent bottom captions.
CRITICAL AUDIO-SYNC RULE: each scene owns exactly one voiceLine. The visual subject, labels and reveal beats must directly illustrate that same voiceLine. Never place an unrelated generic icon. Each voiceLine must be 5-11 words, natural when read aloud, and form one continuous narration when joined.
PACING: Scene 1 is a hard 2.6-3.0 second hook. Development scenes are approximately 2.4-3.25 seconds. Final scene is a 3.7-4.4 second answer. Every scene needs one dominant subject occupying 55-70 percent of the frame plus 2-4 connected supporting details. Keep important content above the bottom 18 percent.
HOOK: challenge a common assumption, reveal a hidden mechanism, or ask a sharp specific question. No vague phrases such as “şaşırtıcı gerçek”.
VISUAL BEATS: 2-4 beats per scene at normalized times between 0.12 and 0.82. They must reveal, connect, focus, stamp, swap or highlight something mentioned in voiceLine.
Allowed visualKind: ${VisualKindSchema.options.join(', ')}.
Allowed layout: ${LayoutSchema.options.join(', ')}.
Allowed transition: ${TransitionSchema.options.join(', ')}.
Allowed motion: ${MotionSchema.options.join(', ')}.
Allowed sfx: ${SfxSchema.options.join(', ')}. Use noticeable SFX in only 3-6 scenes. Most scenes use none.
Research excerpts:\n${facts}
Return ONLY strict JSON:
{
 "title":"short title",
 "hook":"specific hook",
 "scenes":[
  {"title":"2-5 words","kicker":"max 7 words","voiceLine":"5-11 spoken words","visualKind":"...","layout":"...","transition":"...","motion":"...","sfx":"...","accent":"red|teal|gold|blue","props":["2-6 concrete objects from this line"],"beats":[{"at":0.18,"label":"concrete visual detail","action":"reveal"},{"at":0.52,"label":"second visual detail","action":"connect"}],"detailLevel":2,"imagePrompt":"detailed English 9:16 documentary collage prompt, no readable text","sourceNote":"brief source grounding"}
 ]
}
Exactly ${sceneCount} scenes. Consecutive visualKind, layout and transition values must vary.`;
  const response=await fetch('https://gen.pollinations.ai/v1/chat/completions',{
    method:'POST',
    headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},
    body:JSON.stringify({
      model:process.env.POLLINATIONS_TEXT_MODEL||'openai-fast',
      messages:[{role:'system',content:'Return only valid JSON. No markdown.'},{role:'user',content:prompt}],
      temperature:.48
    })
  });
  if(!response.ok)throw new Error(`Pollinations HTTP ${response.status}: ${await response.text()}`);
  const payload=await response.json() as any;
  const raw=payload?.choices?.[0]?.message?.content;
  if(!raw)throw new Error('AI boş yanıt döndürdü');
  return RawPlanSchema.parse(extractJson(raw));
};

const categoryKinds:Record<string,z.infer<typeof VisualKindSchema>[]>={
  science:['biology','mechanism','object-exploded','timeline','document','archive-wall'],
  economy:['currency','institution','commodity','world-network','document','mechanism'],
  geopolitics:['map-route','document','crowd','institution','archive-wall','timeline'],
  history:['timeline','portrait-dossier','map-route','document','crowd','archive-wall'],
  technology:['mechanism','object-exploded','world-network','factory','document','timeline'],
  mystery:['portrait-dossier','archive-wall','document','map-route','timeline','object-exploded'],
  nature:['biology','map-route','object-exploded','timeline','world-network','mechanism']
};
const categoryProps:Record<string,string[]>={
  science:['HÜCRE','SİNYAL','HAFIZA','MEKANİZMA','TEPKİ'],
  economy:['PARA','BANKA','TİCARET','REZERV','PİYASA'],
  geopolitics:['HARİTA','SINIR','ANLAŞMA','ROTA','GÜÇ'],
  history:['ARŞİV','TARİH','BELGE','DÖNÜM NOKTASI','SONUÇ'],
  technology:['DEVRE','VERİ','SİSTEM','SİNYAL','AĞ'],
  mystery:['DOSYA','KANIT','ROTA','TANIK','SORU'],
  nature:['CANLI','ÇEVRE','DÖNGÜ','UYUM','SİNYAL']
};
const fallbackTransitions=TransitionSchema.options;
const fallbackLayouts=LayoutSchema.options;
const fallbackMotions=MotionSchema.options;
const sourceSentences=research.flatMap(item=>item.excerpt.split(/(?<=[.!?])\s+/)).map(sentence=>shortLine(sentence,11)).filter(sentence=>words(sentence).length>=5);

const genericVoice=(index:number)=>{
  const templates:Record<string,string[]>={
    science:[
      `${topic} önce doğru hedefi tanıyan bir süreçle başlar.`,
      `Sistem yabancı işareti küçük parçalara ayırarak inceler.`,
      `Özel hücreler bu işareti diğer savunma hücrelerine gösterir.`,
      `Ardından hedefe uygun antikor ve hücresel yanıt hazırlanır.`,
      `Asıl avantaj güçlü saldırıdan çok kalıcı hafızadır.`,
      `Aynı işaret yeniden gelirse tepki çok daha hızlıdır.`
    ],
    economy:[
      `${topic} tek bir kararla değil ağ etkisiyle büyüdü.`,
      `Önce güven veren kurumlar ve derin piyasalar oluştu.`,
      `Ticaret arttıkça aynı aracı kullanmak maliyeti düşürdü.`,
      `Bankalar ve devletler rezervlerini aynı sistemde tuttu.`,
      `Krizler düzeni sarssa da kurulan ağ devam etti.`,
      `Sonuçta güç kullanım alışkanlığından da beslendi.`
    ],
    history:[
      `${topic} anlatısının başlangıcı görünen tarihten daha eskidir.`,
      `Önce eski düzenin çatlakları yıllar boyunca büyüdü.`,
      `Bir karar dengeleri değiştiren ilk açık kırılmayı yarattı.`,
      `Yeni aktörler fırsatı kullanarak hızla alan kazandı.`,
      `Belgeler ve rotalar dönüşümün nasıl yayıldığını gösteriyor.`,
      `Bugünkü sonuç bu uzun zincirin son halkasıdır.`
    ],
    geopolitics:[
      `${topic} yalnızca haritadaki bir çizgiyle açıklanamaz.`,
      `Ticaret yolları ve güvenlik kaygıları aynı bölgede kesişti.`,
      `Tarafların attığı küçük adımlar gerilimi giderek büyüttü.`,
      `Anlaşmalar çatışmayı yavaşlattı fakat temel sorunu çözmedi.`,
      `Yeni yığınaklar eski dengenin artık işlemediğini gösterdi.`,
      `Son kırılma yıllardır biriken baskıyı açığa çıkardı.`
    ],
    technology:[
      `${topic} tek parçadan değil bağlantılı katmanlardan oluşur.`,
      `İlk katman girdiyi ölçer ve kullanılabilir veriye çevirir.`,
      `Sonra sistem bilgiyi kurallara göre işler ve yönlendirir.`,
      `Küçük bileşenler eşzamanlı çalışarak büyük sonucu üretir.`,
      `Darboğaz oluştuğunda bütün zincirin hızı düşer.`,
      `Asıl güç parçaların koordinasyonundan gelir.`
    ],
    mystery:[
      `${topic} dosyasında ilk görünen açıklama yeterli değildi.`,
      `Tanıklar ve belgeler aynı zaman çizgisinde buluşmadı.`,
      `Küçük bir ayrıntı olayın yönünü tamamen değiştirdi.`,
      `Rotadaki boşluk araştırmacıların en büyük sorusu oldu.`,
      `Bazı kanıtlar güçlüydü fakat kesin sonuca yetmedi.`,
      `Gizem bu eksik bağlantı yüzünden hâlâ sürüyor.`
    ],
    nature:[
      `${topic} çevreye verilen küçük sinyallerle çalışır.`,
      `Canlı önce değişimi algılar ve uygun tepkiyi seçer.`,
      `Enerji kaybını azaltan davranışlar zamanla öne çıkar.`,
      `Bireysel hareketler birleşince büyük bir düzen oluşur.`,
      `Döngü çevre koşulları değiştikçe kendini yeniden ayarlar.`,
      `Sonuç karmaşık görünen doğal bir koordinasyondur.`
    ]
  };
  const list=templates[category]??templates.science;
  return list[index%list.length];
};

const fallbackPlan=():RawPlan=>{
  const kinds=categoryKinds[category]??categoryKinds.science;
  const props=categoryProps[category]??categoryProps.science;
  const lines=Array.from({length:sceneCount},(_,index)=>{
    if(index===0)return language==='tr'
      ? `${topic} sandığından farklı bir mekanizmayla çalışıyor.`
      : `${topic} works through a mechanism most people miss.`;
    if(index===sceneCount-1)return language==='tr'
      ? `Cevap tek olay değil, birbirine bağlanan bu süreçtir.`
      : `The answer is this chain of connected events, not one moment.`;
    return sourceSentences[index-1]||genericVoice(index-1);
  });
  return {
    title:topic,
    hook:lines[0],
    scenes:lines.map((voiceLine,index):RawScene=>{
      const kind=kinds[index%kinds.length];
      const concrete=[props[index%props.length],props[(index+1)%props.length],props[(index+2)%props.length]];
      return {
        title:index===0?titleFrom(topic,'GİZLİ MEKANİZMA'):titleFrom(voiceLine,`ADIM ${index+1}`),
        kicker:index===0?'GÖRÜNENDEN FARKLI':index===sceneCount-1?'BÜTÜN PARÇALAR BİRLEŞİYOR':concrete.slice(0,2).join(' · '),
        voiceLine:shortLine(voiceLine,index===0?10:11),
        visualKind:kind,
        layout:fallbackLayouts[(index*3)%fallbackLayouts.length],
        transition:fallbackTransitions[index%fallbackTransitions.length],
        motion:fallbackMotions[(index*5)%fallbackMotions.length],
        sfx:index===0?'impact':index===4?'paper':index===9?'stamp':index===sceneCount-1?'pulse':'none',
        accent:(['red','teal','gold','blue'] as const)[index%4],
        props:concrete,
        beats:[
          {at:.18,label:concrete[0],action:'reveal'},
          {at:.48,label:concrete[1],action:'connect'},
          {at:.74,label:concrete[2],action:'highlight'}
        ],
        detailLevel:index===0||index===sceneCount-1?3:2,
        imagePrompt:`Vertical 9:16 premium editorial documentary collage about ${topic}. Scene directly illustrating: ${voiceLine}. Dominant ${kind} subject, connected supporting details, torn archival paper, halftone texture, dossier annotations, foreground middle ground background, no readable text, no logo, no watermark.`,
        sourceNote:research[index%Math.max(1,research.length)]?.title
      };
    })
  };
};

let rawPlan:RawPlan|undefined;
try {
  rawPlan=await generateWithAi();
  if(rawPlan)console.log('AI ile V2 sahne-ses planı üretildi.');
} catch(error) {
  console.warn('AI planı başarısız; konu uyumlu fallback kullanılacak.',error);
  if(strictAi)throw error;
}
rawPlan??=fallbackPlan();

const selectedScenes:RawScene[]=Array.from({length:sceneCount},(_,index)=>rawPlan.scenes[index%rawPlan.scenes.length]);
const hookDuration=duration<=42?2.6:2.8;
const finalDuration=duration>=50?4.3:4.0;
const rawMiddle=selectedScenes.slice(1,-1).map(scene=>clamp(words(scene.voiceLine).length/3.25+.35,2.25,3.35));
const middleTarget=duration-hookDuration-finalDuration;
const middleScale=middleTarget/rawMiddle.reduce((sum,value)=>sum+value,0);
const middleDurations=rawMiddle.map(value=>value*middleScale);
let cursor=0;
const scenes=selectedScenes.map((scene,index)=>{
  const sceneDuration=index===0?hookDuration:index===sceneCount-1?finalDuration:middleDurations[index-1];
  const normalized={
    ...scene,
    id:index+1,
    start:Number(cursor.toFixed(3)),
    duration:Number(sceneDuration.toFixed(3)),
    voiceStart:index===0?.06:.12,
    voiceEndPadding:index===sceneCount-1?.5:.26,
    title:scene.title.toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,60),
    kicker:scene.kicker.toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,80),
    voiceLine:shortLine(scene.voiceLine,index===0?11:13),
    props:scene.props.map(value=>value.toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,32)).slice(0,6),
    beats:scene.beats.sort((a,b)=>a.at-b.at).slice(0,5)
  };
  cursor+=sceneDuration;
  return normalized;
});
scenes[scenes.length-1].duration=Number((duration-scenes[scenes.length-1].start).toFixed(3));
const narration=scenes.map(scene=>scene.voiceLine).join(' ').replace(/\s+/g,' ').trim();

const plan=FactoryPlanSchema.parse({
  version:2,
  topic,
  slug,
  title:rawPlan.title,
  hook:rawPlan.hook,
  category,
  language,
  duration,
  fps:30,
  seed,
  narration,
  musicMode,
  palette:palettes[seed%palettes.length],
  research,
  scenes
});

await mkdir(outputPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
await mkdir('public/auto-factory',{recursive:true});
await writeFile(outputPath,JSON.stringify(plan,null,2),'utf8');
await writeFile('public/auto-factory/selected-topic.txt',`${topic}\n`,'utf8');
await writeFile('public/auto-factory/manifest.json',JSON.stringify({
  generatedAt:new Date().toISOString(),
  factoryVersion:2,
  topicMode,
  requestedTopic,
  category,
  seed,
  aiPlan:Boolean(apiKey&&rawPlan),
  researchMode,
  researchCount:research.length,
  sceneCount,
  musicMode,
  syncMode:'scene-locked-tts'
},null,2),'utf8');
if(process.env.GITHUB_OUTPUT){
  await appendFile(process.env.GITHUB_OUTPUT,`slug=${slug}\ntopic=${topic.replace(/\n/g,' ')}\nduration=${duration}\nscene_count=${sceneCount}\n`);
}
console.log(`V2 plan hazır: ${topic} | ${sceneCount} sahne | ${duration}s | sahne bazlı ses`);
