import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {FactoryPlanSchema, LayoutSchema, MotionSchema, SfxSchema, TransitionSchema, VisualKindSchema} from '../../src/auto-factory/schema.js';
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

const slugify = (value: string) => value
  .toLocaleLowerCase('tr-TR')
  .replace(/[ç]/g,'c').replace(/[ğ]/g,'g').replace(/[ı]/g,'i').replace(/[ö]/g,'o').replace(/[ş]/g,'s').replace(/[ü]/g,'u')
  .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,72) || `neosaniye-${seed}`;

const pool = JSON.parse(await readFile(poolPath,'utf8')) as Record<string,string[]>;
const categories = Object.keys(pool);
const category = requestedCategory !== 'any' && pool[requestedCategory] ? requestedCategory : categories[Math.floor(rng()*categories.length)];
const candidates = pool[category] ?? Object.values(pool).flat();
const topic = topicMode === 'custom' && requestedTopic ? requestedTopic : candidates[Math.floor(rng()*candidates.length)];
const slug = slugify(topic);
const sceneCount = Math.max(14,Math.min(18,Math.round(duration/2.8)));

const ResearchItemSchema = z.object({title:z.string(),url:z.string().url(),excerpt:z.string()});
type ResearchItem = z.infer<typeof ResearchItemSchema>;

const fetchWikipediaResearch = async (): Promise<ResearchItem[]> => {
  if (researchMode === 'none') return [];
  const endpoint = language === 'tr' ? 'https://tr.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  const searchUrl = `${endpoint}?action=query&list=search&srsearch=${encodeURIComponent(topic)}&utf8=1&format=json&origin=*&srlimit=4`;
  const response = await fetch(searchUrl,{headers:{'user-agent':'NeoSaniye-AutoFactory/1.0'}});
  if (!response.ok) return [];
  const result = await response.json() as any;
  const titles = (result?.query?.search ?? []).map((item:any)=>String(item.title)).slice(0,4);
  if (!titles.length) return [];
  const extractUrl = `${endpoint}?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(titles.join('|'))}`;
  const extractResponse = await fetch(extractUrl,{headers:{'user-agent':'NeoSaniye-AutoFactory/1.0'}});
  if (!extractResponse.ok) return [];
  const extracts = await extractResponse.json() as any;
  return Object.values(extracts?.query?.pages ?? {}).map((page:any)=>({
    title:String(page.title ?? ''),
    url:`${language === 'tr' ? 'https://tr.wikipedia.org/wiki/' : 'https://en.wikipedia.org/wiki/'}${encodeURIComponent(String(page.title ?? '').replace(/ /g,'_'))}`,
    excerpt:String(page.extract ?? '').replace(/\s+/g,' ').slice(0,1200)
  })).filter((item:ResearchItem)=>item.title && item.excerpt).slice(0,4);
};

let research: ResearchItem[] = [];
try { research = await fetchWikipediaResearch(); } catch (error) { console.warn('Wikipedia araştırması kullanılamadı.',error); }

const RawSceneSchema = z.object({
  title:z.string().min(1),
  kicker:z.string().default(''),
  visualKind:VisualKindSchema,
  layout:LayoutSchema,
  transition:TransitionSchema,
  motion:MotionSchema,
  sfx:SfxSchema,
  accent:z.enum(['red','teal','gold','blue']),
  props:z.array(z.string()).min(2).max(6),
  imagePrompt:z.string().min(20)
});
const RawPlanSchema = z.object({
  title:z.string().min(2),
  hook:z.string().min(5),
  narration:z.string().min(120),
  scenes:z.array(RawSceneSchema).min(10)
});

const extractJson = (raw:string) => JSON.parse(raw.trim().replace(/^```json\s*/i,'').replace(/```$/i,'').trim());

