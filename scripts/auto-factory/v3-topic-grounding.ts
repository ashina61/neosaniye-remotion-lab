import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8')) as Record<string, any>;
type Scene = Record<string, any>;
type VisualKind =
  | 'world-network' | 'currency' | 'timeline' | 'map-route' | 'factory' | 'document'
  | 'treaty-table' | 'commodity' | 'institution' | 'link-break' | 'mechanism' | 'crowd'
  | 'biology' | 'portrait-dossier' | 'object-exploded' | 'archive-wall' | 'microbe-field'
  | 'selection-process' | 'gene-transfer' | 'before-after' | 'cause-effect' | 'process-flow'
  | 'evidence-board' | 'map-evolution' | 'comparison';
type SemanticAction = 'reveal' | 'transform' | 'compare' | 'connect' | 'spread' | 'filter' | 'assemble' | 'trace' | 'multiply' | 'collapse';
type Profile = {
  visualWorld: string;
  primaryMotifs: string[];
  secondaryMotifs: string[];
  forbiddenMotifs: string[];
  paletteMood: string;
  preferredVisualKinds: VisualKind[];
};

const language: 'tr' | 'en' = plan.language === 'tr' ? 'tr' : 'en';
const locale = language === 'tr' ? 'tr-TR' : 'en-US';
const normalize = (value: unknown) => String(value || '')
  .toLocaleLowerCase(locale)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const words = (value: unknown) => normalize(value).split(' ').filter(Boolean);
const unique = <T,>(items: T[]) => [...new Set(items.filter(Boolean))];
const sentence = (value: unknown) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return clean;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
};
const compact = (value: unknown, max: number) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const parts = clean.split(' ');
  let result = '';
  for (const part of parts) {
    const candidate = result ? `${result} ${part}` : part;
    if (candidate.length > max) break;
    result = candidate;
  }
  return result || clean.slice(0, max);
};

const STOP = new Set(language === 'tr'
  ? ['ve','ile','icin','gibi','ama','fakat','olan','olarak','bir','bu','su','o','daha','sonra','kadar','cok','her','bile','ise','de','da','ki','mi','mu','mı','mü','nasıl','neden','nedir']
  : ['the','and','for','with','that','this','from','into','then','than','when','while','where','what','how','why','are','was','were','has','have','had','can','could','would','will','its','their','our','your','more','most','some','only','also','does','did']);
const PLACEHOLDERS = new Set([
  'main subject','supporting detail','key mechanism','source object','context layer','unique scene',
  'ana konu','destekleyici detay','ana nesne',
]);
const contentTokens = (value: unknown) => unique(words(value).filter((token) => token.length > 2 && !STOP.has(token)));
const isPlaceholder = (value: unknown) => PLACEHOLDERS.has(normalize(value));
const scenes = Array.isArray(plan.scenes) ? plan.scenes as Scene[] : [];
if (!scenes.length) throw new Error('Topic grounding received no scenes');
const haystack = normalize(`${plan.topic} ${plan.title} ${plan.hook} ${plan.category} ${scenes.map((scene) => scene.voiceLine).join(' ')}`);
const hasAny = (...needles: string[]) => needles.some((needle) => haystack.includes(normalize(needle)));

