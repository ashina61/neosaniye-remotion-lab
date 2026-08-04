import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const language = plan.language === 'tr' ? 'tr' : 'en';
const topic = String(plan.topic || '').toLowerCase();

const STORY_BOOK = [
  {
    id: 'undersea-cable-mechanism-v1',
    match: /\b(undersea|submarine|subsea)\b.*\bcable|\bcable.*\b(internet|ocean|submarine|undersea)/i,
    en: [
      {
        title: 'THE PHYSICAL INTERNET',
        kicker: 'OCEAN FLOOR · GLOBAL TRAFFIC',
        voiceLine: 'Most international internet traffic travels through cables resting on the seabed.',
        concepts: ['international internet traffic', 'submarine cable', 'ocean floor'],
        kind: 'realistic-object',
      },
      {
        title: 'ROUTES ARE SURVEYED',
        kicker: 'CABLE SHIP · PLANNED CORRIDOR',
        voiceLine: 'Cable ships lower planned routes carefully across thousands of ocean kilometers.',
        concepts: ['cable ship', 'planned ocean route', 'seabed survey'],
        kind: 'environment',
      },
      {
        title: 'LAYERS PROTECT GLASS',
        kicker: 'FIBER · POWER · ARMOR',
        voiceLine: 'Each cable surrounds glass fibers with insulation, power conductors, and protective armor.',
        concepts: ['glass fibers', 'power conductor', 'protective armor'],
        kind: 'cross-section',
      },
      {
        title: 'DATA BECOMES LIGHT',
        kicker: 'LASER · DIGITAL PULSES',
        voiceLine: 'Lasers encode digital information into rapid light pulses inside those fibers.',
        concepts: ['laser transmitter', 'digital information', 'light pulses'],
        kind: 'mechanism',
      },
      {
        title: 'LIGHT STAYS INSIDE',
        kicker: 'GLASS CORE · REFLECTION',
        voiceLine: 'Total internal reflection keeps the light traveling through the glass core.',
        concepts: ['total internal reflection', 'glass core', 'traveling light'],
        kind: 'cross-section',
      },
      {
        title: 'REPEATERS RESTORE SIGNALS',
        kicker: 'LONG ROUTE · OPTICAL BOOST',
        voiceLine: 'Optical repeaters restore weakening signals at intervals along extremely long routes.',
        concepts: ['optical repeater', 'weakening signal', 'long cable route'],
        kind: 'mechanism',
      },
      {
        title: 'THE CABLE REACHES LAND',
        kicker: 'LANDING STATION · DATA CENTER',
        voiceLine: 'Landing stations connect submarine cables to terrestrial networks and data centers.',
        concepts: ['cable landing station', 'terrestrial network', 'data center'],
        kind: 'network',
      },
      {
        title: 'COASTLINES NEED ARMOR',
        kicker: 'ANCHORS · FISHING GEAR',
        voiceLine: 'Near coastlines, extra armor protects cables from anchors and fishing gear.',
        concepts: ['armored shore cable', 'ship anchor', 'fishing gear'],
        kind: 'comparison',
      },
      {
        title: 'DAMAGE CAN BE REPAIRED',
        kicker: 'LOCATE · RAISE · SPLICE',
        voiceLine: 'When damage occurs, repair ships locate, raise, splice, and replace sections.',
        concepts: ['repair ship', 'raised cable section', 'fiber splice'],
        kind: 'evidence',
      },
      {
        title: 'REDUNDANCY KEEPS DATA MOVING',
        kicker: 'ALTERNATE ROUTES · RESILIENCE',
        voiceLine: 'Multiple routes provide redundancy when one cable suddenly stops carrying traffic.',
        concepts: ['alternate cable routes', 'network redundancy', 'rerouted traffic'],
        kind: 'network',
      },
    ],
    tr: [
      {
        title: 'İNTERNETİN FİZİKSEL YOLU',
        kicker: 'OKYANUS TABANI · KÜRESEL TRAFİK',
        voiceLine: 'Uluslararası internet trafiğinin çoğu deniz tabanındaki kablolardan geçer.',
        concepts: ['uluslararası internet trafiği', 'denizaltı kablosu', 'okyanus tabanı'],
        kind: 'realistic-object',
      },
      {
        title: 'ROTA ÖNCEDEN İNCELENİR',
        kicker: 'KABLO GEMİSİ · PLANLI KORİDOR',
        voiceLine: 'Kablo gemileri planlanan rotayı binlerce kilometre boyunca dikkatle döşer.',
        concepts: ['kablo gemisi', 'planlı okyanus rotası', 'deniz tabanı araştırması'],
        kind: 'environment',
      },
      {
        title: 'KATMANLAR CAMI KORUR',
        kicker: 'FİBER · GÜÇ · ZIRH',
        voiceLine: 'Her kablo cam fiberleri yalıtım, güç iletkenleri ve zırhla çevreler.',
        concepts: ['cam fiberler', 'güç iletkeni', 'koruyucu zırh'],
        kind: 'cross-section',
      },
      {
        title: 'VERİ IŞIĞA DÖNÜŞÜR',
        kicker: 'LAZER · DİJİTAL DARBELER',
        voiceLine: 'Lazerler dijital bilgiyi fiberlerin içindeki hızlı ışık darbelerine kodlar.',
        concepts: ['lazer vericisi', 'dijital bilgi', 'ışık darbeleri'],
        kind: 'mechanism',
      },
      {
        title: 'IŞIK ÇEKİRDEKTE KALIR',
        kicker: 'CAM ÇEKİRDEK · YANSIMA',
        voiceLine: 'Tam iç yansıma ışığın cam çekirdek boyunca ilerlemesini sağlar.',
        concepts: ['tam iç yansıma', 'cam çekirdek', 'ilerleyen ışık'],
        kind: 'cross-section',
      },
      {
        title: 'TEKRARLAYICILAR SİNYALİ GÜÇLENDİRİR',
        kicker: 'UZUN ROTA · OPTİK DESTEK',
        voiceLine: 'Optik tekrarlayıcılar uzun rotalarda zayıflayan sinyali yeniden güçlendirir.',
        concepts: ['optik tekrarlayıcı', 'zayıflayan sinyal', 'uzun kablo rotası'],
        kind: 'mechanism',
      },
      {
        title: 'KABLO KARAYA ULAŞIR',
        kicker: 'KIYI İSTASYONU · VERİ MERKEZİ',
        voiceLine: 'Kıyı istasyonları denizaltı kablolarını kara ağlarına ve veri merkezlerine bağlar.',
        concepts: ['kablo kıyı istasyonu', 'kara ağı', 'veri merkezi'],
        kind: 'network',
      },
      {
        title: 'KIYILARDA DAHA FAZLA ZIRH',
        kicker: 'ÇAPA · BALIKÇILIK EKİPMANI',
        voiceLine: 'Kıyılardaki ek zırh kabloları çapalardan ve balıkçılık ekipmanından korur.',
        concepts: ['zırhlı kıyı kablosu', 'gemi çapası', 'balıkçılık ekipmanı'],
        kind: 'comparison',
      },
      {
        title: 'HASAR ONARILABİLİR',
        kicker: 'BUL · KALDIR · EKLE',
        voiceLine: 'Onarım gemileri hasarlı bölümü bulur, kaldırır, ekler ve değiştirir.',
        concepts: ['onarım gemisi', 'kaldırılan kablo bölümü', 'fiber eki'],
        kind: 'evidence',
      },
      {
        title: 'YEDEK ROTALAR TRAFİĞİ KORUR',
        kicker: 'ALTERNATİF YOL · DAYANIKLILIK',
        voiceLine: 'Bir kablo durduğunda alternatif rotalar trafiğin akmaya devam etmesini sağlar.',
        concepts: ['alternatif kablo rotaları', 'ağ yedekliliği', 'yönlendirilen trafik'],
        kind: 'network',
      },
    ],
  },
];