const generateWithAi = async () => {
  if (!apiKey) return undefined;
  const facts = research.length ? research.map((item,index)=>`SOURCE ${index+1}: ${item.title}\n${item.excerpt}`).join('\n\n') : 'No external source excerpt was available. Avoid precise unstable claims and keep wording cautious.';
  const prompt = `You are the director of NeoSaniye, a fast Turkish vertical documentary Shorts channel. Build a complete plan about: ${topic}.
Target duration: ${duration} seconds. Exact scene count: ${sceneCount}. Language: ${language === 'tr' ? 'Turkish' : 'English'}.
Visual style: premium hand-cut paper collage, archival documentary, detailed SVG-like drawings, rough paper edges, editorial labels, no persistent bottom subtitles.
Pacing rules: first scene is a 2.6-second hard hook; every other development scene is roughly 2.5-3.1 seconds; final scene has a clear payoff and short hold. Something meaningful must animate every 0.7-1.4 seconds. Each scene needs one large subject and 2-4 connected supporting drawings. Never scatter random icons at the bottom.
Narration rules: ${language === 'tr' ? '105-125 Turkish words' : '115-140 English words'}, short sentences, factual, neutral, no CTA, no repetition. The opening sentence must challenge a common assumption or ask a sharp question. The ending must answer the hook.
Allowed visualKind: ${VisualKindSchema.options.join(', ')}.
Allowed layout: ${LayoutSchema.options.join(', ')}.
Allowed transition: ${TransitionSchema.options.join(', ')}.
Allowed motion: ${MotionSchema.options.join(', ')}.
Allowed sfx: ${SfxSchema.options.join(', ')}. Use none often; only 3-6 scenes should have noticeable SFX.
Research excerpts:
${facts}
Return ONLY strict JSON with this shape:
{
 "title":"short video title",
 "hook":"hard first-screen hook",
 "narration":"complete narration",
 "scenes":[
  {"title":"2-5 words","kicker":"max 7 words","visualKind":"...","layout":"...","transition":"...","motion":"...","sfx":"...","accent":"red|teal|gold|blue","props":["2-6 short subject labels"],"imagePrompt":"detailed English vertical 9:16 image prompt, no text"}
 ]
}
Exactly ${sceneCount} scenes. Make consecutive scenes visually different.`;
  const response = await fetch('https://gen.pollinations.ai/v1/chat/completions',{
    method:'POST',
    headers:{'content-type':'application/json',authorization:`Bearer ${apiKey}`},
    body:JSON.stringify({
      model:process.env.POLLINATIONS_TEXT_MODEL || 'openai-fast',
      messages:[{role:'system',content:'Return only valid JSON. Do not use markdown fences.'},{role:'user',content:prompt}],
      temperature:.62
    })
  });
  if (!response.ok) throw new Error(`Pollinations HTTP ${response.status}: ${await response.text()}`);
  const payload = await response.json() as any;
  const raw = payload?.choices?.[0]?.message?.content;
  if (!raw) throw new Error('AI boş yanıt döndürdü');
  return RawPlanSchema.parse(extractJson(raw));
};