const profiles: Record<string, Profile> = {
  'ai-image-generation': {
    visualWorld: 'ai-image-generation',
    primaryMotifs: ['text prompt card','training image dataset','neural network layers','latent noise canvas','denoising steps','pixel grid','attention map','GPU processor','color channels','generated image frame'],
    secondaryMotifs: ['token stream','model weights','noise particles','feature map','image variations','resolution grid','data arrows','final comparison'],
    forbiddenMotifs: ['bacteria colony','generic world map','ancient document','random currency symbol','unrelated factory smoke'],
    paletteMood: 'electric-cyan-magenta-digital',
    preferredVisualKinds: ['process-flow','mechanism','object-exploded','before-after','world-network','comparison','factory','evidence-board','timeline','cause-effect'],
  },
  microbiology: {
    visualWorld: 'microscopic-biology',
    primaryMotifs: ['bacterial colony','antibiotic capsule','resistant bacterium','DNA strand','mutation site','plasmid ring','petri dish','hospital ward','infection cluster','treatment timeline'],
    secondaryMotifs: ['cell membrane','selection pressure','dying bacteria','surviving strain','gene transfer bridge','medicine dose','patient pathway','water and animal route'],
    forbiddenMotifs: ['generic laptop','stock market chart','ancient caravan','space rocket','random office dashboard'],
    paletteMood: 'sterile-blue-teal-warning-red',
    preferredVisualKinds: ['microbe-field','selection-process','object-exploded','gene-transfer','cause-effect','before-after','process-flow','map-evolution','evidence-board','timeline'],
  },
  'atmospheric-electricity': {
    visualWorld: 'atmospheric-electricity',
    primaryMotifs: ['towering thundercloud','positive and negative charge layers','electric field between cloud and ground','stepped leader descending','upward streamer rising','branching lightning channel','ground strike point','thunder shock wave','storm cell cross-section','fading electrical discharge'],
    secondaryMotifs: ['ice particle collisions','charged cloud base','opposite charge region','ionized air path','bright return stroke','grounded object','expanding pressure wave','rain curtain'],
    forbiddenMotifs: ['volcano cone','magma chamber','bacteria colony','generic office dashboard','currency chart'],
    paletteMood: 'storm-blue-electric-cyan-warning-gold',
    preferredVisualKinds: ['cause-effect','mechanism','object-exploded','process-flow','before-after','comparison','timeline','world-network','evidence-board','map-evolution'],
  },
  volcanology: {
    visualWorld: 'volcanology',
    primaryMotifs: ['volcano cone cross-section','magma chamber','tectonic plate boundary','rising magma column','gas pressure pocket','fractured volcanic vent','eruption column','ash cloud','lava flow','collapsed caldera'],
    secondaryMotifs: ['mantle heat','rock fracture','magma conduit','pressure arrows','crater rim','pyroclastic material','ash particles','cooled lava field'],
    forbiddenMotifs: ['lightning charge diagram','bacteria colony','generic laptop','currency chart','ancient treaty'],
    paletteMood: 'charcoal-red-lava-gold-ash',
    preferredVisualKinds: ['object-exploded','mechanism','cause-effect','process-flow','before-after','timeline','comparison','evidence-board','map-evolution','world-network'],
  },
  'atmospheric-nature': {
    visualWorld: 'atmospheric-nature',
    primaryMotifs: ['ballooning spider','silk thread fan','electric field lines','rising air current','cloud layer','landscape launch point','airborne spider','wind route','atmospheric charge','landing web'],
    secondaryMotifs: ['grass blade','warm air column','negative ground charge','positive sky charge','long silk strands','high altitude path','distant terrain','weather boundary'],
    forbiddenMotifs: ['generic business chart','computer motherboard','bacteria petri dish','ancient treaty','random currency'],
    paletteMood: 'sky-cyan-cream-wind-blue',
    preferredVisualKinds: ['biology','cause-effect','process-flow','mechanism','map-evolution','before-after','world-network','comparison','timeline','evidence-board'],
  },
  'historical-trade': {
    visualWorld: 'historical-trade',
    primaryMotifs: ['merchant caravan','trade route map','silk bale','desert oasis','mountain pass','market stall','merchant ledger','coin exchange','port ship','empire checkpoint'],
    secondaryMotifs: ['camel train','road junction','tax seal','cargo crates','city gate','sea lane','translator','weighing scale'],
    forbiddenMotifs: ['modern laptop','neural network','bacteria colony','space station','generic laboratory'],
    paletteMood: 'parchment-red-mustard-trade-blue',
    preferredVisualKinds: ['map-route','process-flow','document','commodity','timeline','world-network','comparison','evidence-board','cause-effect','archive-wall'],
  },
  'space-system': {
    visualWorld: 'space-system',
    primaryMotifs: ['planet orbit','spacecraft','star field','gravity well','rocket stage','mission trajectory','solar radiation','moon surface','telescope mirror','satellite network'],
    secondaryMotifs: ['orbital path','fuel tank','control signal','heat shield','crater map','radio beam','solar panel','distance scale'],
    forbiddenMotifs: ['bacteria colony','ancient caravan','random banknote','generic office desk'],
    paletteMood: 'deep-blue-gold-space',
    preferredVisualKinds: ['mechanism','map-route','object-exploded','timeline','world-network','process-flow','comparison','cause-effect','evidence-board','before-after'],
  },
  'economy-network': {
    visualWorld: 'economy-network',
    primaryMotifs: ['currency flow','supply chain','commodity shipment','price signal','central bank','factory output','trade balance','market basket','port congestion','payment network'],
    secondaryMotifs: ['coins','containers','warehouse','interest rate','consumer demand','exchange arrows','production line','contract ledger'],
    forbiddenMotifs: ['bacteria colony','animal anatomy','space rocket','random medieval sword'],
    paletteMood: 'ink-gold-red-finance',
    preferredVisualKinds: ['currency','world-network','commodity','factory','cause-effect','comparison','process-flow','document','map-route','timeline'],
  },
  'geopolitical-map': {
    visualWorld: 'geopolitical-map',
    primaryMotifs: ['border map','shipping lane','strategic strait','alliance network','energy pipeline','sanction barrier','military route','port city','treaty table','resource zone'],
    secondaryMotifs: ['country nodes','cargo ship','checkpoint','diplomatic document','oil flow','blocked link','regional arrows','security perimeter'],
    forbiddenMotifs: ['bacteria colony','generic AI chip','animal habitat','random microscope'],
    paletteMood: 'map-red-blue-parchment',
    preferredVisualKinds: ['map-route','world-network','treaty-table','link-break','cause-effect','comparison','document','evidence-board','timeline','process-flow'],
  },
  'mystery-archive': {
    visualWorld: 'mystery-archive',
    primaryMotifs: ['case dossier','cipher page','evidence photograph','suspect timeline','sealed archive','location map','red thread link','missing document','coded symbol','final clue'],
    secondaryMotifs: ['file stamp','handwritten note','date marker','witness card','magnified detail','route pin','locked box','crossed-out name'],
    forbiddenMotifs: ['bacteria colony','generic financial chart','random factory','unrelated animal anatomy'],
    paletteMood: 'noir-paper-red-cyan',
    preferredVisualKinds: ['portrait-dossier','evidence-board','archive-wall','document','map-route','timeline','comparison','object-exploded','cause-effect','process-flow'],
  },
  'nature-behavior': {
    visualWorld: 'nature-behavior',
    primaryMotifs: ['animal silhouette','habitat cross-section','movement path','anatomy detail','feeding behavior','survival adaptation','weather cue','predator response','migration route','life cycle'],
    secondaryMotifs: ['forest layer','water current','wing or limb motion','nest or shelter','food source','temperature shift','group behavior','terrain boundary'],
    forbiddenMotifs: ['generic office dashboard','banknote','ancient treaty','random server rack'],
    paletteMood: 'earth-teal-sky-gold',
    preferredVisualKinds: ['biology','mechanism','process-flow','cause-effect','map-evolution','before-after','comparison','object-exploded','timeline','world-network'],
  },
  'digital-technology': {
    visualWorld: 'digital-technology',
    primaryMotifs: ['processor chip','data packet','server rack','network nodes','software instruction','sensor input','memory block','signal path','interface frame','output device'],
    secondaryMotifs: ['binary stream','circuit trace','database','encryption key','API connection','cloud server','latency meter','error state'],
    forbiddenMotifs: ['bacteria colony','ancient caravan','random animal habitat','medieval document'],
    paletteMood: 'cyan-blue-red-technical',
    preferredVisualKinds: ['mechanism','object-exploded','process-flow','world-network','factory','cause-effect','comparison','evidence-board','timeline','before-after'],
  },
  'history-documentary': {
    visualWorld: 'history-documentary',
    primaryMotifs: ['period map','historical artifact','archival document','city silhouette','dated timeline','army or crowd','ruler portrait','trade object','building plan','aftermath scene'],
    secondaryMotifs: ['route arrow','wax seal','inscription','old coin','border marker','ship or carriage','ledger','excavated fragment'],
    forbiddenMotifs: ['modern laptop','neural network','bacteria colony','random futuristic dashboard'],
    paletteMood: 'archive-cream-red-mustard',
    preferredVisualKinds: ['map-route','timeline','document','object-exploded','archive-wall','comparison','cause-effect','evidence-board','process-flow','world-network'],
  },
  'science-mechanism': {
    visualWorld: 'science-mechanism',
    primaryMotifs: ['experiment setup','mechanism cross-section','particle field','measurement scale','energy transfer','material sample','cause chain','before and after state','data evidence','system diagram'],
    secondaryMotifs: ['force arrows','sensor reading','microscope view','temperature layer','reaction step','control sample','calibration mark','result panel'],
    forbiddenMotifs: ['generic currency','ancient caravan','random political map','unrelated office scene'],
    paletteMood: 'laboratory-blue-red-gold',
    preferredVisualKinds: ['mechanism','object-exploded','process-flow','cause-effect','before-after','comparison','evidence-board','biology','timeline','world-network'],
  },
  'general-explainer': {
    visualWorld: 'general-explainer',
    primaryMotifs: ['topic overview','hidden mechanism','first cause','intermediate step','supporting evidence','critical change','connection path','comparison state','measured result','final consequence'],
    secondaryMotifs: ['source object','process arrow','evidence card','time marker','location node','detail cutaway','result frame','context layer'],
    forbiddenMotifs: ['unrelated generic icon','random world map','decorative chart without meaning'],
    paletteMood: 'editorial-documentary',
    preferredVisualKinds: ['mechanism','process-flow','cause-effect','object-exploded','comparison','evidence-board','timeline','map-route','before-after','world-network'],
  },
};

