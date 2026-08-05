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

const DOMAIN_RULES = [
  ['ancient-history', /\b(ancient|roman|rome|greek|egypt|silk road|empire|dynasty|medieval|mongol|ottoman|civilization|century|archaeolog|war|revolution|histor)\b/i],
  ['modern-history', /\b(world war|cold war|berlin wall|industrial revolution|modern history|twentieth century|20th century|soviet|nazi)\b/i],
  ['biological-micro', /\b(bacteria|virus|cell|dna|gene|antibiotic|immune|vaccine|microbe|fungus|blood|brain|disease|medicine)\b/i],
  ['space-cosmic', /\b(space|planet|star|galaxy|black hole|universe|orbit|gravity|asteroid|moon|sun)\b/i],
  ['technology-systems', /\b(internet|computer|software|algorithm|cable|fiber|network|chip|satellite|robot|server|signal|data center|battery|gps|qr code)\b/i],
  ['nature-field', /\b(animal|forest|ocean|ecosystem|species|insect|plant|tree|wildlife|river|volcano|whale|bee|octopus|desert|climate)\b/i],
  ['geopolitical-map', /\b(country|border|treaty|government|trade route|sanction|geopolit|territory|diplomacy|alliance|strait|nato|taiwan)\b/i],
  ['economic-data', /\b(economy|market|money|currency|inflation|interest rate|finance|price|stock|bank|gold|oil|debt)\b/i],
  ['forensic-case', /\b(mystery|crime|disappear|investigation|evidence|case|detective|voynich|dyatlov|cicada|roanoke|cooper)\b/i],
];

const MODE_LIBRARY = {
  'ancient-history': {
    quotas: {realistic: 0.55, archival: 0.25, diagram: 0.15, symbolic: 0.05},
    modes: ['historical-reconstruction', 'cartographic', 'archival-evidence', 'portrait-focus'],
    environments: ['trade-road', 'stone-city', 'desert-crossing', 'palace-interior', 'battlefield-haze'],
  },
  'modern-history': {
    quotas: {realistic: 0.45, archival: 0.38, diagram: 0.12, symbolic: 0.05},
    modes: ['archival-evidence', 'historical-reconstruction', 'cartographic', 'portrait-focus'],
    environments: ['newsroom-archive', 'industrial-city', 'checkpoint-street', 'war-room', 'crowd-square'],
  },
  'biological-micro': {
    quotas: {realistic: 0.45, archival: 0.05, diagram: 0.45, symbolic: 0.05},
    modes: ['scientific-macro', 'process-cutaway', 'comparison-lab', 'data-evidence'],
    environments: ['microscope-field', 'petri-dish', 'cell-interior', 'clinical-surface'],
  },
  'space-cosmic': {
    quotas: {realistic: 0.5, archival: 0.05, diagram: 0.4, symbolic: 0.05},
    modes: ['cosmic-reconstruction', 'orbital-diagram', 'scale-comparison', 'data-evidence'],
    environments: ['deep-space', 'observatory', 'planetary-horizon', 'accretion-field'],
  },
  'technology-systems': {
    quotas: {realistic: 0.38, archival: 0.04, diagram: 0.53, symbolic: 0.05},
    modes: ['technical-cutaway', 'system-map', 'realistic-object', 'data-evidence'],
    environments: ['machine-room', 'ocean-floor', 'electronics-bench', 'network-grid'],
  },
  'nature-field': {
    quotas: {realistic: 0.68, archival: 0.04, diagram: 0.23, symbolic: 0.05},
    modes: ['environmental-realism', 'behavior-closeup', 'ecological-map', 'scientific-macro'],
    environments: ['forest-floor', 'open-ocean', 'river-valley', 'night-desert', 'volcanic-sky'],
  },
  'geopolitical-map': {
    quotas: {realistic: 0.35, archival: 0.2, diagram: 0.4, symbolic: 0.05},
    modes: ['cartographic', 'institutional-reconstruction', 'archival-evidence', 'data-evidence'],
    environments: ['border-crossing', 'war-room', 'port-city', 'parliament-hall'],
  },
  'economic-data': {
    quotas: {realistic: 0.3, archival: 0.1, diagram: 0.55, symbolic: 0.05},
    modes: ['institutional-reconstruction', 'data-evidence', 'system-map', 'realistic-object'],
    environments: ['trading-floor', 'central-bank', 'port-logistics', 'household-table'],
  },
  'forensic-case': {
    quotas: {realistic: 0.4, archival: 0.4, diagram: 0.15, symbolic: 0.05},
    modes: ['archival-evidence', 'forensic-reconstruction', 'cartographic', 'portrait-focus'],
    environments: ['evidence-room', 'night-street', 'remote-landscape', 'archive-desk'],
  },
};

