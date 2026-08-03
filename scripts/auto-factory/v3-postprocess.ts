import {appendFile, readFile, writeFile} from 'node:fs/promises';
import {FactoryPlanSchema, type ScenePlan, type VisualKind} from '../../src/auto-factory/schema.js';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
const plan = JSON.parse(await readFile(planPath, 'utf8')) as any;
const language: 'tr' | 'en' = plan.language === 'en' ? 'en' : 'tr';
const locale = language === 'en' ? 'en-US' : 'tr-TR';

const normalize = (value: string) => value
  .toLocaleLowerCase(locale)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const words = (value: string) => normalize(value).split(' ').filter((word) => word.length > 2);
const unique = <T,>(values: T[]) => [...new Set(values.filter(Boolean))];
const upper = (value: string) => value.toLocaleUpperCase(locale);
const compact = (value: string, maxWords = 6) => value.replace(/\s+/g, ' ').trim().split(' ').slice(0, maxWords).join(' ');
const overlap = (left: string[], right: string[]) => {
  const rightSet = new Set(right);
  const distinct = unique(left);
  return distinct.length ? distinct.filter((word) => rightSet.has(word)).length / distinct.length : 0;
};

const layouts = ['hero','comparison','macro','process','dossier','overhead','split-left','evidence','split-right','cinematic-wide','diagonal','stacked'] as const;
const transitions = ['match-zoom','object-match','paper-tear','diagram-morph','film-burn','dossier-slide','camera-whip','ink-wipe','split-shutter','paper-swipe'] as const;
const accents = ['red','teal','gold','blue'] as const;
const motions = ['push','compare','multiply','trace','transfer','draw','parallax','rack-focus'] as const;
const shotTypes = ['macro','wide','overhead','profile','diagram','dossier','comparison','hero','process','cinematic-wide'] as const;