let profileKey = 'general-explainer';
if (hasAny('artificial intelligence generates images','ai generates images','image generation','diffusion model','latent noise','text to image')) profileKey = 'ai-image-generation';
else if (hasAny('antibiotic','bacteria','bacterial','microbe','resistance gene','plasmid')) profileKey = 'microbiology';
else if (hasAny('lightning','thunderbolt','electrical discharge','storm charge','şimşek','yıldırım','gök gürültüsü')) profileKey = 'atmospheric-electricity';
else if (hasAny('volcano','volcanic','eruption','magma','lava','volkan','yanardağ','püskürme')) profileKey = 'volcanology';
else if (hasAny('spider ballooning','spiders fly','silk thread','air current')) profileKey = 'atmospheric-nature';
else if (hasAny('silk road','trade route','merchant caravan','ancient trade')) profileKey = 'historical-trade';
else if (hasAny('space','planet','moon','rocket','orbit','asteroid','star')) profileKey = 'space-system';
else if (String(plan.category).toLowerCase() === 'economy') profileKey = 'economy-network';
else if (String(plan.category).toLowerCase() === 'geopolitics') profileKey = 'geopolitical-map';
else if (String(plan.category).toLowerCase() === 'mystery') profileKey = 'mystery-archive';
else if (String(plan.category).toLowerCase() === 'nature') profileKey = 'nature-behavior';
else if (String(plan.category).toLowerCase() === 'technology') profileKey = 'digital-technology';
else if (String(plan.category).toLowerCase() === 'history') profileKey = 'history-documentary';
else if (String(plan.category).toLowerCase() === 'science') profileKey = 'science-mechanism';