const selected = STORY_BOOK.find((entry) => entry.match.test(topic));
if (!selected) {
  console.log(`V8 Story Director: no curated mechanism contract for "${plan.topic}"; research story retained.`);
  process.exit(0);
}

const story = language === 'tr' ? selected.tr : selected.en;
if (!Array.isArray(plan.scenes) || plan.scenes.length < story.length) {
  throw new Error(`V8 Story Director needs at least ${story.length} base scenes; got ${plan.scenes?.length || 0}.`);
}

const duration = Number(plan.duration || 42);
const hookDuration = Math.min(3.4, Math.max(2.8, duration * 0.075));
const finalDuration = Math.min(4.4, Math.max(3.7, duration * 0.1));
const middleDuration = (duration - hookDuration - finalDuration) / Math.max(1, story.length - 2);
let cursor = 0;
plan.scenes = story.map((item, index) => {
  const base = plan.scenes[index] || {};
  const sceneDuration = index === 0 ? hookDuration : index === story.length - 1 ? finalDuration : middleDuration;
  const props = item.concepts.map((value) => value.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US').slice(0, 32));
  const scene = {
    ...base,
    id: index + 1,
    start: Number(cursor.toFixed(3)),
    duration: Number(sceneDuration.toFixed(3)),
    voiceStart: index === 0 ? 0.06 : 0.12,
    voiceEndPadding: index === story.length - 1 ? 0.5 : 0.28,
    title: item.title,
    kicker: item.kicker,
    voiceLine: item.voiceLine,
    props,
    beats: item.concepts.map((label, beatIndex) => ({
      at: [0.16, 0.44, 0.72][beatIndex],
      label,
      action: ['reveal', 'connect', 'highlight'][beatIndex],
    })),
    heroVisual: item.concepts[0],
    primaryMotif: item.concepts[0],
    secondaryMotif: item.concepts[1],
    supportVisuals: item.concepts.slice(1),
    mustShow: item.concepts,
    visualConcepts: item.concepts,
    subjectTokens: item.concepts.flatMap((value) => value.toLowerCase().split(/\s+/)).slice(0, 16),
    conceptTags: item.concepts.flatMap((value) => value.toLowerCase().split(/\s+/)).slice(0, 12),
    contentRepairSource: 'curated-topic-script',
    storyDirectorSource: selected.id,
    storyDirectorKind: item.kind,
    imagePrompt: `Vertical 9:16 premium documentary scene about ${plan.topic}. Show ${item.concepts.join(', ')} in a believable physical environment. Illustrate exactly: ${item.voiceLine} No generic shapes, no floating cards, no readable captions, no logo, no watermark.`,
    sourceNote: selected.id,
  };
  cursor += sceneDuration;
  return scene;
});
plan.scenes[plan.scenes.length - 1].duration = Number((duration - plan.scenes[plan.scenes.length - 1].start).toFixed(3));
plan.narration = plan.scenes.map((scene) => scene.voiceLine).join(' ');
plan.hook = plan.scenes[0].voiceLine;
plan.title = plan.topic;
plan.storyDirector = {
  version: 1,
  id: selected.id,
  sceneCount: story.length,
  narrationWords: plan.narration.match(/[0-9A-Za-zÇĞİÖŞÜçğıöşü'-]+/g)?.length || 0,
  mechanismFirst: true,
  eventDigressionAllowed: false,
  biographyDigressionAllowed: false,
  failClosed: true,
};
if (plan.storyDirector.narrationWords < 90 || plan.storyDirector.narrationWords > 118) {
  throw new Error(`V8 Story Director narration outside natural range: ${plan.storyDirector.narrationWords} words, expected 90-118.`);
}

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V8 Story Director applied: ${selected.id}, scenes=${story.length}, words=${plan.storyDirector.narrationWords}`);
