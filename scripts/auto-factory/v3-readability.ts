import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8')) as Record<string, any>;
type Scene = Record<string, any>;
const language: 'tr' | 'en' = plan.language === 'en' ? 'en' : 'tr';
const locale = language === 'en' ? 'en-US' : 'tr-TR';

const normalize = (value: string) => value
  .toLocaleLowerCase(locale)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const unique = <T,>(values: T[]) => [...new Set(values.filter(Boolean))];
const sentence = (value: string) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (!clean) return clean;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
};
const compact = (value: string, maxLength: number) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const words = clean.split(' ');
  let output = '';
  for (const word of words) {
    const candidate = output ? `${output} ${word}` : word;
    if (candidate.length > maxLength) break;
    output = candidate;
  }
  return output || words[0];
};
const tokens = (value: string) => normalize(value).split(' ').filter((word) => word.length > 2);
const alignmentScore = (voiceLine: string, heroVisual: string, supportVisuals: string[]) => {
  const voice = unique(tokens(voiceLine));
  const visual = new Set(tokens(`${heroVisual} ${supportVisuals.join(' ')}`));
  return Math.min(1, voice.filter((word) => visual.has(word)).length / Math.max(1, voice.length) + 0.35);
};

const source = Array.isArray(plan.scenes) ? (plan.scenes as Scene[]) : [];
const profile = String(plan.v3?.profile || plan.v3Profile || plan.v3_profile || '');

const buildScene = (base: Scene, voiceLine: string, overrides: Partial<Scene>): Scene => {
  const heroVisual = String(overrides.heroVisual || base.heroVisual || base.title || plan.topic);
  const rawSupportVisuals: unknown[] =
    (overrides.supportVisuals as unknown[] | undefined) ||
    (Array.isArray(base.supportVisuals) ? base.supportVisuals : undefined) ||
    (Array.isArray(base.props) ? base.props : undefined) ||
    [heroVisual];
  const supportVisuals: string[] = rawSupportVisuals.map((value: unknown) => String(value)).slice(0, 5);
  while (supportVisuals.length < 2) supportVisuals.push(heroVisual);
  const voice = sentence(voiceLine);
  return {
    ...base,
    ...overrides,
    voiceLine: voice,
    // Keep one canonical prefix in both languages. The renderer and QC remove it
    // before comparing the displayed claim with narration.
    sceneGoal: `Illustrate only this spoken claim: ${voice}`,
    heroVisual: compact(heroVisual, 54),
    supportVisuals,
    props: supportVisuals.map((value: string) => compact(value.toLocaleUpperCase(locale), 18)).slice(0, 6),
    conceptTags: unique([...tokens(voice), ...tokens(heroVisual)]).slice(0, 10),
    beats: [
      {at: 0.08, label: compact(heroVisual, 42), action: 'reveal'},
      {at: 0.28, label: compact(supportVisuals[0], 42), action: 'focus'},
      {at: 0.50, label: compact(supportVisuals[1], 42), action: 'connect'},
      {at: 0.70, label: compact(supportVisuals[2] || heroVisual, 42), action: 'highlight'},
    ],
    visualSignature: `readable-v33:${base.id}:${normalize(heroVisual)}`,
    alignmentScore: alignmentScore(voice, heroVisual, supportVisuals),
  };
};