const baseProfile = profiles[profileKey] || profiles['general-explainer'];
const deriveMotif = (scene: Scene, index: number) => {
  const tokens = contentTokens(`${scene.title} ${scene.voiceLine}`);
  const topicTokens = contentTokens(plan.topic);
  const selected = unique([...tokens.filter((token) => topicTokens.includes(token)), ...tokens]).slice(0, 4);
  return selected.length >= 2 ? selected.join(' ') : `${topicTokens.slice(0, 3).join(' ') || 'topic'} detail ${index + 1}`;
};
const derivedMotifs = unique(scenes.map(deriveMotif)).filter((motif) => contentTokens(motif).length >= 2);
const profile: Profile = profileKey === 'general-explainer'
  ? {...baseProfile, primaryMotifs: unique([...derivedMotifs, ...baseProfile.primaryMotifs]).slice(0, 14)}
  : baseProfile;

const classifyAction = (line: string): SemanticAction => {
  const value = normalize(line);
  if (/multiply|reproduce|grow|increase|replicate|çoğal|artır/.test(value)) return 'multiply';
  if (/spread|travel|move|flow|reach|route|yayıl|taşın|uç/.test(value)) return 'spread';
  if (/survive|select|filter|remove|kill|hayatta|öldür|ele/.test(value)) return 'filter';
  if (/compare|versus|difference|before|after|karşılaştır|önce|sonra/.test(value)) return 'compare';
  if (/turn|become|generate|create|convert|transform|dönüş|üret|oluştur/.test(value)) return 'transform';
  if (/connect|link|transfer|pass|bağla|aktar/.test(value)) return 'connect';
  if (/assemble|combine|build|merge|birleş|kur/.test(value)) return 'assemble';
  if (/fail|collapse|break|die|stop|çök|bozul|öl/.test(value)) return 'collapse';
  if (/path|timeline|trace|follow|izle|yol/.test(value)) return 'trace';
  return 'reveal';
};