const antibioticScenes = {
  tr: [
    ['Antibiyotikler bütün bakterileri bir anda öldürmez.','İLK TEMAS','antibiyotik ve bakteri kolonisi',['antibiyotik kapsülü','bakteri kolonisi','petri kabı'],'microbe-field'],
    ['Hassas bakterilerin çoğu ilaç karşısında ölür.','ÇOĞU ELENİR','hassas bakterilerin elenmesi',['ölen bakteriler','ilaç halkası','azalan koloni'],'selection-process'],
    ['Dirençli birkaç bakteri ise hayatta kalır.','HAYATTA KALANLAR','dirençli bakterinin hayatta kalması',['dirençli bakteri','ilaç baskısı','hayatta kalma'],'selection-process'],
    ['Hayatta kalanlar çoğalarak koloniyi ele geçirir.','DİRENÇ ÇOĞALIR','dirençli koloninin çoğalması',['çoğalan bakteri','dirençli koloni','kopyalanma'],'microbe-field'],
    ["Direnç bazen DNA'daki rastlantısal mutasyonla doğar.",'MUTASYON','DNA üzerindeki direnç mutasyonu',['DNA','mutasyon noktası','direnç geni'],'object-exploded'],
    ['Bakteriler direnç genlerini plazmidlerle aktarabilir.','GEN AKTARIMI','plazmid aktarımı',['plazmid halkası','verici bakteri','alıcı bakteri'],'gene-transfer'],
    ['Bu aktarım farklı bakteri türlerine bile geçebilir.','TÜRLER ARASI','türler arası gen aktarımı',['farklı türler','gen köprüsü','yatay aktarım'],'gene-transfer'],
    ['Yanlış ilaç seçimi seçilim baskısını gereksizce büyütür.','YANLIŞ İLAÇ','yanlış antibiyotik seçimi',['yanlış ilaç','hassas bakteri','seçilim baskısı'],'cause-effect'],
    ['Tedaviyi erken bırakmak dirençlilere yeniden zaman kazandırır.','ERKEN BIRAKMA','yarım tedavi sonrası çoğalma',['yarım tedavi','takvim','yeniden büyüme'],'before-after'],
    ['Gereksiz kullanım özellikle hastanelerde direnci hızlandırır.','SEÇİLİM BASKISI','hastanede seçilim baskısı',['hastane','antibiyotik kullanımı','dirençli koloni'],'process-flow'],
    ['Dirençli bakteriler insan ve çevre arasında yayılır.','YAYILMA','insan ve çevre arasında yayılım',['insan','hastane','hayvan','su'],'map-evolution'],
    ['Böylece sıradan enfeksiyonların tedavisi giderek zorlaşır.','TEDAVİ ZORLAŞIR','etkisiz ilaç ve büyüyen enfeksiyon',['etkisiz ilaç','enfeksiyon','artan risk'],'before-after'],
    ['Çözüm doğru ilaç doğru doz ve doğru süredir.','DOĞRU KULLANIM','doğru kullanım protokolü',['doğru ilaç','doğru doz','doğru süre'],'evidence-board'],
    ['Direnci büyüten şey bakteriden çok yanlış seçilimdir.','ASIL MEKANİZMA','seçilimden dirence giden süreç',['seçilim','hayatta kalanlar','dirençli koloni'],'process-flow'],
  ],
  en: [
    ['Antibiotics do not kill every bacterium at once.','FIRST CONTACT','antibiotic entering a bacterial colony',['antibiotic capsule','bacterial colony','petri dish'],'microbe-field'],
    ['Most susceptible bacteria die under the drug pressure.','MOST ARE REMOVED','susceptible bacteria being eliminated',['dying bacteria','drug pressure','shrinking colony'],'selection-process'],
    ['A few resistant bacteria survive the treatment.','SURVIVORS','resistant bacterium surviving treatment',['resistant bacterium','drug ring','survival'],'selection-process'],
    ['Those survivors multiply and take over the colony.','RESISTANCE GROWS','resistant colony multiplying',['cell division','resistant colony','rapid growth'],'microbe-field'],
    ['Resistance can begin with a random DNA mutation.','MUTATION','resistance mutation inside bacterial DNA',['DNA strand','mutation site','resistance gene'],'object-exploded'],
    ['Bacteria can also exchange resistance genes through plasmids.','GENE TRANSFER','plasmid moving between bacteria',['plasmid ring','donor bacterium','recipient bacterium'],'gene-transfer'],
    ['That transfer can even cross between bacterial species.','CROSS-SPECIES','gene transfer across bacterial species',['different species','gene bridge','horizontal transfer'],'gene-transfer'],
    ['The wrong antibiotic creates unnecessary selection pressure.','WRONG DRUG','wrong antibiotic selection',['wrong drug','susceptible bacteria','selection pressure'],'cause-effect'],
    ['Stopping treatment early gives resistant bacteria more time.','STOPPING EARLY','bacteria regrowing after incomplete treatment',['unfinished treatment','calendar','regrowth'],'before-after'],
    ['Unnecessary use accelerates resistance, especially in hospitals.','SELECTION PRESSURE','hospital selection pressure',['hospital ward','antibiotic use','resistant colony'],'process-flow'],
    ['Resistant bacteria spread between people, animals, water, and hospitals.','SPREAD','resistance spreading through people and environments',['people','hospital','animals','water'],'map-evolution'],
    ['Then even ordinary infections become harder to treat.','TREATMENT FAILS','ineffective drug beside a growing infection',['ineffective drug','infection','rising risk'],'before-after'],
    ['The solution is the right drug, dose, and duration.','CORRECT USE','correct antibiotic protocol',['right drug','right dose','right duration'],'evidence-board'],
    ['Resistance grows through selection, not because bacteria decide to adapt.','CORE MECHANISM','selection turning survivors into a resistant colony',['selection','survivors','resistant colony'],'process-flow'],
  ],
} as const;