const fallbackKinds = VisualKindSchema.options;
const fallbackTitles = ['ŞAŞIRTICI GERÇEK','ESKİ DÜZEN','İLK KIRILMA','DENGE DEĞİŞİYOR','SİSTEM KURULUYOR','HIZLI YAYILIM','KRİTİK BAĞ','BÜYÜK KOPUŞ','NEDEN ÇÖKMEDİ','GÖRÜNMEYEN AĞ','KÜRESEL ETKİ','BUGÜNKÜ SONUÇ','ASIL SEBEP','SON PARÇA','CEVAP'];
const fallbackPlan = () => ({
  title:topic,
  hook:`${topic}: herkesin gözden kaçırdığı kırılma neydi?`,
  narration:`${topic}, tek bir olayla açıklanamayacak kadar büyük bir hikâye taşıyor. Önce eski düzenin nasıl çalıştığını anlamak gerekiyor. Ardından küçük görünen bir karar, dengeyi değiştirdi. Yeni sistem yayıldıkça ülkeler, kurumlar ve insanlar aynı ağın parçası oldu. Bir noktada eski bağlantı koptu fakat düzen çökmedi. Çünkü alışkanlıklar, ticaret yolları ve kurumlar yeni merkezi çoktan güçlendirmişti. Bugünkü sonucu yaratan şey yalnızca güç değil, herkesin aynı sistemi kullanmaya devam etmesiydi.`,
  scenes:Array.from({length:sceneCount},(_,index)=>({
    title:fallbackTitles[index%fallbackTitles.length],
    kicker:index===0?topic:index===sceneCount-1?'HİKÂYENİN CEVABI':`ADIM ${index+1}`,
    visualKind:fallbackKinds[index%fallbackKinds.length],
    layout:LayoutSchema.options[(index*3)%LayoutSchema.options.length],
    transition:TransitionSchema.options[index%TransitionSchema.options.length],
    motion:MotionSchema.options[(index*5)%MotionSchema.options.length],
    sfx:index===0?'impact':index===3?'stamp':index===8?'crack':index===sceneCount-1?'pulse':'none',
    accent:(['red','teal','gold','blue'] as const)[index%4],
    props:[topic.split(' ').slice(0,2).join(' ').toLocaleUpperCase('tr-TR'),`AŞAMA ${index+1}`,'BAĞLANTI'],
    imagePrompt:`Vertical 9:16 premium editorial documentary paper collage about ${topic}, scene ${index+1}, detailed layered subject, no readable text, no logo, no watermark`
  }))
});

let rawPlan;
try {
  rawPlan = await generateWithAi();
  if (rawPlan) console.log('AI ile konuya özel plan üretildi.');
} catch (error) {
  console.warn('AI planı başarısız; deterministik fallback kullanılacak.',error);
  if (strictAi) throw error;
}
rawPlan ??= fallbackPlan();

const selectedScenes = Array.from({length:sceneCount},(_,index)=>rawPlan.scenes[index%rawPlan.scenes.length]);
const hookDuration = duration <= 42 ? 2.45 : 2.6;
const finalDuration = duration >= 50 ? 4.5 : 4.1;
const middleDuration = (duration-hookDuration-finalDuration)/(sceneCount-2);
let cursor = 0;
const scenes = selectedScenes.map((scene,index)=>{
  const sceneDuration = index===0?hookDuration:index===sceneCount-1?finalDuration:middleDuration;
  const normalized = {
    ...scene,
    id:index+1,
    start:Number(cursor.toFixed(3)),
    duration:Number(sceneDuration.toFixed(3)),
    title:scene.title.toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,60),
    kicker:scene.kicker.toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,80),
    props:scene.props.map(value=>value.toLocaleUpperCase(language==='tr'?'tr-TR':'en-US').slice(0,28)).slice(0,6)
  };
  cursor += sceneDuration;
  return normalized;
});
scenes[scenes.length-1].duration = Number((duration-scenes[scenes.length-1].start).toFixed(3));

const plan = FactoryPlanSchema.parse({
  version:1,
  topic,
  slug,
  title:rawPlan.title,
  hook:rawPlan.hook,
  category,
  language,
  duration,
  fps:30,
  seed,
  narration:rawPlan.narration.replace(/\s+/g,' ').trim(),
  palette:palettes[seed%palettes.length],
  research,
  scenes
});

await mkdir(outputPath.split('/').slice(0,-1).join('/')||'.',{recursive:true});
await writeFile(outputPath,JSON.stringify(plan,null,2),'utf8');
await writeFile('public/auto-factory/selected-topic.txt',`${topic}\n`,'utf8');
await writeFile('public/auto-factory/manifest.json',JSON.stringify({generatedAt:new Date().toISOString(),topicMode,requestedTopic,category,seed,aiPlan:Boolean(apiKey),researchMode,researchCount:research.length,sceneCount},null,2),'utf8');
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT,`slug=${slug}\ntopic=${topic.replace(/\n/g,' ')}\nduration=${duration}\nscene_count=${sceneCount}\n`);
}
console.log(`Plan hazır: ${topic} | ${sceneCount} sahne | ${duration}s | ${slug}`);