const motifScore = (motif: string, lineTokens: string[]) => contentTokens(motif).filter((token) => lineTokens.includes(token)).length;
const motifUsage = new Map<string, number>();
const diversityTarget = Math.min(6, scenes.length, profile.primaryMotifs.length);
const chooseMotif = (scene: Scene, index: number, previous: string) => {
  const lineTokens = contentTokens(`${scene.voiceLine} ${scene.title} ${scene.sceneGoal}`);
  const ranked = profile.primaryMotifs
    .map((motif, motifIndex) => ({
      motif,
      motifIndex,
      score: motifScore(motif, lineTokens),
      used: motifUsage.get(motif) || 0,
    }))
    .sort((a, b) => {
      const aUnused = a.used === 0 ? 1 : 0;
      const bUnused = b.used === 0 ? 1 : 0;
      if (index < diversityTarget && aUnused !== bUnused) return bUnused - aUnused;
      return b.score - a.score || a.used - b.used || Math.abs(a.motifIndex - index) - Math.abs(b.motifIndex - index);
    });
  let selected = ranked.find((item) => item.motif !== previous)?.motif || ranked[0]?.motif || profile.primaryMotifs[index % profile.primaryMotifs.length];
  if (selected === previous && profile.primaryMotifs.length > 1) {
    selected = profile.primaryMotifs.find((motif) => motif !== previous) || selected;
  }
  motifUsage.set(selected, (motifUsage.get(selected) || 0) + 1);
  return selected;
};

const actionVoiceRate: Record<SemanticAction, string> = {
  reveal: '+0%', transform: '+1%', compare: '-1%', connect: '+0%', spread: '+1%',
  filter: '-1%', assemble: '+0%', trace: '-1%', multiply: '+1%', collapse: '-2%',
};
const actionMotion: Record<SemanticAction, string> = {
  reveal: 'push', transform: 'draw', compare: 'compare', connect: 'transfer', spread: 'trace',
  filter: 'eliminate', assemble: 'cascade', trace: 'trace', multiply: 'multiply', collapse: 'stamp',
};

