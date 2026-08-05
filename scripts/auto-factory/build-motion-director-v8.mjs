import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();
const unique = (values) => [...new Set(values.filter(Boolean))];
const hash = (value) => {
  let state = 2166136261;
  for (const char of String(value)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return state >>> 0;
};
const seed = Number.isFinite(Number(plan.seed)) ? Number(plan.seed) : hash(plan.topic);

const CAMERA_BY_MODE = {
  'historical-reconstruction': ['slow-push', 'track-right', 'parallax-drift', 'tilt-up'],
  'forensic-reconstruction': ['handheld-drift', 'rack-focus', 'slow-push'],
  'institutional-reconstruction': ['dolly-in', 'track-left', 'parallax-drift'],
  'environmental-realism': ['aerial-descent', 'track-right', 'slow-push', 'parallax-drift'],
  'behavior-closeup': ['macro-drift', 'rack-focus', 'orbit-soft'],
  'scientific-macro': ['macro-drift', 'orbit-soft', 'focus-shift'],
  'process-cutaway': ['dolly-in', 'cross-section-track', 'focus-shift'],
  'technical-cutaway': ['cross-section-track', 'dolly-in', 'pan-right'],
  'realistic-object': ['hero-orbit', 'slow-push', 'tilt-down'],
  'cosmic-reconstruction': ['orbit-wide', 'slow-push', 'pull-out'],
  'orbital-diagram': ['orbit-wide', 'map-zoom', 'pull-out'],
  cartographic: ['map-zoom', 'route-follow', 'pan-right'],
  'system-map': ['route-follow', 'map-zoom', 'pan-left'],
  'ecological-map': ['map-zoom', 'route-follow', 'aerial-descent'],
  'archival-evidence': ['desk-parallax', 'rack-focus', 'document-push'],
  'portrait-focus': ['portrait-push', 'rack-focus', 'parallax-drift'],
  'comparison-lab': ['split-push', 'rack-focus', 'static-tension'],
  'scale-comparison': ['pull-out', 'split-push', 'static-tension'],
  'data-evidence': ['graph-track', 'dolly-in', 'static-tension'],
};

const PATHS = [
  {from: 'deep-background', to: 'center', curve: 'ease-out'},
  {from: 'left', to: 'center', curve: 'arc-up'},
  {from: 'right', to: 'center', curve: 'arc-down'},
  {from: 'bottom', to: 'foreground', curve: 'ease-out'},
  {from: 'top', to: 'center', curve: 'float'},
];

const motionModeFor = (mode, role) => {
  if (role === 'hook') return 'cinematic-reveal';
  if (/map/.test(mode) || mode === 'cartographic') return 'map-route';
  if (/archive|portrait/.test(mode)) return 'archival-parallax';
  if (/macro|behavior/.test(mode)) return 'macro-drift';
  if (/cutaway/.test(mode)) return 'diagram-assemble';
  if (/comparison/.test(mode)) return 'impact-comparison';
  if (/data/.test(mode)) return 'data-build';
  if (role === 'resolution') return 'answer-lock';
  return 'cinematic-reveal';
};

const transitionForPair = (previous, current, index, lastTransition) => {
  const prevMode = previous?.visualContract?.visualDirection?.sceneMode || '';
  const mode = current.visualContract.visualDirection.sceneMode;
  const prevHero = previous?.visualContract?.visualDirection?.heroAssetType;
  const hero = current.visualContract.visualDirection.heroAssetType;
  const text = lower(`${current.title} ${current.voiceLine}`);
  let candidates;
  if (!previous) candidates = ['cinematic-reveal'];
  else if (/split|two|divide|versus|surviv/.test(text)) candidates = ['crack-split', 'match-cut', 'depth-dissolve'];
  else if (/map/.test(mode) || mode === 'cartographic') candidates = ['map-zoom', 'route-carry', 'paper-map-wipe'];
  else if (/macro/.test(mode) && /macro/.test(prevMode)) candidates = ['organic-morph', 'focus-dissolve', 'match-cut'];
  else if (/cutaway/.test(mode) || hero === 'cutaway') candidates = ['zoom-through', 'signal-carry', 'layer-peel'];
  else if (hero === prevHero) candidates = ['match-cut', 'focus-dissolve', 'depth-dissolve'];
  else if (/archive|portrait/.test(mode)) candidates = ['paper-tear', 'ink-spread', 'desk-wipe'];
  else candidates = ['depth-dissolve', 'match-zoom', 'light-wipe'];
  const ordered = candidates.filter((item) => item !== lastTransition);
  return (ordered.length ? ordered : candidates)[(index + seed) % (ordered.length || candidates.length)];
};

const cameraFor = (mode, index, lastCamera) => {
  const candidates = CAMERA_BY_MODE[mode] || ['slow-push', 'parallax-drift', 'track-right'];
  const filtered = candidates.filter((item) => item !== lastCamera);
  const pool = filtered.length ? filtered : candidates;
  return pool[(index + seed) % pool.length];
};

const intensityFor = (role, index, total) => {
  if (role === 'hook') return 5;
  if (role === 'resolution') return 4;
  if (role === 'comparison' || role === 'mechanism') return 4;
  if (index === Math.floor(total * 0.65)) return 5;
  return index % 3 === 0 ? 3 : 2;
};

const choreographyFor = (scene, motionMode, intensity) => {
  const labels = (scene.visualContract.motifs || []).map((motif) => motif.label);
  const base = [
    {layerId: 'environment', animation: motionMode === 'archival-parallax' ? 'parallax-slide' : 'depth-reveal', from: 'background', to: 'midground', start: 0, end: 0.36, easing: 'ease-out'},
    {layerId: 'hero', animation: motionMode === 'diagram-assemble' ? 'assemble' : motionMode === 'macro-drift' ? 'organic-grow' : 'cinematic-enter', from: 'off-axis', to: 'focus', start: 0.05, end: 0.42, easing: 'spring-soft'},
    {layerId: 'support-1', label: labels[1] || labels[0], animation: /map-route/.test(motionMode) ? 'draw-on' : 'reveal-connect', from: 'edge', to: 'support', start: 0.26, end: 0.58, easing: 'ease-out'},
    {layerId: 'support-2', label: labels[2] || labels[1] || labels[0], animation: motionMode === 'impact-comparison' ? 'counter-enter' : 'reveal-connect', from: 'opposite-edge', to: 'support', start: 0.42, end: 0.72, easing: 'ease-out'},
    {layerId: 'labels', animation: 'focus-lock', from: 'soft', to: 'sharp', start: 0.54, end: 0.82, easing: 'ease-in-out'},
  ];
  if (intensity >= 4) base.push({layerId: 'accent', animation: 'impact-pulse', from: 'hidden', to: 'flash', start: 0.68, end: 0.82, easing: 'sharp'});
  return base;
};

const emphasisFor = (scene, intensity) => {
  const beats = Array.isArray(scene.beats) ? scene.beats : [];
  const moments = beats.slice(0, intensity >= 4 ? 3 : 2).map((beat, index) => ({
    at: Math.max(0.12, Math.min(0.86, Number(beat.at) || 0.35 + index * 0.2)),
    effect: index === 0 ? 'contour-highlight' : index === 1 ? 'light-pulse' : 'impact-flash',
    target: clean(beat.label || scene.visualContract.visualDirection.subject),
    strength: intensity >= 4 ? 0.9 : 0.62,
  }));
  if (!moments.length) moments.push({at: 0.58, effect: 'contour-highlight', target: scene.visualContract.visualDirection.subject, strength: 0.7});
  return moments;
};

let lastTransition = '';
let lastCamera = '';
const transitionCounts = new Map();
const cameraCounts = new Map();
const total = (plan.scenes || []).length;
for (let index = 0; index < total; index += 1) {
  const scene = plan.scenes[index];
  const contract = scene.visualContract;
  if (!contract || contract.version !== 8 || !contract.visualDirection) throw new Error(`V8 Motion Director requires V8 visual direction; scene ${scene.id} is invalid.`);
  const role = contract.visualDirection.sceneRole;
  const mode = contract.visualDirection.sceneMode;
  const intensity = intensityFor(role, index, total);
  const motionMode = motionModeFor(mode, role);
  const cameraMove = cameraFor(mode, index, lastCamera);
  const transitionIn = transitionForPair(plan.scenes[index - 1], scene, index, lastTransition);
  const heroPath = PATHS[(index + seed + scene.id) % PATHS.length];
  const transitionOut = index === total - 1 ? 'answer-hold' : transitionForPair(scene, plan.scenes[index + 1], index + 1, transitionIn);
  const text = lower(`${scene.title} ${scene.voiceLine}`);
  const fxBudget = {
    intensity,
    grain: /history|archive|forensic/.test(contract.visualDirection.domain),
    glow: /macro|cosmic|technical|signal|energy/.test(`${mode} ${text}`),
    particles: intensity >= 4 || /space|macro|environment/.test(mode),
    vignette: true,
    motionBlurHint: intensity >= 3,
    maxConcurrentEffects: intensity >= 5 ? 4 : intensity >= 3 ? 3 : 2,
  };
  scene.motionContract = {
    version: 8,
    directorVersion: 1,
    sceneRole: role,
    motionMode,
    cameraMove,
    transitionIn,
    transitionOut,
    heroPath,
    phaseTiming: {entranceEnd: 0.24, explanationEnd: 0.74, exitStart: 0.88},
    choreography: choreographyFor(scene, motionMode, intensity),
    emphasisMoments: emphasisFor(scene, intensity),
    fxBudget,
    continuityAnchor: {
      outgoing: contract.visualDirection.heroAssetType,
      incoming: plan.scenes[index - 1]?.visualContract?.visualDirection?.heroAssetType || 'none',
      semanticBridge: transitionIn,
    },
  };
  scene.visualSignature = `${scene.visualSignature}:motion-${motionMode}:${cameraMove}:${transitionIn}`.slice(0, 240);
  lastTransition = transitionIn;
  lastCamera = cameraMove;
  transitionCounts.set(transitionIn, (transitionCounts.get(transitionIn) || 0) + 1);
  cameraCounts.set(cameraMove, (cameraCounts.get(cameraMove) || 0) + 1);
}

const longestRun = (values) => values.reduce((state, value) => {
  const run = value === state.last ? state.run + 1 : 1;
  return {last: value, run, max: Math.max(state.max, run)};
}, {last: '', run: 0, max: 0}).max;
const transitions = plan.scenes.map((scene) => scene.motionContract.transitionIn);
const cameras = plan.scenes.map((scene) => scene.motionContract.cameraMove);
if (longestRun(transitions) > 2) throw new Error(`V8 Motion Director repeated one transition more than twice: ${transitions.join(' -> ')}`);
if (longestRun(cameras) > 2) throw new Error(`V8 Motion Director repeated one camera move more than twice: ${cameras.join(' -> ')}`);
if (new Set(transitions).size < Math.min(3, total)) throw new Error(`V8 Motion Director needs more transition diversity: ${unique(transitions).join(', ')}`);
if (new Set(cameras).size < Math.min(3, total)) throw new Error(`V8 Motion Director needs more camera diversity: ${unique(cameras).join(', ')}`);

plan.v8 = {
  ...(plan.v8 || {}),
  renderer: 'visual-motion-documentary-v8',
  version: 8,
  failClosed: true,
  motionDirector: {
    version: 1,
    transitionTypes: [...transitionCounts.keys()],
    cameraMoves: [...cameraCounts.keys()],
    transitionCounts: Object.fromEntries(transitionCounts),
    cameraCounts: Object.fromEntries(cameraCounts),
    semanticTransitions: true,
    randomMotion: false,
    choreographyRequired: true,
  },
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V8 Motion Director ready: transitions=${[...transitionCounts.keys()].join(',')}, cameras=${[...cameraCounts.keys()].join(',')}`);
