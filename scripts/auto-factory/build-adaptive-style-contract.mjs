import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const FAMILY_PROFILES = {
  'archive-noir': {
    palette: {bg: '#11100E', surface: '#E7D9BE', ink: '#17130F', primary: '#A62A22', secondary: '#B58B45', highlight: '#F0D6A0', muted: '#776B5C'},
    typography: 'serif-condensed', texture: 'aged-paper', lighting: 'projector-beam', shapeLanguage: 'torn-angular',
    motion: ['parallax', 'stamp', 'rack-focus'], effects: ['film-grain', 'dust', 'paper-tear', 'vignette'],
  },
  'cosmic-observatory': {
    palette: {bg: '#050812', surface: '#111A2E', ink: '#F1F5FF', primary: '#6F7CFF', secondary: '#D54BCE', highlight: '#F5C96A', muted: '#7380A0'},
    typography: 'wide-sans', texture: 'star-dust', lighting: 'rim-glow', shapeLanguage: 'orbital-radial',
    motion: ['orbit', 'drift', 'push-in'], effects: ['star-field', 'bloom', 'lens-warp', 'vignette'],
  },
  'biological-macro': {
    palette: {bg: '#07120F', surface: '#123127', ink: '#EEF8E8', primary: '#54D38A', secondary: '#F06C75', highlight: '#E9D66B', muted: '#759287'},
    typography: 'clean-sans', texture: 'organic-cells', lighting: 'microscope-glow', shapeLanguage: 'soft-organic',
    motion: ['multiply', 'pulse', 'drift'], effects: ['cell-particles', 'depth-blur', 'membrane-ripple', 'vignette'],
  },
  'technical-blueprint': {
    palette: {bg: '#07182B', surface: '#0E2B4A', ink: '#E9F5FF', primary: '#38BDF8', secondary: '#4ADE80', highlight: '#F8D34D', muted: '#6D91AB'},
    typography: 'mono-condensed', texture: 'blueprint-grid', lighting: 'edge-light', shapeLanguage: 'precise-linear',
    motion: ['trace', 'assemble', 'push-in'], effects: ['scan-lines', 'grid-drift', 'signal-pulse', 'vignette'],
  },
  'naturalist-field': {
    palette: {bg: '#10150E', surface: '#293222', ink: '#F2EBD7', primary: '#7BAE55', secondary: '#C88045', highlight: '#E8C66A', muted: '#7F8872'},
    typography: 'field-serif', texture: 'paper-fibers', lighting: 'sun-shaft', shapeLanguage: 'organic-layered',
    motion: ['macro-drift', 'parallax', 'rack-focus'], effects: ['floating-dust', 'leaf-shadow', 'soft-grain', 'vignette'],
  },
  'geopolitical-dossier': {
    palette: {bg: '#121414', surface: '#E2DECF', ink: '#161818', primary: '#C1372C', secondary: '#3E7D86', highlight: '#D5A64B', muted: '#77766E'},
    typography: 'editorial-condensed', texture: 'map-paper', lighting: 'desk-lamp', shapeLanguage: 'cartographic-angular',
    motion: ['map-trace', 'stamp', 'camera-whip'], effects: ['route-lines', 'ink-bleed', 'paper-fold', 'vignette'],
  },
  'forensic-thriller': {
    palette: {bg: '#090B0D', surface: '#171B20', ink: '#F4F5F6', primary: '#E3342F', secondary: '#58A6B7', highlight: '#F1CC66', muted: '#777F89'},
    typography: 'evidence-sans', texture: 'film-noise', lighting: 'hard-spotlight', shapeLanguage: 'evidence-layered',
    motion: ['snap-zoom', 'rack-focus', 'handheld'], effects: ['flash-frame', 'chromatic-fringe', 'dust', 'vignette'],
  },
  'industrial-cutaway': {
    palette: {bg: '#111417', surface: '#293038', ink: '#F2F4F5', primary: '#EF5B35', secondary: '#4AB3C7', highlight: '#F0C84B', muted: '#79838C'},
    typography: 'industrial-sans', texture: 'brushed-metal', lighting: 'work-light', shapeLanguage: 'mechanical-block',
    motion: ['explode', 'assemble', 'trace'], effects: ['sparks', 'smoke-haze', 'technical-lines', 'vignette'],
  },
  'mythic-epic': {
    palette: {bg: '#130E0A', surface: '#302018', ink: '#FAEBD0', primary: '#B73A2E', secondary: '#BE8B42', highlight: '#F2D18B', muted: '#826C59'},
    typography: 'monumental-serif', texture: 'stone-grain', lighting: 'fire-rim', shapeLanguage: 'monumental-silhouette',
    motion: ['slow-push', 'parallax', 'banner-drift'], effects: ['embers', 'smoke', 'carved-lines', 'vignette'],
  },
  'data-thriller': {
    palette: {bg: '#070B12', surface: '#121C2B', ink: '#ECF5FF', primary: '#2DD4BF', secondary: '#60A5FA', highlight: '#FBBF24', muted: '#6B829B'},
    typography: 'data-mono', texture: 'matrix-grid', lighting: 'screen-glow', shapeLanguage: 'modular-geometric',
    motion: ['cascade', 'scan', 'pulse'], effects: ['data-rain', 'scan-lines', 'glitch-slice', 'vignette'],
  },
  'editorial-collage': {
    palette: {bg: '#171614', surface: '#E8DFCB', ink: '#171614', primary: '#D34438', secondary: '#3B8992', highlight: '#DBB64C', muted: '#756F66'},
    typography: 'editorial-sans', texture: 'print-grain', lighting: 'soft-spotlight', shapeLanguage: 'cut-paper-layered',
    motion: ['parallax', 'paper-slide', 'push-in'], effects: ['halftone', 'paper-shadow', 'film-grain', 'vignette'],
  },
};

