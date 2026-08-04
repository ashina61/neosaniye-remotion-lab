import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const repo = process.cwd();
const scripts = [
  'scripts/auto-factory/build-visual-director-v8.mjs',
  'scripts/auto-factory/build-motion-director-v8.mjs',
];

const motifSets = {
  history: [
    ['Silk Road caravan', 'trade route', 'desert city'], ['merchant caravan', 'mountain pass', 'silk cargo'],
    ['oasis city', 'market exchange', 'local guides'], ['Persian roads', 'Roman ports', 'Chinese silk'],
    ['relay merchants', 'regional routes', 'customs posts'], ['Buddhist monks', 'manuscripts', 'cultural exchange'],
    ['disease transmission', 'crowded towns', 'long routes'], ['maritime routes', 'Indian Ocean', 'port cities'],
    ['Mongol protection', 'safe passage', 'imperial roads'], ['network decline', 'sea trade', 'political fragmentation'],
  ],
  biology: [
    ['antibiotic capsule', 'bacteria colony', 'petri dish'], ['drug exposure', 'sensitive bacteria', 'surviving bacteria'],
    ['resistant mutation', 'DNA', 'cell membrane'], ['selection pressure', 'dead cells', 'survivor'],
    ['bacterial division', 'new colony', 'resistant trait'], ['plasmid transfer', 'two bacteria', 'gene exchange'],
    ['incomplete course', 'low dose', 'survivors'], ['hospital environment', 'patients', 'surface transmission'],
    ['food animals', 'water', 'human contact'], ['resistant infection', 'treatment failure', 'clinical response'],
  ],
  technology: [
    ['submarine cable', 'ocean floor', 'landing station'], ['fiber core', 'protective layers', 'steel armor'],
    ['light pulse', 'glass fiber', 'digital data'], ['repeater', 'signal amplification', 'power conductor'],
    ['cable ship', 'route map', 'ocean trench'], ['landing station', 'terrestrial network', 'data center'],
    ['global route', 'continents', 'internet traffic'], ['cable repair', 'fault location', 'remote vehicle'],
    ['shallow water armor', 'deep sea cable', 'coastal risk'], ['network redundancy', 'alternate route', 'service recovery'],
  ],
};

const makePlan = (topic, category, family, fixtureKey) => ({
  version: 2, topic, title: topic, category, language: 'en', duration: 46, fps: 30, seed: 42,
  narration: motifSets[fixtureKey].flat().join(' '),
  scenes: motifSets[fixtureKey].map((labels, index) => ({
    id: index + 1, start: index * 4.6, duration: 4.6, title: labels[0], kicker: labels[1],
    voiceLine: `Scene ${index + 1} explains ${labels.join(', ')}.`, detailLevel: index % 3 === 0 ? 3 : 2, transition: 'cut',
    beats: labels.slice(0, 3).map((label, beatIndex) => ({at: 0.18 + beatIndex * 0.24, label, action: 'reveal'})),
    visualContract: {
      version: 7, baseVersion: 6,
      mode: index % 5 === 1 ? 'network' : index % 5 === 2 ? 'evidence' : index % 5 === 3 ? 'comparison' : index % 5 === 4 ? 'timeline' : 'focus',
      subject: labels[0], labels, relation: 'explains', layoutVariant: index,
      groundingTokens: labels.flatMap((value) => value.toLowerCase().split(/\s+/)), source: 'fixture',
      motifs: labels.map((label, motifIndex) => ({
        label,
        kind: /route|map|continent/.test(label) ? 'map-route' : /bacteria|dna|cell|plasmid/.test(label) ? 'organism' : /cable|fiber|layer|core/.test(label) ? 'cross-section' : /person|patient|monk|merchant/.test(label) ? 'portrait' : 'hero-object',
        importance: motifIndex === 0 ? 'hero' : 'support', depth: motifIndex,
      })),
      style: {
        family, palette: {bg: '#111111', surface: '#dddddd', ink: '#111111', primary: '#bb3322', secondary: '#338899', highlight: '#e0ba55', muted: '#777777'},
        typography: 'editorial', texture: 'paper', lighting: 'cinematic', shapeLanguage: 'layered', motion: 'parallax', transition: 'cut', effects: ['grain'], density: 'medium', fingerprint: family,
      },
      direction: {hero: labels[0], staging: 'focus', assetStrategy: 'procedural-illustration', avoid: ['generic cards']},
    },
  })),
});

const fixtures = [
  ['How the Silk Road actually worked', 'history', 'archive-noir', 'history'],
  ['How antibiotic resistance develops', 'science', 'biological-macro', 'biology'],
  ['How undersea cables carry the internet', 'technology', 'technical-blueprint', 'technology'],
];

for (const [topic, category, family, fixtureKey] of fixtures) {
  const dir = await mkdtemp(join(tmpdir(), 'neosaniye-v8-'));
  const planPath = join(dir, 'plan.json');
  await writeFile(planPath, JSON.stringify(makePlan(topic, category, family, fixtureKey)), 'utf8');
  for (const script of scripts) {
    const run = spawnSync(process.execPath, [script], {cwd: repo, env: {...process.env, PLAN_PATH: planPath}, encoding: 'utf8'});
    if (run.status !== 0) throw new Error(`${topic}\n${run.stdout}\n${run.stderr}`);
  }
  const result = JSON.parse(await readFile(planPath, 'utf8'));
  if (result.v8?.version !== 8 || !result.v8.visualDirector || !result.v8.motionDirector) throw new Error(`${topic}: V8 metadata missing.`);
  if (!result.scenes.every((scene) => scene.visualContract?.version === 8 && scene.motionContract?.version === 8)) throw new Error(`${topic}: scene contracts incomplete.`);
  const modes = new Set(result.scenes.map((scene) => scene.visualContract.visualDirection.sceneMode));
  const cameras = new Set(result.scenes.map((scene) => scene.motionContract.cameraMove));
  const transitions = new Set(result.scenes.map((scene) => scene.motionContract.transitionIn));
  if (modes.size < 3 || cameras.size < 3 || transitions.size < 3) throw new Error(`${topic}: insufficient director diversity.`);
  if (result.scenes.some((scene) => scene.motionContract.choreography.length < 5 || !scene.motionContract.emphasisMoments.length)) throw new Error(`${topic}: incomplete choreography.`);
  if (category === 'history') {
    const classes = result.scenes.map((scene) => scene.visualContract.visualDirection.presentationClass);
    if (!classes.includes('realistic') || !classes.includes('archival') || !result.scenes.some((scene) => scene.visualContract.visualDirection.sceneMode === 'cartographic')) throw new Error('History fixture did not mix realistic reconstruction, archival evidence and maps.');
    if (classes.filter((value) => value === 'symbolic').length > 1) throw new Error('History fixture became shape-heavy.');
  }
  if (category === 'science' && !result.scenes.some((scene) => /macro|cutaway/.test(scene.visualContract.visualDirection.sceneMode))) throw new Error('Biology fixture lacks macro/cutaway scenes.');
  if (category === 'technology' && !result.scenes.some((scene) => /cutaway|system-map/.test(scene.visualContract.visualDirection.sceneMode))) throw new Error('Technology fixture lacks cutaway/system-map scenes.');
  await rm(dir, {recursive: true, force: true});
}

console.log('V8 Visual + Motion Director regression passed: history, biology and technology produce distinct visual grammars and choreographies.');
