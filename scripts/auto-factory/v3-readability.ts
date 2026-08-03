import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8')) as Record<string, any>;
type Scene = Record<string, any>;

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const unique = <T,>(values: T[]) => [...new Set(values.filter(Boolean))];
const completeSentence = (value: string) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return clean;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
};

const compactLabel = (value: string, maxLength: number) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const words = clean.split(' ');
  let result = '';
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > maxLength) break;
    result = candidate;
  }
  return result || words[0];
};

const tokens = (value: string) =>
  normalize(value).split(' ').filter((word) => word.length > 2);

const alignmentScore = (voiceLine: string, heroVisual: string, supportVisuals: string[]) => {
  const voice = unique(tokens(voiceLine));
  const visual = new Set(tokens(`${heroVisual} ${supportVisuals.join(' ')}`));
  const overlap = voice.filter((word) => visual.has(word)).length / Math.max(1, voice.length);
  return Math.min(1, overlap + 0.35);
};

const mergeMetadata = (scenes: Scene[]) => ({
  supportVisuals: unique(scenes.flatMap((scene) => (scene.supportVisuals || []).map(String))).slice(0, 5),
  forbiddenTags: unique(scenes.flatMap((scene) => (scene.forbiddenTags || []).map(String))),
  conceptTags: unique(scenes.flatMap((scene) => (scene.conceptTags || []).map(String))).slice(0, 10),
});

const buildScene = (sourceScenes: Scene[], voiceLine: string, overrides: Partial<Scene> = {}): Scene => {
  const base = sourceScenes[0];
  const metadata = mergeMetadata(sourceScenes);
  const heroVisual = String(overrides.heroVisual || base.heroVisual || base.title || plan.topic);
  const supportVisuals = (overrides.supportVisuals as string[] | undefined) || metadata.supportVisuals;
  const sentence = completeSentence(voiceLine);
  return {
    ...base,
    ...overrides,
    voiceLine: sentence,
    sceneGoal: `Show exactly how: ${sentence}`,
    heroVisual: compactLabel(heroVisual, 32),
    supportVisuals,
    props: supportVisuals.map((value) => compactLabel(String(value).toLocaleUpperCase('tr-TR'), 14)).slice(0, 6),
    forbiddenTags: metadata.forbiddenTags,
    conceptTags: unique([...metadata.conceptTags, ...tokens(sentence), ...tokens(heroVisual)]).slice(0, 10),
    beats: [
      {at: 0.08, label: heroVisual, action: 'reveal'},
      {at: 0.28, label: supportVisuals[0] || heroVisual, action: 'focus'},
      {at: 0.50, label: supportVisuals[1] || supportVisuals[0] || heroVisual, action: 'connect'},
      {at: 0.72, label: supportVisuals[2] || heroVisual, action: 'hold'},
    ],
    visualSignature: `readable-v2:${sourceScenes.map((scene) => scene.id).join('-')}:${heroVisual}`,
    alignmentScore: alignmentScore(sentence, heroVisual, supportVisuals),
  };
};

const source = Array.isArray(plan.scenes) ? (plan.scenes as Scene[]) : [];
const profile = String(plan.v3?.profile || plan.v3Profile || plan.v3_profile || '');
let readableScenes: Scene[];