const topicText = lower(`${plan.topic} ${plan.title} ${plan.category} ${plan.narration}`);
const inferredDomain = DOMAIN_RULES.find(([, regex]) => regex.test(topicText))?.[0]
  || (plan.category === 'history' ? 'ancient-history'
    : plan.category === 'science' ? 'biological-micro'
      : plan.category === 'technology' ? 'technology-systems'
        : plan.category === 'nature' ? 'nature-field'
          : plan.category === 'economy' ? 'economic-data'
            : plan.category === 'geopolitics' ? 'geopolitical-map'
              : plan.category === 'mystery' ? 'forensic-case'
                : 'technology-systems');
const domain = MODE_LIBRARY[inferredDomain] ? inferredDomain : 'technology-systems';
const profile = MODE_LIBRARY[domain];
const seed = Number.isFinite(Number(plan.seed)) ? Number(plan.seed) : hash(plan.topic);

const sceneRole = (scene, index, total) => {
  const text = lower(`${scene.title} ${scene.voiceLine}`);
  if (index === 0) return 'hook';
  if (index === total - 1) return 'resolution';
  if (/before|after|versus|compared|difference|surviv|split|two sides|more than|less than/.test(text)) return 'comparison';
  if (/evidence|record|document|report|discovered|found|shows|proves|archive/.test(text)) return 'evidence';
  if (/because|therefore|caused|leads|allows|result|mechanism|works|process/.test(text)) return 'mechanism';
  if (/route|map|across|between|border|network|spread|travel|trade/.test(text)) return 'movement';
  return index < Math.ceil(total * 0.35) ? 'setup' : 'development';
};

const chooseMode = (scene, index, role) => {
  const text = lower(`${scene.title} ${scene.voiceLine} ${(scene.visualContract?.motifs || []).map((item) => item.label).join(' ')}`);
  const modes = profile.modes;
  const findMode = (pattern) => modes.find((mode) => pattern.test(mode));

  if (role === 'hook') return findMode(/reconstruction|realism|macro|cosmic|object/) || modes[0];
  if (role === 'resolution') return findMode(/data|evidence|archive|map|cartographic/) || modes[modes.length - 1];
  if (role === 'movement') return findMode(/map|cartographic/) || findMode(/system/) || modes[0];
  if (role === 'comparison') return findMode(/comparison/) || findMode(/data|evidence/) || modes[0];
  if (role === 'evidence') return findMode(/evidence|archive|data/) || modes[0];
  if (role === 'setup') {
    const establishing = findMode(/reconstruction|realism|closeup|object|cosmic|portrait/);
    if (establishing) return establishing;
  }
  if (/map|route|border|across|between|trade|spread|network|landing station|continent|global/.test(text)) {
    const mapMode = findMode(/map|cartographic/) || findMode(/system/);
    if (mapMode) return mapMode;
  }
  if (/document|record|archive|evidence|letter|treaty|report|manuscript/.test(text)) {
    const evidenceMode = findMode(/archive|evidence|data/);
    if (evidenceMode) return evidenceMode;
  }
  if (/person|people|emperor|king|queen|scientist|leader|merchant|soldier|inventor/.test(text)) {
    const portraitMode = findMode(/portrait|reconstruction/);
    if (portraitMode) return portraitMode;
  }
  if (/inside|layer|core|cutaway|mechanism|component|signal|fiber|cable|cell|dna/.test(text)) {
    const cutaway = findMode(/cutaway|macro|orbital-diagram/);
    if (cutaway) return cutaway;
  }
  if (role === 'mechanism') {
    const mechanismMode = findMode(/cutaway|macro|diagram|system/);
    if (mechanismMode) return mechanismMode;
  }
  return modes[(index + seed) % modes.length];
};