const antibioticReadable = {
  tr: [
    ['Antibiyotikler kolonideki bakterilerin hepsini bir anda öldürmez.','İLK TEMAS','antibiyotik ve bakteri kolonisi','microbe-field',['antibiyotik kapsülü','bakteri kolonisi','petri kabı']],
    ['Hassas bakteriler ölür; dirençli birkaç bakteri hayatta kalıp çoğalır.','DOĞAL SEÇİLİM','dirençli bakterinin hayatta kalması','selection-process',['ölen hassas bakteriler','dirençli bakteri','çoğalan koloni']],
    ["Direnç bazen bakterinin DNA'sındaki rastlantısal bir mutasyonla ortaya çıkar.",'MUTASYON','DNA üzerindeki direnç mutasyonu','object-exploded',['DNA zinciri','mutasyon noktası','direnç geni']],
    ['Bakteriler direnç genlerini plazmidlerle başka bakterilere aktarabilir.','GEN AKTARIMI','bakteriler arasında plazmid aktarımı','gene-transfer',['plazmid halkası','verici bakteri','alıcı bakteri']],
    ['Yanlış antibiyotik seçimi gereksiz seçilim baskısı oluşturur.','YANLIŞ İLAÇ','yanlış antibiyotik seçimi','cause-effect',['yanlış ilaç','hassas bakteriler','seçilim baskısı']],
    ['Tedaviyi erken bırakmak dirençli bakterilere yeniden çoğalma zamanı verir.','ERKEN BIRAKMA','yarım tedavi sonrası çoğalma','before-after',['yarım tedavi','takvim','yeniden büyüme']],
    ['Gereksiz kullanım özellikle hastanelerde direncin yayılmasını hızlandırır.','HASTANE BASKISI','hastanede direnç baskısı','process-flow',['hastane','antibiyotik kullanımı','dirençli koloni']],
    ['Dirençli bakteriler insanlar, hayvanlar, su ve hastaneler arasında yayılır.','YAYILMA','insan ve çevre arasında direnç yayılımı','map-evolution',['insanlar','hayvanlar','su','hastaneler']],
    ['Böylece sıradan enfeksiyonların bile etkili tedavisi zorlaşır.','TEDAVİ ZORLAŞIR','etkisiz ilaç ve büyüyen enfeksiyon','before-after',['etkisiz ilaç','enfeksiyon','artan risk']],
    ['Çözüm doğru antibiyotiği, doğru dozda ve önerilen süre boyunca kullanmaktır.','DOĞRU KULLANIM','doğru antibiyotik protokolü','evidence-board',['doğru ilaç','doğru doz','doğru süre','doktor önerisi']],
  ],
  en: [
    ['Antibiotics do not kill every bacterium in a colony at once.','FIRST CONTACT','antibiotic entering a bacterial colony','microbe-field',['antibiotic capsule','bacterial colony','petri dish']],
    ['Susceptible bacteria die while a few resistant survivors multiply.','NATURAL SELECTION','resistant bacteria surviving treatment','selection-process',['dying susceptible bacteria','resistant survivor','growing colony']],
    ['Resistance can begin with a random mutation inside bacterial DNA.','MUTATION','resistance mutation inside bacterial DNA','object-exploded',['DNA strand','mutation site','resistance gene']],
    ['Bacteria can pass resistance genes through small plasmid rings.','GENE TRANSFER','plasmid moving between bacteria','gene-transfer',['plasmid ring','donor bacterium','recipient bacterium']],
    ['The wrong antibiotic creates unnecessary selection pressure.','WRONG DRUG','wrong antibiotic creating selection pressure','cause-effect',['wrong drug','susceptible bacteria','selection pressure']],
    ['Stopping treatment early gives resistant bacteria time to regrow.','STOPPING EARLY','regrowth after incomplete treatment','before-after',['unfinished treatment','calendar','bacterial regrowth']],
    ['Unnecessary use accelerates resistance, especially inside hospitals.','HOSPITAL PRESSURE','hospital resistance pressure','process-flow',['hospital ward','antibiotic use','resistant colony']],
    ['Resistant bacteria spread between people, animals, water, and hospitals.','SPREAD','resistance spreading through people and environments','map-evolution',['people','animals','water','hospitals']],
    ['Then even ordinary infections become much harder to treat.','TREATMENT FAILS','ineffective drug beside a growing infection','before-after',['ineffective drug','infection','rising risk']],
    ['The solution is the right antibiotic, dose, and treatment duration.','CORRECT USE','correct antibiotic protocol','evidence-board',['right drug','right dose','right duration','medical guidance']],
  ],
} as const;

let readableScenes: Scene[];
if (profile === 'antibiotic-resistance' && source.length >= 10) {
  readableScenes = antibioticReadable[language].map((entry, index) => {
    const [voiceLine, title, heroVisual, visualKind, supportVisuals] = entry;
    const sourceIndex = Math.min(source.length - 1, Math.round(index * (source.length - 1) / 9));
    return buildScene(source[sourceIndex], voiceLine, {title, heroVisual, visualKind, supportVisuals: [...supportVisuals]});
  });
} else {
  const targetCount = Math.min(10, source.length);
  readableScenes = Array.from({length: targetCount}, (_, index) => {
    const sourceIndex = Math.min(source.length - 1, Math.round(index * (source.length - 1) / Math.max(1, targetCount - 1)));
    const base = source[sourceIndex];
    return buildScene(base, String(base.voiceLine || base.title || ''), {
      title: base.title,
      heroVisual: base.heroVisual,
      visualKind: base.visualKind,
      supportVisuals: base.supportVisuals,
    });
  });
}

const duration = Number(plan.duration || 46);
const hookDuration = 4.0;
const finalDuration = 5.2;
const middleDuration = (duration - hookDuration - finalDuration) / Math.max(1, readableScenes.length - 2);
const layouts = ['hero','comparison','macro','process','dossier','overhead','split-left','evidence','split-right','cinematic-wide'];
const transitions = ['match-zoom','object-match','paper-tear','diagram-morph','film-burn','dossier-slide','camera-whip','ink-wipe','split-shutter','paper-swipe'];
const accents = ['red','teal','gold','blue'];