if (profile === 'antibiotic-resistance' && source.length >= 14) {
  readableScenes = [
    buildScene([source[0]], 'Antibiyotikler kolonideki bakterilerin hepsini bir anda öldürmez.', {
      title: 'İLK TEMAS', heroVisual: 'antibiyotik ve bakteri kolonisi', visualKind: 'microbe-field',
    }),
    buildScene([source[1], source[2], source[3]], 'Hassas bakteriler ölür; dirençli birkaç bakteri hayatta kalıp hızla çoğalır.', {
      title: 'DOĞAL SEÇİLİM', heroVisual: 'dirençli bakterinin hayatta kalması', visualKind: 'selection-process',
      supportVisuals: ['ölen hassas bakteriler', 'dirençli bakteri', 'çoğalan koloni'],
    }),
    buildScene([source[4]], "Direnç bazen bakterinin DNA'sındaki rastlantısal bir mutasyonla ortaya çıkar.", {
      title: 'MUTASYON', heroVisual: 'DNA üzerindeki direnç mutasyonu', visualKind: 'object-exploded',
    }),
    buildScene([source[5], source[6]], 'Bakteriler direnç genlerini plazmidlerle başka bakterilere ve türlere aktarabilir.', {
      title: 'GEN AKTARIMI', heroVisual: 'türler arasında plazmid aktarımı', visualKind: 'gene-transfer',
      supportVisuals: ['plazmid halkası', 'verici bakteri', 'alıcı bakteri'],
    }),
    buildScene([source[7]], 'Yanlış antibiyotik seçimi hassas bakterileri gereksiz yere ortadan kaldırır.', {
      title: 'YANLIŞ İLAÇ', heroVisual: 'yanlış antibiyotik seçimi', visualKind: 'cause-effect',
    }),
    buildScene([source[8]], 'Tedaviyi erken bırakmak dirençli bakterilere yeniden çoğalmak için zaman verir.', {
      title: 'ERKEN BIRAKMA', heroVisual: 'yarım tedavi sonrası çoğalma', visualKind: 'before-after',
    }),
    buildScene([source[9]], 'Gereksiz kullanım özellikle hastanelerde seçilim baskısını giderek büyütür.', {
      title: 'SEÇİLİM BASKISI', heroVisual: 'hastanede seçilim baskısı', visualKind: 'process-flow',
    }),
    buildScene([source[10]], 'Dirençli bakteriler insanlar, hayvanlar, su ve hastaneler arasında yayılır.', {
      title: 'YAYILMA', heroVisual: 'insan ve çevre arasında yayılım', visualKind: 'map-evolution',
    }),
    buildScene([source[11]], 'Böylece sıradan enfeksiyonların bile etkili biçimde tedavi edilmesi zorlaşır.', {
      title: 'TEDAVİ ZORLAŞIR', heroVisual: 'etkisiz ilaç ve büyüyen enfeksiyon', visualKind: 'before-after',
    }),
    buildScene([source[12], source[13]], 'Çözüm; doğru antibiyotiği, doğru dozda ve önerilen süre boyunca kullanmaktır.', {
      title: 'DOĞRU KULLANIM', heroVisual: 'doğru kullanım protokolü', visualKind: 'evidence-board',
      supportVisuals: ['doğru ilaç', 'doğru doz', 'doğru süre', 'doktor önerisi'],
    }),
  ];
} else {
  const targetCount = Math.min(10, source.length);
  readableScenes = Array.from({length: targetCount}, (_, index) => {
    const start = Math.floor((index * source.length) / targetCount);
    const end = Math.floor(((index + 1) * source.length) / targetCount);
    const group = source.slice(start, Math.max(start + 1, end));
    const voiceLine = group.map((scene) => completeSentence(String(scene.voiceLine || scene.title || ''))).join(' ');
    return buildScene(group, voiceLine, {
      title: group[0].title,
      heroVisual: group[0].heroVisual,
      visualKind: group[0].visualKind,
    });
  });
}

const duration = Number(plan.duration || 46);
const hookDuration = 4.0;
const finalDuration = 5.2;
const middleDuration = (duration - hookDuration - finalDuration) / Math.max(1, readableScenes.length - 2);
const layouts = ['hero', 'comparison', 'macro', 'process', 'dossier', 'overhead', 'split-left', 'evidence', 'split-right', 'cinematic-wide'];
const transitions = ['match-zoom', 'object-match', 'paper-tear', 'diagram-morph', 'film-burn', 'dossier-slide', 'camera-whip', 'ink-wipe', 'split-shutter', 'paper-swipe'];
const accents = ['red', 'teal', 'gold', 'blue'];

let cursor = 0;
plan.scenes = readableScenes.map((scene, index) => {
  const sceneDuration = index === 0 ? hookDuration : index === readableScenes.length - 1 ? finalDuration : middleDuration;
  const result = {
    ...scene,
    id: index + 1,
    start: Number(cursor.toFixed(3)),
    duration: Number(sceneDuration.toFixed(3)),
    title: compactLabel(String(scene.title || scene.heroVisual), 28).toLocaleUpperCase('tr-TR'),
    kicker: compactLabel(String(scene.kicker || scene.heroVisual || scene.title), 46).toLocaleUpperCase('tr-TR'),
    heroVisual: compactLabel(String(scene.heroVisual), 32),
    props: (scene.props || []).map((value: unknown) => compactLabel(String(value), 14)),
    layout: layouts[index % layouts.length],
    transition: transitions[index % transitions.length],
    accent: accents[index % accents.length],
    sfx: [0, 3, 6, readableScenes.length - 1].includes(index)
      ? index === 0 ? 'impact' : index === readableScenes.length - 1 ? 'pulse' : index === 3 ? 'click' : 'paper'
      : 'none',
    readabilityVersion: 2,
    finalHoldRatio: 0.34,
    maximumCaptionCps: 18,
  };
  cursor += sceneDuration;
  return result;
});

plan.scenes[plan.scenes.length - 1].duration = Number(
  (duration - Number(plan.scenes[plan.scenes.length - 1].start)).toFixed(3),
);
plan.narration = plan.scenes.map((scene: Scene) => completeSentence(String(scene.voiceLine))).join(' ');
plan.v3 = {
  ...(plan.v3 || {}),
  readability: 'slow-followable',
  readabilityVersion: 2,
  targetSceneCount: readableScenes.length,
  minimumPlannedSceneDuration: Math.min(...plan.scenes.map((scene: Scene) => Number(scene.duration))),
  punctuationMode: 'semantic-complete-sentences',
  maximumCaptionCps: 18,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `V3 readability v2 hazır: ${source.length} -> ${readableScenes.length} sahne | ` +
  `minimum planlı sahne ${plan.v3.minimumPlannedSceneDuration.toFixed(2)}s`,
);
