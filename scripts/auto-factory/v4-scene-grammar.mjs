import {appendFile, readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const GRAMMARS = [
  'hero-poster',
  'macro-field',
  'mechanism-cutaway',
  'cause-chain',
  'exploded-object',
  'timeline-strip',
  'comparison-scale',
  'map-route',
  'spread-network',
  'evidence-board',
];

const KIND_GRAMMARS = {
  'microbe-field': ['macro-field', 'selection-field', 'hero-poster'],
  biology: ['macro-field', 'mechanism-cutaway', 'spread-network'],
  'selection-process': ['selection-field', 'cause-chain', 'comparison-scale'],
  'gene-transfer': ['mechanism-cutaway', 'cause-chain', 'exploded-object'],
  'object-exploded': ['exploded-object', 'mechanism-cutaway', 'hero-poster'],
  mechanism: ['mechanism-cutaway', 'exploded-object', 'cause-chain'],
  'before-after': ['comparison-scale', 'cause-chain', 'hero-poster'],
  comparison: ['comparison-scale', 'hero-poster', 'evidence-board'],
  timeline: ['timeline-strip', 'evidence-board', 'cause-chain'],
  document: ['evidence-board', 'timeline-strip', 'hero-poster'],
  'evidence-board': ['evidence-board', 'cause-chain', 'timeline-strip'],
  'portrait-dossier': ['evidence-board', 'hero-poster', 'comparison-scale'],
  'map-route': ['map-route', 'spread-network', 'timeline-strip'],
  'map-evolution': ['map-route', 'spread-network', 'comparison-scale'],
  'world-network': ['spread-network', 'map-route', 'cause-chain'],
  'process-flow': ['cause-chain', 'mechanism-cutaway', 'timeline-strip'],
  'cause-effect': ['cause-chain', 'comparison-scale', 'exploded-object'],
  currency: ['comparison-scale', 'timeline-strip', 'evidence-board'],
  commodity: ['map-route', 'comparison-scale', 'hero-poster'],
  factory: ['mechanism-cutaway', 'cause-chain', 'exploded-object'],
};

const ACTION_GRAMMARS = {
  reveal: ['hero-poster', 'evidence-board'],
  transform: ['exploded-object', 'mechanism-cutaway'],
  compare: ['comparison-scale', 'evidence-board'],
  connect: ['cause-chain', 'spread-network'],
  spread: ['spread-network', 'map-route'],
  filter: ['selection-field', 'macro-field'],
  assemble: ['exploded-object', 'mechanism-cutaway'],
  trace: ['timeline-strip', 'map-route'],
  multiply: ['macro-field', 'spread-network'],
  collapse: ['comparison-scale', 'hero-poster'],
};

const CAMERA_BY_GRAMMAR = {
  'hero-poster': ['push-in', 'drift-up'],
  'macro-field': ['orbit', 'push-in'],
  'selection-field': ['pull-out', 'snap-zoom'],
  'mechanism-cutaway': ['pan-right', 'push-in'],
  'cause-chain': ['pan-right', 'drift-up'],
  'exploded-object': ['pull-out', 'orbit'],
  'timeline-strip': ['drift-up', 'pan-right'],
  'comparison-scale': ['pan-left', 'snap-zoom'],
  'map-route': ['pan-right', 'pull-out'],
  'spread-network': ['pull-out', 'orbit'],
  'evidence-board': ['pan-left', 'push-in'],
};

const TEXT_MODES = ['headline', 'integrated', 'stamp', 'minimal'];
const BIASES = ['left', 'right', 'diagonal', 'full-frame', 'center'];

const ART_WORLDS = {
  'antibiotic-resistance': {
    palette: {paper: '#e7dfca', ink: '#28231f', primary: '#b4473f', secondary: '#2d7180', highlight: '#d2ab45'},
    textures: ['lab-paper', 'petri-stain', 'microscope-dust'],
    density: 'medium',
  },
  'microscopic-biology': {
    palette: {paper: '#e4dec7', ink: '#232321', primary: '#a94142', secondary: '#287789', highlight: '#d6b34d'},
    textures: ['microscope-grain', 'lab-note', 'cell-stain'],
    density: 'dense',
  },
  'historical-trade': {
    palette: {paper: '#decba5', ink: '#2a2118', primary: '#934f2e', secondary: '#3f7180', highlight: '#c99c34'},
    textures: ['aged-parchment', 'ink-map', 'seal-wax'],
    density: 'dense',
  },
  'space-system': {
    palette: {paper: '#111827', ink: '#ecf2f6', primary: '#d55745', secondary: '#4f80ae', highlight: '#e1b64d'},
    textures: ['star-haze', 'film-grain', 'diagram-grid'],
    density: 'medium',
  },
  'black-hole': {
    palette: {paper: '#0b111c', ink: '#f0eee8', primary: '#d75742', secondary: '#4777a6', highlight: '#e0b345'},
    textures: ['star-haze', 'lens-dust', 'curved-grid'],
    density: 'light',
  },
  'ai-image-generation': {
    palette: {paper: '#d9d8cf', ink: '#202126', primary: '#c34d59', secondary: '#3c77a8', highlight: '#d6a93e'},
    textures: ['pixel-noise', 'scanner-grid', 'print-grain'],
    density: 'medium',
  },
  'mystery-archive': {
    palette: {paper: '#d9c9a8', ink: '#241f1a', primary: '#8f3437', secondary: '#416b70', highlight: '#be9134'},
    textures: ['archive-paper', 'film-scratch', 'red-thread'],
    density: 'dense',
  },
  'geopolitical-map': {
    palette: {paper: '#d8d1bd', ink: '#202527', primary: '#a7443d', secondary: '#3d7180', highlight: '#c5a041'},
    textures: ['map-paper', 'border-ink', 'newsprint'],
    density: 'medium',
  },
};

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 42);

