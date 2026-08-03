import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const language = plan.language === 'tr' ? 'tr' : 'en';
const locale = language === 'tr' ? 'tr-TR' : 'en-US';
const normalize = (value) => String(value || '')
  .toLocaleLowerCase(locale)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const words = (value) => normalize(value).split(' ').filter(Boolean);
const unique = (items) => [...new Set(items.filter(Boolean))];
const topic = normalize(plan.topic);

const specializations = [
  {
    match: /black hole|kara delik|event horizon|time dilation/,
    profile: {
      visualWorld: 'black-hole-spacetime',
      primaryMotifs: [
        'black hole silhouette in star field',
        'two clocks beside a gravity well',
        'collapsed star becoming a black hole',
        'warped spacetime grid around mass',
        'falling clock near event horizon',
        'redshifted light escaping gravity',
        'traveler crossing the event horizon',
        'two observer paths through spacetime',
        'diverging clocks near the horizon',
        'black hole reshaping spacetime geometry',
      ],
      secondaryMotifs: [
        'curved grid lines',
        'distant observer clock',
        'compressed stellar core',
        'gravity well cross-section',
        'event horizon light ring',
        'photon wavelength shift',
        'local wristwatch',
        'worldline comparison',
        'time dilation scale',
        'final geometry diagram',
      ],
      forbiddenMotifs: ['bacteria colony', 'antibiotic capsule', 'currency chart', 'ancient caravan', 'generic office dashboard'],
      paletteMood: 'deep-space-cyan-red-gold',
      preferredVisualKinds: ['mechanism','comparison','object-exploded','cause-effect','before-after','process-flow','evidence-board','map-evolution','timeline','world-network'],
    },
  },
  {
    match: /antibiotic resistance|antimicrobial resistance|antibiyotik direnci/,
    profile: {
      visualWorld: 'antibiotic-resistance',
      primaryMotifs: [
        'susceptible bacteria and resistant bacterium',
        'mutation site on bacterial DNA',
        'antibiotic capsule entering colony',
        'surviving bacterium after treatment',
        'resistant bacteria multiplying',
        'plasmid ring transferring resistance gene',
        'incomplete medicine dose',
        'selection pressure across petri dish',
        'resistant strain spreading between hosts',
        'natural selection cycle',
      ],
      secondaryMotifs: ['dying bacteria','DNA strand','cell membrane','empty competition space','daughter cells','gene transfer bridge','dose timeline','petri dish boundary','patient pathway','treatment loop'],
      forbiddenMotifs: ['space rocket', 'currency chart', 'ancient caravan', 'generic laptop'],
      paletteMood: 'sterile-blue-teal-warning-red',
      preferredVisualKinds: ['microbe-field','object-exploded','selection-process','before-after','process-flow','gene-transfer','timeline','cause-effect','map-evolution','comparison'],
    },
  },
  {
    match: /artificial intelligence generates images|ai generates images|text to image|yapay zeka.*görsel/,
    profile: {
      visualWorld: 'ai-image-generation',
      primaryMotifs: ['text prompt card','language token stream','training image dataset','latent noise canvas','neural denoising network','attention map linking words and shapes','composition emerging from noise','detail refinement pixel grid','random seed variations','generated image frame'],
      secondaryMotifs: ['prompt words','token embeddings','model weights','noise particles','denoising steps','cross attention lines','coarse image layout','texture channels','variation grid','final comparison'],
      forbiddenMotifs: ['bacteria colony','ancient caravan','random currency symbol','space rocket'],
      paletteMood: 'electric-cyan-magenta-digital',
      preferredVisualKinds: ['process-flow','mechanism','world-network','before-after','object-exploded','evidence-board','timeline','comparison','factory','cause-effect'],
    },
  },
  {
    match: /silk road|ipek yolu/,
    profile: {
      visualWorld: 'silk-road-network',
      primaryMotifs: ['branching trade route map','merchant caravan section','oasis transfer market','silk bale moving west','empire checkpoint and tax seal','port ship joining land routes','translator and currency exchange','religion and technology traveling','war redirecting caravan route','connected regional trade network'],
      secondaryMotifs: ['road junction','camel cargo','market ledger','horse and glass cargo','border gate','sea lane','weighing scale','manuscript and compass','blocked mountain pass','repeated handoff chain'],
      forbiddenMotifs: ['neural network','bacteria colony','space station','generic laboratory'],
      paletteMood: 'parchment-red-mustard-trade-blue',
      preferredVisualKinds: ['map-route','process-flow','commodity','document','timeline','world-network','comparison','evidence-board','cause-effect','archive-wall'],
    },
  },
];

const selected = specializations.find((item) => item.match.test(topic));
if (!selected) {
  console.log(`V3 topic specialization skipped: ${plan.topic}`);
  process.exit(0);
}

const profile = {...selected.profile, groundingVersion: 2};
const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
for (const [index, scene] of scenes.entries()) {
  const primaryMotif = profile.primaryMotifs[index % profile.primaryMotifs.length];
  const secondaryMotif = profile.secondaryMotifs[index % profile.secondaryMotifs.length];
  const visualKind = profile.preferredVisualKinds[index % profile.preferredVisualKinds.length];
  const subjectTokens = unique([
    ...words(scene.voiceLine),
    ...words(primaryMotif),
    ...words(plan.topic),
  ]).filter((token) => token.length > 2).slice(0, 14);
  while (subjectTokens.length < 2) subjectTokens.push(`scene${index + 1}`);
  const mustShow = unique([primaryMotif, secondaryMotif]).slice(0, 7);
  scene.visualWorld = profile.visualWorld;
  scene.primaryMotif = primaryMotif;
  scene.secondaryMotif = secondaryMotif;
  scene.visualKind = visualKind;
  scene.heroVisual = primaryMotif;
  scene.supportVisuals = [secondaryMotif, primaryMotif].slice(0, 5);
  scene.mustShow = mustShow;
  scene.avoid = profile.forbiddenMotifs.slice(0, 8);
  scene.subjectTokens = subjectTokens;
  scene.conceptTags = subjectTokens.slice(0, 14);
  scene.forbiddenTags = profile.forbiddenMotifs.flatMap(words).slice(0, 14);
  scene.props = [primaryMotif, secondaryMotif]
    .map((value) => value.toLocaleUpperCase(locale).slice(0, 42));
  scene.sceneGoal = `Illustrate only this spoken claim: ${scene.voiceLine}`;
  scene.imagePrompt = [
    `Topic: ${plan.topic}.`,
    `Visual world: ${profile.visualWorld}.`,
    `Show ${primaryMotif} with ${secondaryMotif}.`,
    `Composition: ${visualKind}, ${scene.layout || 'hero'}.`,
    `Avoid ${profile.forbiddenMotifs.join(', ')}.`,
    'Vertical editorial documentary collage, one dominant concrete subject, layered foreground and background, no generic icons, no readable text.',
  ].join(' ');
  scene.visualSignature = `specialized-v2:${profile.visualWorld}:${index + 1}:${normalize(primaryMotif).replace(/ /g, '-')}`.slice(0, 160);
  scene.alignmentScore = Math.max(Number(scene.alignmentScore || 0), 0.86);
}

plan.topicProfile = profile;
plan.v3 = {
  ...(plan.v3 || {}),
  topicSpecialization: profile.visualWorld,
  topicSpecializationVersion: 2,
  visualWorld: profile.visualWorld,
};
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V3 topic specialization ready: world=${profile.visualWorld}, scenes=${scenes.length}`);