let previousMotif = '';
let previousKind = '';
plan.scenes = scenes.map((scene, index) => {
  const primaryMotif = chooseMotif(scene, index, previousMotif);
  previousMotif = primaryMotif;
  const secondaryMotif = profile.secondaryMotifs[index % profile.secondaryMotifs.length];
  const semanticAction = classifyAction(String(scene.voiceLine || scene.title));
  let visualKind = profile.preferredVisualKinds[index % profile.preferredVisualKinds.length];
  if (visualKind === previousKind) visualKind = profile.preferredVisualKinds[(index + 1) % profile.preferredVisualKinds.length];
  previousKind = visualKind;

  const existingSupports = Array.isArray(scene.supportVisuals)
    ? scene.supportVisuals.map(String).filter((value: string) => !isPlaceholder(value))
    : [];
  const existingHero = isPlaceholder(scene.heroVisual) ? '' : String(scene.heroVisual || '');
  const mustShow = unique([primaryMotif, secondaryMotif, existingHero, ...existingSupports])
    .map((value) => compact(value, 88))
    .filter(Boolean)
    .slice(0, 6);
  while (mustShow.length < 2) mustShow.push(profile.primaryMotifs[(index + mustShow.length) % profile.primaryMotifs.length]);
  const lineTokens = contentTokens(`${scene.voiceLine} ${primaryMotif} ${secondaryMotif}`);
  const subjectTokens = unique([...lineTokens, ...contentTokens(plan.topic)]).slice(0, 12);
  while (subjectTokens.length < 2) subjectTokens.push(`scene${index + 1}`);
  const supportVisuals = unique([secondaryMotif, ...existingSupports, primaryMotif]).slice(0, 5);
  while (supportVisuals.length < 2) supportVisuals.push(primaryMotif);
  const voiceLine = sentence(scene.voiceLine || scene.title);
  const imagePrompt = [
    `Topic: ${plan.topic}.`,
    `Visual world: ${profile.visualWorld}.`,
    `Show ${mustShow.join(', ')}.`,
    `Action: ${semanticAction}.`,
    `Composition: ${visualKind}, ${scene.layout || 'hero'}.`,
    `Avoid ${profile.forbiddenMotifs.join(', ')}.`,
    'Editorial documentary collage, clear foreground subject, no generic decorative icons, no readable text.',
  ].join(' ');

  return {
    ...scene,
    voiceLine,
    voiceRate: actionVoiceRate[semanticAction],
    voicePitch: semanticAction === 'collapse' ? '-4Hz' : semanticAction === 'multiply' ? '+0Hz' : '-2Hz',
    visualWorld: profile.visualWorld,
    primaryMotif,
    secondaryMotif,
    mustShow,
    avoid: profile.forbiddenMotifs.slice(0, 8),
    subjectTokens,
    semanticAction,
    visualKind,
    motion: actionMotion[semanticAction],
    heroVisual: compact(primaryMotif, 72),
    supportVisuals,
    props: supportVisuals.map((value: string) => compact(value.toLocaleUpperCase(locale), 24)).slice(0, 6),
    sceneGoal: `Illustrate only this spoken claim: ${voiceLine}`,
    imagePrompt,
    visualSignature: `grounded-v2:${profile.visualWorld}:${index + 1}:${normalize(primaryMotif).replace(/ /g, '-')}`,
    conceptTags: subjectTokens.slice(0, 12),
    forbiddenTags: profile.forbiddenMotifs.flatMap(contentTokens).slice(0, 12),
    alignmentScore: Math.max(Number(scene.alignmentScore || 0), 0.72),
  };
});