const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
if (scenes.length < 8) throw new Error(`V4 requires at least 8 scenes, received ${scenes.length}`);

const world = String(plan.topicProfile?.visualWorld || scenes[0]?.visualWorld || 'general-explainer');
const artDirectionBase = ART_WORLDS[world] || {
  palette: {
    paper: plan.palette?.paper || '#e5dcc4',
    ink: plan.palette?.ink || '#28231f',
    primary: plan.palette?.red || '#ad443f',
    secondary: plan.palette?.teal || '#337482',
    highlight: plan.palette?.gold || '#d0a844',
  },
  textures: ['editorial-paper', 'print-grain', 'torn-edge'],
  density: 'medium',
};
const artDirection = {
  world,
  palette: artDirectionBase.palette,
  textures: artDirectionBase.textures,
  density: artDirectionBase.density,
};

const used = new Map();
const grammarHistory = [];
const cameraHistory = [];

for (let index = 0; index < scenes.length; index += 1) {
  const scene = scenes[index];
  const kindCandidates = KIND_GRAMMARS[scene.visualKind] || [];
  const actionCandidates = ACTION_GRAMMARS[scene.semanticAction] || [];
  const fallback = GRAMMARS[index % GRAMMARS.length];
  const candidates = [...new Set([...kindCandidates, ...actionCandidates, fallback, ...GRAMMARS])];
  const recent = grammarHistory.slice(-2);
  candidates.sort((a, b) => (used.get(a) || 0) - (used.get(b) || 0));
  const grammar = candidates.find((candidate) => !recent.includes(candidate)) || candidates[0];
  grammarHistory.push(grammar);
  used.set(grammar, (used.get(grammar) || 0) + 1);

  const cameraCandidates = CAMERA_BY_GRAMMAR[grammar] || ['push-in', 'pan-right'];
  const recentCamera = cameraHistory.slice(-1);
  const cameraMove = cameraCandidates.find((candidate) => !recentCamera.includes(candidate)) || cameraCandidates[index % cameraCandidates.length];
  cameraHistory.push(cameraMove);

  const primary = String(scene.primaryMotif || scene.heroVisual || scene.title || 'subject');
  const secondary = String(scene.secondaryMotif || scene.supportVisuals?.[0] || scene.kicker || 'detail');
  const nextScene = scenes[index + 1];
  const matchTarget = String(nextScene?.primaryMotif || nextScene?.heroVisual || secondary);

  scene.sceneGrammar = grammar;
  scene.cameraMove = cameraMove;
  scene.textMode = TEXT_MODES[index % TEXT_MODES.length];
  scene.compositionBias = BIASES[(index + (plan.seed || 0)) % BIASES.length];
  scene.layerCount = 7 + ((index + (plan.seed || 0)) % 6);
  scene.matchCutToken = normalize(`${secondary}-${matchTarget}`) || `scene-${index + 1}`;
  scene.artDirection = artDirection;
  scene.visualSignature = `v4:${grammar}:${cameraMove}:${scene.compositionBias}:${normalize(primary)}`;
}

const uniqueGrammars = new Set(grammarHistory);
const uniqueCameras = new Set(cameraHistory);
if (uniqueGrammars.size < Math.min(6, scenes.length)) {
  throw new Error(`V4 grammar diversity failed: ${uniqueGrammars.size} unique grammars`);
}
if (uniqueCameras.size < 4) {
  throw new Error(`V4 camera diversity failed: ${uniqueCameras.size} unique camera moves`);
}
if (grammarHistory.some((grammar, index) => index > 0 && grammar === grammarHistory[index - 1])) {
  throw new Error('V4 consecutive scene grammar repetition detected');
}

plan.v4 = {
  renderer: 'scene-grammar-v4',
  version: 4,
  grammarVersion: 1,
  artDirectionVersion: 1,
  visualWorld: world,
  fixedBottomCaption: false,
  matchCutContinuity: true,
  minimumGrammarDiversity: 6,
  grammarCount: uniqueGrammars.size,
  cameraCount: uniqueCameras.size,
  grammarSequence: grammarHistory,
  cameraSequence: cameraHistory,
  artDirection,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.renderVersion = 4;
  manifest.renderer = 'scene-grammar-v4';
  manifest.v4 = {
    visualWorld: world,
    grammarCount: uniqueGrammars.size,
    cameraCount: uniqueCameras.size,
    fixedBottomCaption: false,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
} catch {
  // Manifest is diagnostic-only; plan generation remains authoritative.
}

console.log(`V4 scene grammar ready: world=${world}, grammars=${uniqueGrammars.size}, cameras=${uniqueCameras.size}`);
console.log(`V4 grammar sequence: ${grammarHistory.join(' -> ')}`);

if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `renderer=scene-grammar-v4\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `grammar_count=${uniqueGrammars.size}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `camera_count=${uniqueCameras.size}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `scene_count=${scenes.length}\n`);
  await appendFile(process.env.GITHUB_OUTPUT, `profile=${world}\n`);
}