const presentationClass = (mode) => {
  if (/reconstruction|realism|closeup|object|cosmic|scientific-macro/.test(mode)) return 'realistic';
  if (/archiv|portrait/.test(mode)) return 'archival';
  if (/map|cartographic|cutaway|macro|diagram|data|system|comparison/.test(mode)) return 'diagram';
  return 'symbolic';
};

const heroAssetType = (mode, scene) => {
  const kinds = (scene.visualContract?.motifs || []).map((item) => item.kind);
  if (/map|cartographic|system-map|ecological-map/.test(mode)) return 'map';
  if (/archive|evidence/.test(mode)) return 'document';
  if (/portrait/.test(mode)) return 'person';
  if (/macro/.test(mode) || kinds.includes('organism')) return 'micro';
  if (/cutaway|orbital-diagram/.test(mode) || kinds.includes('cross-section')) return 'cutaway';
  if (/environment|reconstruction|forensic/.test(mode)) return 'environment';
  if (/data/.test(mode)) return 'data';
  return 'object';
};

const compositionFor = (mode, index) => {
  const variants = /archive|evidence/.test(mode)
    ? ['desk-scatter', 'evidence-wall', 'document-portrait', 'archive-stack']
    : /map/.test(mode) || mode === 'cartographic'
      ? ['route-diagonal', 'map-zoom', 'two-region-split', 'network-radial']
      : /macro/.test(mode)
        ? ['microscope-depth', 'survivor-center', 'cell-crossing', 'colony-expansion']
        : /cutaway/.test(mode)
          ? ['exploded-axis', 'transparent-shell', 'signal-through-core', 'layer-peel']
          : ['wide-establishing', 'foreground-hero', 'depth-corridor', 'silhouette-reveal'];
  return variants[(index + seed) % variants.length];
};

const realismFor = (mode) => {
  if (/reconstruction|realism|closeup|object|cosmic|scientific-macro/.test(mode)) return 0.86;
  if (/archiv|portrait/.test(mode)) return 0.78;
  if (/map|cartographic|cutaway|macro|diagram|comparison/.test(mode)) return 0.62;
  if (/data/.test(mode)) return 0.48;
  return 0.42;
};