let cursor = 0;
plan.scenes = readableScenes.map((scene, index) => {
  const sceneDuration = index === 0 ? hookDuration : index === readableScenes.length - 1 ? finalDuration : middleDuration;
  const result = {
    ...scene,
    id: index + 1,
    start: Number(cursor.toFixed(3)),
    duration: Number(sceneDuration.toFixed(3)),
    title: compact(String(scene.title || scene.heroVisual), 32).toLocaleUpperCase(locale),
    kicker: compact(String(scene.kicker || scene.heroVisual || scene.title), 52).toLocaleUpperCase(locale),
    heroVisual: compact(String(scene.heroVisual), 54),
    props: (scene.props || []).map((value: unknown) => compact(String(value), 18)),
    layout: layouts[index % layouts.length],
    transition: transitions[index % transitions.length],
    accent: accents[index % accents.length],
    sfx: [0, 3, 6, readableScenes.length - 1].includes(index)
      ? index === 0 ? 'impact' : index === readableScenes.length - 1 ? 'pulse' : index === 3 ? 'click' : 'paper'
      : 'none',
    readabilityVersion: 3,
    finalHoldRatio: 0.34,
    maximumCaptionCps: 18,
  };
  cursor += sceneDuration;
  return result;
});

// Readability is the final scene-reduction stage, so diversity must be locked here.
// Otherwise the earlier diversify pass is overwritten when 14 source scenes become 10.
const visualKindSequences: Record<string, string[]> = {
  history: ['map-route','timeline','document','comparison','object-exploded','cause-effect','archive-wall','world-network','process-flow','evidence-board'],
  science: ['biology','mechanism','evidence-board','cause-effect','process-flow','comparison','object-exploded','timeline','world-network','before-after'],
  economy: ['currency','world-network','document','comparison','mechanism','cause-effect','commodity','map-route','evidence-board','process-flow'],
  geopolitics: ['map-route','document','comparison','cause-effect','world-network','evidence-board','mechanism','process-flow','archive-wall','timeline'],
  technology: ['mechanism','world-network','evidence-board','cause-effect','process-flow','comparison','object-exploded','timeline','document','map-route'],
  mystery: ['portrait-dossier','evidence-board','map-route','comparison','object-exploded','cause-effect','archive-wall','timeline','document','process-flow'],
  nature: ['biology','map-evolution','mechanism','cause-effect','process-flow','comparison','evidence-board','timeline','object-exploded','world-network'],
};
const fallbackSequence = ['map-route','timeline','document','comparison','object-exploded','cause-effect','evidence-board','world-network','process-flow','archive-wall'];
const currentKinds = plan.scenes.map((scene: Scene) => String(scene.visualKind));
const currentKindCount = new Set(currentKinds).size;
const hasConsecutiveKind = currentKinds.some((kind: string, index: number) => index > 0 && kind === currentKinds[index - 1]);
const needsFinalDiversity = profile === 'generic-topic-locked' || currentKindCount < 6 || hasConsecutiveKind;

if (needsFinalDiversity) {
  const sequence = visualKindSequences[String(plan.category || '').toLowerCase()] || fallbackSequence;
  plan.scenes = plan.scenes.map((scene: Scene, index: number) => {
    const visualKind = sequence[index % sequence.length];
    const shotType = ['map-route','map-evolution','world-network'].includes(visualKind)
      ? 'wide'
      : ['document','archive-wall','evidence-board'].includes(visualKind)
        ? 'dossier'
        : ['comparison','before-after'].includes(visualKind)
          ? 'comparison'
          : ['object-exploded','mechanism'].includes(visualKind)
            ? 'diagram'
            : ['biology','microbe-field'].includes(visualKind)
              ? 'macro'
              : 'process';
    return {
      ...scene,
      visualKind,
      shotType,
      visualSignature: `readable-v33:${scene.id}:${visualKind}:${normalize(String(scene.heroVisual)).slice(0, 36)}`,
    };
  });
}

const finalKinds = plan.scenes.map((scene: Scene) => String(scene.visualKind));
const finalKindCount = new Set(finalKinds).size;
const finalConsecutive = finalKinds.filter((kind: string, index: number) => index > 0 && kind === finalKinds[index - 1]);
if (finalKindCount < 6 || finalConsecutive.length > 0) {
  throw new Error(`V3.3 final visual diversity failed: families=${finalKindCount}, consecutive=${finalConsecutive.length}`);
}

plan.scenes[plan.scenes.length - 1].duration = Number((duration - Number(plan.scenes[plan.scenes.length - 1].start)).toFixed(3));
plan.narration = plan.scenes.map((scene: Scene) => sentence(String(scene.voiceLine))).join(' ');
plan.v3 = {
  ...(plan.v3 || {}),
  readability: 'slow-followable',
  readabilityVersion: 3,
  targetSceneCount: readableScenes.length,
  minimumPlannedSceneDuration: Math.min(...plan.scenes.map((scene: Scene) => Number(scene.duration))),
  punctuationMode: 'semantic-complete-sentences',
  maximumCaptionCps: 18,
  language,
  finalVisualKindCount: finalKindCount,
  finalVisualDiversityVersion: 1,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `V3.3 readability ready: ${source.length} -> ${readableScenes.length} scenes | ${language} | ` +
  `minimum ${plan.v3.minimumPlannedSceneDuration.toFixed(2)}s | visual families ${finalKindCount}`,
);