const FAMILY_RULES = [
  ['cosmic-observatory', /\b(space|planet|star|galaxy|black hole|universe|cosmic|orbit|gravity|asteroid|moon|sun|light year)\b/gi],
  ['biological-macro', /\b(bacteria|virus|cell|dna|gene|antibiotic|immune|disease|microbe|fungus|blood|brain|organ|medicine|health)\b/gi],
  ['technical-blueprint', /\b(internet|computer|software|ai|algorithm|cable|fiber|network|chip|satellite|robot|technology|server|signal|data center)\b/gi],
  ['naturalist-field', /\b(animal|forest|ocean|ecosystem|species|ant|insect|plant|tree|nature|wildlife|climate|river|volcano)\b/gi],
  ['geopolitical-dossier', /\b(country|border|treaty|government|election|trade|sanction|geopolit|nation|territory|diplomacy|alliance)\b/gi],
  ['archive-noir', /\b(history|historical|archive|century|ancient|empire|war|revolution|king|queen|document|civilization)\b/gi],
  ['forensic-thriller', /\b(mystery|crime|disappear|secret|investigation|evidence|conspiracy|unknown|case|detective|fraud)\b/gi],
  ['industrial-cutaway', /\b(engine|machine|factory|mechanism|vehicle|aircraft|ship|reactor|manufactur|turbine|device|weapon)\b/gi],
  ['mythic-epic', /\b(myth|legend|god|hero|epic|warrior|ritual|temple|folklore|saga)\b/gi],
  ['data-thriller', /\b(economy|market|money|currency|inflation|statistics|growth|population|finance|price|stock|number)\b/gi],
];

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalized = (value) => clean(value).toLowerCase();
const hash = (value) => {
  let h = 2166136261;
  for (const char of String(value)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};
const countMatches = (text, regex) => (text.match(regex) || []).length;
const shortLabel = (value, max = 38) => {
  const text = clean(value).replace(/[.!?;:]+$/g, '');
  if (text.length <= max) return text;
  const words = text.split(/\s+/).filter(Boolean);
  let output = '';
  for (const word of words) {
    const next = output ? `${output} ${word}` : word;
    if (next.length > max) break;
    output = next;
  }
  return output || text.slice(0, max).trim();
};
const uniqueLabels = (values) => {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const label = shortLabel(value);
    const key = normalized(label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(label);
  }
  return output;
};

const selectFamilies = (text) => {
  const scored = FAMILY_RULES.map(([family, regex]) => ({family, score: countMatches(text, regex)}))
    .sort((a, b) => b.score - a.score || a.family.localeCompare(b.family));
  const primary = scored[0]?.score > 0 ? scored[0].family : 'editorial-collage';
  const secondaryCandidate = scored.find((entry) => entry.family !== primary && entry.score > 0)?.family;
  const fallbackSecondary = primary === 'archive-noir' ? 'mythic-epic'
    : primary === 'technical-blueprint' ? 'data-thriller'
      : primary === 'biological-macro' ? 'forensic-thriller'
        : primary === 'naturalist-field' ? 'editorial-collage'
          : 'editorial-collage';
  return {primary, secondary: secondaryCandidate || fallbackSecondary, scores: scored.filter((entry) => entry.score > 0)};
};

const motifKind = (label, sceneText, mode) => {
  const own = normalized(label);
  const context = normalized(sceneText);
  if (/map|border|route|country|continent|global|world|transmission/.test(own)) return 'map-route';
  if (/dose|schedule|course|day|timeline|generation|before|after|sequence/.test(own)) return 'timeline';
  if (/antibiotic|capsule|pill|tablet|drug|medicine|treatment/.test(own)) return 'hero-object';
  if (/dna|cell|bacteria|bacterium|virus|microbe|fungus|organism|blood|brain|gene|plasmid|mutation|colony/.test(own)) return 'organism';
  if (/planet|star|orbit|galaxy|black hole|gravity|light/.test(own)) return 'orbital';
  if (/cable|fiber|layer|core|inside|cross.section|structure/.test(own) || mode === 'exploded') return 'cross-section';
  if (/machine|engine|device|factory|mechanism|turbine|reactor|gear/.test(own)) return 'mechanism';
  if (/document|archive|letter|treaty|evidence|record|report/.test(own) || mode === 'evidence') return 'document';
  if (/person|people|human|emperor|king|queen|scientist|soldier|leader|host/.test(own)) return 'portrait';
  if (/animal|food|water|forest|ocean|river|mountain|environment|habitat|city|battlefield/.test(own)) return 'environment';
  if (/percent|rate|number|growth|decline|data|price|population|money/.test(own)) return 'data';
  if (/force|pressure|heat|energy|wave|radiation|magnetic|electric/.test(own)) return 'force-field';
  if (mode === 'network') return 'network';
  if (mode === 'timeline') return 'timeline';
  if (/bacteria|antibiotic|dna|gene|microbe/.test(context)) return 'organism';
  if (/cable|fiber|network|internet/.test(context)) return 'cross-section';
  if (/space|planet|star|galaxy|gravity/.test(context)) return 'orbital';
  return 'hero-object';
};

const sceneFamily = (base, scene) => {
  const text = normalized(`${scene.title} ${scene.voiceLine} ${(scene.visualContract?.labels || []).join(' ')}`);
  const local = selectFamilies(text);
  const specialized = Boolean(clean(scene.semanticLockRule));
  if (specialized) return base.primary;
  if (local.scores[0]?.score >= 2 && local.primary !== base.primary) return local.primary;
  if (['evidence', 'timeline'].includes(scene.visualContract?.mode) && base.primary !== 'archive-noir') return base.secondary;
  return base.primary;
};

const sceneMotion = (profile, scene, index) => {
  const mode = scene.visualContract?.mode || 'focus';
  if (mode === 'network') return 'trace';
  if (mode === 'process') return 'assemble';
  if (mode === 'comparison') return 'rack-focus';
  if (mode === 'timeline') return 'parallax';
  return profile.motion[index % profile.motion.length];
};

const labelsForScene = (scene, base) => {
  const specialized = Boolean(clean(scene.semanticLockRule));
  if (!specialized) return uniqueLabels(base.labels || []).slice(0, 5);
  const concrete = [
    scene.title,
    ...(Array.isArray(scene.mustShow) ? scene.mustShow : []),
    ...(Array.isArray(scene.props) ? scene.props : []),
    ...(Array.isArray(scene.supportVisuals) ? scene.supportVisuals : []),
    scene.primaryMotif,
    scene.secondaryMotif,
    ...(Array.isArray(base.labels) ? base.labels : []),
  ].filter(Boolean);
  const concise = concrete.filter((value) => clean(value).split(/\s+/).length <= 5);
  return uniqueLabels([scene.title, ...concise, ...concrete]).slice(0, 5);
};

const topicText = normalized(`${plan.topic} ${plan.category} ${plan.title} ${plan.narration}`);
const families = selectFamilies(topicText);
const videoSeed = Number.isFinite(Number(plan.seed)) ? Number(plan.seed) : hash(plan.topic);
const usedFamilies = new Set();
const usedMotifs = new Set();

for (let index = 0; index < (plan.scenes || []).length; index += 1) {
  const scene = plan.scenes[index];
  const base = scene.visualContract;
  if (!base || base.version !== 6) {
    throw new Error(`V7 requires a valid V6 visual contract first; scene ${scene.id} is missing it.`);
  }
  const family = sceneFamily(families, scene);
  const profile = FAMILY_PROFILES[family];
  const labels = labelsForScene(scene, base);
  const sceneText = `${scene.title} ${scene.voiceLine} ${labels.join(' ')}`;
  const motifs = labels.map((label, motifIndex) => ({
    label,
    kind: motifKind(label, sceneText, base.mode),
    importance: motifIndex === 0 ? 'hero' : motifIndex < 3 ? 'support' : 'detail',
    depth: motifIndex % 3,
  }));
  if (motifs.length < 2) throw new Error(`V7 scene ${scene.id} has fewer than two drawable motifs.`);
  usedFamilies.add(family);
  motifs.forEach((motif) => usedMotifs.add(motif.kind));
  const effectOffset = (videoSeed + scene.id + index) % profile.effects.length;
  const effects = [
    profile.effects[effectOffset],
    profile.effects[(effectOffset + 1) % profile.effects.length],
    profile.effects[(effectOffset + 2) % profile.effects.length],
  ];
  scene.visualContract = {
    ...base,
    version: 7,
    baseVersion: 6,
    labels,
    subject: labels[0],
    motifs,
    style: {
      family,
      palette: profile.palette,
      typography: profile.typography,
      texture: profile.texture,
      lighting: profile.lighting,
      shapeLanguage: profile.shapeLanguage,
      motion: sceneMotion(profile, scene, index),
      transition: scene.transition || (family === 'archive-noir' ? 'paper-tear' : 'match-zoom'),
      effects,
      density: scene.detailLevel === 3 ? 'dense' : scene.detailLevel === 1 ? 'light' : 'medium',
      fingerprint: `${family}:${profile.texture}:${profile.shapeLanguage}:${videoSeed % 997}`,
    },
    direction: {
      hero: motifs[0].label,
      staging: base.mode,
      assetStrategy: scene.asset ? 'asset-collage' : 'procedural-illustration',
      avoid: ['generic cards', 'unrelated geometry', 'template placeholders', ...(scene.avoid || [])].slice(0, 10),
    },
  };
  scene.visualSignature = `adaptive-v7:${family}:${base.mode}:${motifs.map((motif) => motif.kind).join('-')}:${scene.id}`.slice(0, 180);
  scene.imagePrompt = `Vertical 9:16 premium streaming documentary frame about ${plan.topic}. Scene meaning: ${scene.voiceLine}. Draw ${motifs.map((motif) => `${motif.label} as ${motif.kind}`).join(', ')}. Art direction: ${family}, ${profile.texture}, ${profile.lighting}, ${profile.shapeLanguage}. Layered foreground, middle ground and background, cinematic depth, no unrelated geometry, no captions, no logos.`;
}

plan.v7 = {
  renderer: 'adaptive-documentary-v7',
  version: 7,
  directorVersion: 2,
  primaryFamily: families.primary,
  secondaryFamily: families.secondary,
  usedFamilies: [...usedFamilies],
  motifKinds: [...usedMotifs],
  seed: videoSeed,
  adaptiveStyle: true,
  fixedStyle: false,
  failClosed: true,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`Adaptive V7 art direction ready: primary=${families.primary}, secondary=${families.secondary}, sceneFamilies=${[...usedFamilies].join(',')}, motifs=${[...usedMotifs].join(',')}`);