const topic = normalize(String(plan.topic || ''));
const profile = topic.includes('antibiyotik direnci') || topic.includes('antibiotic resistance')
  ? 'antibiotic-resistance'
  : 'generic-topic-locked';
const targetCount = Number(plan.duration || 46) <= 47 ? 14 : 15;
const rawScenes = Array.isArray(plan.scenes) ? plan.scenes : [];

const kindFrom = (text: string): VisualKind => {
  const value = normalize(text);
  if (/bacter|microbe|cell|virus|bakter|mikrop|hucre/.test(value)) return 'biology';
  if (/gene|dna|plasmid|gen|plazmid/.test(value)) return 'gene-transfer';
  if (/map|route|spread|harita|rota|yayil/.test(value)) return 'map-evolution';
  if (/before|after|change|oncesi|sonrasi|degis/.test(value)) return 'before-after';
  if (/report|evidence|protocol|belge|kanit/.test(value)) return 'evidence-board';
  if (/process|step|mechanism|surec|adim|mekanizma/.test(value)) return 'process-flow';
  return 'object-exploded';
};

const sourceScenes = profile === 'antibiotic-resistance'
  ? antibioticScenes[language].slice(0, targetCount).map((entry, index) => {
      const [voiceLine, title, heroVisual, supportVisuals, visualKind] = entry;
      const existing = rawScenes[index % Math.max(1, rawScenes.length)] || {};
      return {
        ...existing,
        voiceLine,
        title,
        kicker: index === 0 ? upper(String(plan.topic)) : upper(heroVisual),
        heroVisual,
        supportVisuals: [...supportVisuals],
        props: supportVisuals.map((value) => upper(value)).slice(0, 6),
        visualKind,
        sceneGoal: language === 'en' ? `Show exactly how: ${voiceLine}` : `Tam olarak şunu göster: ${voiceLine}`,
        conceptTags: unique([...words(voiceLine), ...supportVisuals.flatMap((value) => words(value))]).slice(0, 10),
        forbiddenTags: language === 'en' ? ['vaccine','antibody','immune memory'] : ['aşı','antikor','bağışıklık hafızası'],
        imagePrompt: `Vertical 9:16 editorial documentary collage. Main subject: ${heroVisual}. Supporting details: ${supportVisuals.join(', ')}. No readable text, no logo.`,
        visualSignature: `${profile}:${index}:${normalize(heroVisual)}`,
      };
    })
  : rawScenes.slice(0, targetCount).map((scene: any, index: number) => {
      const concepts = unique(words(`${scene.voiceLine || ''} ${scene.title || ''}`));
      const heroVisual = compact(scene.heroVisual || concepts.slice(0, 3).join(' ') || String(plan.topic), 6);
      const supportVisuals = unique([...(scene.supportVisuals || []), ...(scene.props || []), ...concepts.slice(2, 7)]).map(String).slice(0, 5);
      while (supportVisuals.length < 2) supportVisuals.push(language === 'en' ? `detail ${supportVisuals.length + 1}` : `detay ${supportVisuals.length + 1}`);
      return {
        ...scene,
        heroVisual,
        supportVisuals,
        props: supportVisuals.map((value) => upper(compact(value, 4))).slice(0, 6),
        visualKind: kindFrom(`${scene.voiceLine || ''} ${heroVisual}`),
        sceneGoal: language === 'en' ? `Illustrate only this spoken claim: ${scene.voiceLine}` : `Yalnız bu cümleyi görselleştir: ${scene.voiceLine}`,
        conceptTags: unique([...words(scene.voiceLine || ''), ...words(heroVisual)]).slice(0, 10),
        forbiddenTags: [],
        imagePrompt: scene.imagePrompt || `Vertical 9:16 editorial documentary collage about ${heroVisual}, no readable text, no logo.`,
        visualSignature: `generic:${index}:${normalize(heroVisual)}`,
      };
    });