const clause = (scene: Scene) => {
  const primary = compact(scene.primaryMotif, 44);
  const secondary = compact(scene.secondaryMotif, 44);
  const templates: Record<SemanticAction, {en: string; tr: string}> = {
    reveal: {en: `The key evidence appears in ${secondary}.`, tr: `Temel kanıt ${secondary} üzerinde görülür.`},
    transform: {en: `This turns ${primary} into ${secondary}.`, tr: `Bu süreç ${primary} unsurunu ${secondary} haline dönüştürür.`},
    compare: {en: `The difference becomes clear beside ${secondary}.`, tr: `Fark ${secondary} yanında açıkça görülür.`},
    connect: {en: `${primary} links directly with ${secondary}.`, tr: `${primary}, ${secondary} ile doğrudan bağlantı kurar.`},
    spread: {en: `From there, ${primary} reaches ${secondary}.`, tr: `Buradan sonra ${primary}, ${secondary} noktasına ulaşır.`},
    filter: {en: `The process keeps ${primary} while removing ${secondary}.`, tr: `Süreç ${primary} unsurunu korurken ${secondary} unsurunu eler.`},
    assemble: {en: `${primary} combines with ${secondary} step by step.`, tr: `${primary}, ${secondary} ile adım adım birleşir.`},
    trace: {en: `The path continues through ${secondary}.`, tr: `İzlenen yol ${secondary} üzerinden devam eder.`},
    multiply: {en: `Then ${primary} produces more ${secondary}.`, tr: `Ardından ${primary}, daha fazla ${secondary} üretir.`},
    collapse: {en: `Without ${secondary}, the system begins to fail.`, tr: `${secondary} olmadan sistem bozulmaya başlar.`},
  };
  return templates[scene.semanticAction as SemanticAction][language];
};

const wordCount = (value: unknown) => words(value).length;
const targetMinimum = language === 'tr'
  ? Math.max(88, Math.round(Number(plan.duration || 46) * 1.95))
  : Math.max(98, Math.round(Number(plan.duration || 46) * 2.18));
let narrationWords = (plan.scenes as Scene[]).reduce((sum, scene) => sum + wordCount(scene.voiceLine), 0);
let safety = 0;
while (narrationWords < targetMinimum && safety < 40) {
  const candidates = (plan.scenes as Scene[])
    .map((scene, index) => ({scene, index, count: wordCount(scene.voiceLine)}))
    .filter(({scene, count}) => !scene.audioExpansionApplied && count < 20)
    .sort((a, b) => a.count - b.count || a.index - b.index);
  const candidate = candidates[0];
  if (!candidate) break;
  candidate.scene.voiceLine = `${String(candidate.scene.voiceLine).replace(/[.!?]+$/, '')}. ${clause(candidate.scene)}`;
  candidate.scene.sceneGoal = `Illustrate only this spoken claim: ${candidate.scene.voiceLine}`;
  candidate.scene.audioExpansionApplied = true;
  narrationWords = (plan.scenes as Scene[]).reduce((sum, scene) => sum + wordCount(scene.voiceLine), 0);
  safety += 1;
}

plan.narration = (plan.scenes as Scene[]).map((scene) => sentence(scene.voiceLine)).join(' ');
plan.topicProfile = {...profile, groundingVersion: 2};
plan.v3 = {
  ...(plan.v3 || {}),
  topicGrounding: 'semantic-motif-locked',
  topicGroundingVersion: 2,
  visualWorld: profile.visualWorld,
  narrationWordCount: narrationWords,
  naturalVoiceTargetMinimum: targetMinimum,
};

const primaryMotifs = (plan.scenes as Scene[]).map((scene) => String(scene.primaryMotif));
const uniqueMotifs = new Set(primaryMotifs).size;
const repeatedMotifs = primaryMotifs.filter((motif, index) => index > 0 && motif === primaryMotifs[index - 1]);
const kinds = (plan.scenes as Scene[]).map((scene) => String(scene.visualKind));
const requiredMotifs = Math.min(4, profile.primaryMotifs.length, plan.scenes.length);
const requiredKinds = Math.min(6, profile.preferredVisualKinds.length, plan.scenes.length);
if (uniqueMotifs < requiredMotifs || repeatedMotifs.length > 0 || new Set(kinds).size < requiredKinds) {
  throw new Error(`Topic grounding failed: motifs=${uniqueMotifs}/${requiredMotifs}, consecutive=${repeatedMotifs.length}, visualKinds=${new Set(kinds).size}/${requiredKinds}`);
}

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `V3 topic grounding ready: world=${profile.visualWorld}, motifs=${uniqueMotifs}, ` +
  `visualKinds=${new Set(kinds).size}, narrationWords=${narrationWords}`,
);