const classCounts = new Map();
const modeCounts = new Map();
const total = (plan.scenes || []).length;
for (let index = 0; index < total; index += 1) {
  const scene = plan.scenes[index];
  const base = scene.visualContract;
  if (!base || base.version !== 7) throw new Error(`V8 Visual Director requires V7 contract; scene ${scene.id} is invalid.`);
  const role = sceneRole(scene, index, total);
  let mode = chooseMode(scene, index, role);
  let pClass = presentationClass(mode);
  const projected = (classCounts.get(pClass) || 0) + 1;
  const maximum = Math.max(1, Math.ceil((profile.quotas[pClass] || 0.05) * total) + 1);
  if (projected > maximum && pClass !== 'realistic') {
    const realisticMode = profile.modes.find((candidate) => presentationClass(candidate) === 'realistic');
    if (realisticMode) {
      mode = realisticMode;
      pClass = 'realistic';
    }
  }
  classCounts.set(pClass, (classCounts.get(pClass) || 0) + 1);
  modeCounts.set(mode, (modeCounts.get(mode) || 0) + 1);
  const heroType = heroAssetType(mode, scene);
  const environment = profile.environments[(index + seed + scene.id) % profile.environments.length];
  const realismScore = realismFor(mode);
  const assetAvailable = Boolean(scene.asset);
  const renderStrategy = assetAvailable
    ? 'asset-first'
    : realismScore >= 0.75
      ? 'procedural-reconstruction'
      : /map|cartographic|cutaway|macro|diagram|data|system|comparison/.test(mode)
        ? 'hybrid-explainer'
        : 'procedural-reconstruction';
  const depthPlan = {
    foreground: heroType === 'person' ? 'portrait silhouette and contextual prop' : `dominant ${heroType}`,
    midground: environment,
    background: /archive|evidence/.test(mode) ? 'layered paper and shadow depth' : 'contextual world with atmospheric perspective',
  };
  const avoid = unique([
    ...(base.direction?.avoid || []),
    'generic floating cards',
    'unrelated geometric shapes',
    'same centered composition in consecutive scenes',
    pClass === 'realistic' ? 'flat infographic-only treatment' : '',
    domain.includes('history') ? 'modern objects and futuristic UI' : '',
  ]).slice(0, 12);
  scene.visualContract = {
    ...base,
    version: 8,
    baseVersion: 7,
    visualDirection: {
      directorVersion: 1,
      domain,
      sceneRole: role,
      sceneMode: mode,
      presentationClass: pClass,
      realismScore,
      heroAssetType: heroType,
      environment,
      composition: compositionFor(mode, index),
      depthPlan,
      renderStrategy,
      assetPriority: assetAvailable ? 'use-existing' : realismScore >= 0.75 ? 'generate-if-available' : 'optional',
      subject: base.direction?.hero || base.subject || scene.title,
      supportingSubjects: (base.motifs || []).slice(1, 4).map((motif) => motif.label),
      avoid,
    },
  };
  scene.visualSignature = `visual-v8:${domain}:${mode}:${heroType}:${scene.visualContract.visualDirection.composition}:${scene.id}`.slice(0, 190);
  const promptStyle = pClass === 'realistic'
    ? 'historically or scientifically believable cinematic reconstruction, realistic materials, natural depth and lighting'
    : pClass === 'archival'
      ? 'authentic archival evidence collage with tactile documents, photographs, maps and physical shadows'
      : 'clear cinematic explainer with representational objects, physical depth and restrained graphic overlays';
  scene.imagePrompt = `Vertical 9:16 premium documentary scene about ${plan.topic}. ${promptStyle}. Scene: ${scene.voiceLine}. Main subject: ${scene.visualContract.visualDirection.subject}. Environment: ${environment}. Composition: ${scene.visualContract.visualDirection.composition}. Show ${[scene.visualContract.visualDirection.subject, ...scene.visualContract.visualDirection.supportingSubjects].join(', ')}. Avoid generic cards, unrelated shapes, readable captions, logos and watermarks.`;
}

const symbolicCount = classCounts.get('symbolic') || 0;
const allowedSymbolic = Math.max(1, Math.ceil(profile.quotas.symbolic * total));
if (symbolicCount > allowedSymbolic) throw new Error(`V8 Visual Director rejected shape-heavy plan: symbolic=${symbolicCount}, allowed=${allowedSymbolic}.`);
if (modeCounts.size < Math.min(3, total)) throw new Error(`V8 Visual Director requires at least three presentation modes; got ${[...modeCounts.keys()].join(', ')}.`);

plan.v8 = {
  renderer: 'visual-motion-documentary-v8',
  version: 8,
  failClosed: true,
  visualDirector: {
    version: 1,
    domain,
    realismTarget: Number((1 - profile.quotas.symbolic).toFixed(2)),
    quotas: profile.quotas,
    sceneModes: [...modeCounts.keys()],
    presentationCounts: Object.fromEntries(classCounts),
    themeFingerprint: `${domain}:${profile.modes.join('+')}:${seed % 997}`,
    templateLocked: false,
    shapeFirst: false,
  },
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V8 Visual Director ready: domain=${domain}, modes=${[...modeCounts.keys()].join(',')}, presentation=${JSON.stringify(Object.fromEntries(classCounts))}`);