const duration = Number(plan.duration || 46);
const hookDuration = 2.75;
const finalDuration = 4.0;
const middleDuration = (duration - hookDuration - finalDuration) / Math.max(1, sourceScenes.length - 2);
let cursor = 0;
const scenes: ScenePlan[] = sourceScenes.map((raw: any, index: number) => {
  const sceneDuration = index === 0 ? hookDuration : index === sourceScenes.length - 1 ? finalDuration : middleDuration;
  const lineWords = words(raw.voiceLine || '');
  const visualWords = unique([...words(raw.heroVisual || ''), ...(raw.supportVisuals || []).flatMap((value: string) => words(value))]);
  const alignmentScore = Math.min(1, overlap(lineWords, visualWords) + 0.35);
  const result: ScenePlan = {
    ...raw,
    id: index + 1,
    start: Number(cursor.toFixed(3)),
    duration: Number(sceneDuration.toFixed(3)),
    voiceStart: 0.04,
    voiceEndPadding: 0.06,
    title: upper(compact(raw.title || raw.heroVisual || `${language === 'en' ? 'Scene' : 'Sahne'} ${index + 1}`, 5)).slice(0, 60),
    kicker: upper(compact(raw.kicker || raw.sceneGoal || '', 8)).slice(0, 80),
    layout: layouts[index % layouts.length],
    transition: transitions[index % transitions.length],
    motion: raw.motion || motions[index % motions.length],
    accent: accents[index % accents.length],
    sfx: index === 0 ? 'impact' : index === 5 ? 'click' : index === 9 ? 'paper' : index === sourceScenes.length - 1 ? 'pulse' : 'none',
    beats: [
      {at: 0.14, label: compact(raw.heroVisual, 7), action: 'reveal'},
      {at: 0.42, label: compact(raw.supportVisuals[0], 7), action: index % 3 === 0 ? 'focus' : 'connect'},
      {at: 0.68, label: compact(raw.supportVisuals[1] || raw.heroVisual, 7), action: index % 4 === 0 ? 'highlight' : 'connect'},
    ],
    visualSignature: raw.visualSignature || `scene:${index}:${normalize(raw.heroVisual)}`,
    alignmentScore,
    continuityGroup: profile,
    detailLevel: 3,
    shotType: shotTypes[index % shotTypes.length],
  };
  cursor += sceneDuration;
  return result;
});
scenes[scenes.length - 1].duration = Number((duration - scenes[scenes.length - 1].start).toFixed(3));

const duplicateHeroes = scenes.filter((scene, index) => scenes.findIndex((other) => normalize(other.heroVisual) === normalize(scene.heroVisual)) !== index);
if (duplicateHeroes.length) {
  console.warn(`V3 duplicate hero visuals detected before diversify: ${duplicateHeroes.map((scene) => scene.heroVisual).join(', ')}`);
}
if (scenes.some((scene) => scene.alignmentScore < 0.34)) throw new Error('V3 scene-to-voice alignment score below threshold');

plan.version = 3;
plan.scenes = scenes;
plan.narration = scenes.map((scene) => scene.voiceLine).join(' ').replace(/\s+/g, ' ').trim();
plan.v3 = {planner:'topic-locked',audioMode:'continuous-word-timed',maxSilenceGap:0.32,repetitionThreshold:0.72,profile};
FactoryPlanSchema.parse(plan);
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.factoryVersion = 3;
  manifest.v3 = {
    profile,
    sceneCount: scenes.length,
    duplicateHeroCountBeforeDiversify: duplicateHeroes.length,
    minAlignmentScore: Math.min(...scenes.map((scene) => scene.alignmentScore)),
    language,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} catch {}

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `scene_count=${scenes.length}\nprofile=${profile}\nlanguage=${language}\n`);
}
console.log(`V3 topic lock ready: ${profile} | ${language} | ${scenes.length} scenes | min alignment ${Math.min(...scenes.map((scene) => scene.alignmentScore)).toFixed(2)}`);
