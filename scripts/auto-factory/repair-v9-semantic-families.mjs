import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];

const FAMILY_META = {
  'geographic-route': {
    physical: false,
    motion: 'route-trace-with-camera-follow',
    fallback: 'layered-route-map',
    goal: 'a directional geographic system with origin, destination, intermediary hubs, terrain and moving flow',
  },
  'human-reconstruction': {
    physical: true,
    motion: 'parallax-push-with-action-reveal',
    fallback: 'layered-human-silhouette-scene',
    goal: 'people physically performing the narrated action in a believable place, period and scale',
  },
  'environmental-reconstruction': {
    physical: true,
    motion: 'depth-parallax-establishing',
    fallback: 'layered-environment-stage',
    goal: 'a layered real environment whose terrain and scale explain the claim',
  },
  'industrial-process': {
    physical: true,
    motion: 'machine-follow-and-process-build',
    fallback: 'industrial-layer-stage',
    goal: 'real machinery, material flow, production stages and operator relationships',
  },
  'mechanism-cutaway': {
    physical: true,
    motion: 'shell-open-and-signal-flow',
    fallback: 'semantic-cutaway',
    goal: 'an object-preserving cutaway with layers, input, transformation and output',
  },
  'microscopic-process': {
    physical: true,
    motion: 'macro-drift-and-cause-effect',
    fallback: 'organic-macro-stage',
    goal: 'biological actors at coherent microscopic scale showing cause, survival, transfer or replication',
  },
  'market-exchange': {
    physical: true,
    motion: 'object-match-cut-through-handoffs',
    fallback: 'layered-exchange-stage',
    goal: 'people, goods, stalls and a visible physical handoff that makes exchange concrete',
  },
  'network-flow': {
    physical: false,
    motion: 'node-activation-and-flow-carry',
    fallback: 'semantic-network-stage',
    goal: 'specific physical hubs, direction, propagation and bottlenecks rather than decorative lines',
  },
  'archival-evidence': {
    physical: true,
    motion: 'evidence-pullout-and-highlight',
    fallback: 'archive-desk-stage',
    goal: 'specific documents, objects or records arranged with a readable evidence hierarchy',
  },
  'hazard-operation': {
    physical: true,
    motion: 'threat-approach-impact-and-response',
    fallback: 'hazard-operation-stage',
    goal: 'the physical threat, affected subject, impact and response in one spatial world',
  },
  'comparison-stage': {
    physical: false,
    motion: 'matched-split-and-difference-reveal',
    fallback: 'semantic-comparison-stage',
    goal: 'two concrete states compared at matched scale and camera position',
  },
  'timeline-causality': {
    physical: false,
    motion: 'event-trace-and-causal-carry',
    fallback: 'causal-timeline-stage',
    goal: 'distinct ordered events with visible causes carried into their consequences',
  },
  'consequence-world': {
    physical: true,
    motion: 'pull-back-to-system-consequence',
    fallback: 'world-consequence-stage',
    goal: 'a wide real-world consequence scene showing why the mechanism matters',
  },
};

// Only classify from the actual spoken claim and explicitly required visuals.
// Generic planning helpers such as "topic evidence" must never select a scene family.
const localText = (scene) => lower([
  scene.title,
  scene.voiceLine,
  scene.sceneGoal,
  scene.heroVisual,
  ...(scene.mustShow || []),
].join(' '));

const classify = (scene, index, total) => {
  const text = localText(scene);
  if (index === total - 1) return 'consequence-world';

  if (/\b(market|bazaar|exchange|handoff|goods? changed hands?|bought|sold|stalls?|cargo transfer)\b/.test(text)) return 'market-exchange';
  if (/\b(caravans?|camels?|merchants?|merchant journey|travell?ers?|pilgrims?|workers?|engineers?|scientists?|soldiers?|operators?|scholars?)\b/.test(text)) return 'human-reconstruction';
  if (/\b(ships?|merchant vessels?|ports?|harbou?rs?|docks?|sea routes?|maritime|aircraft)\b/.test(text)) return 'human-reconstruction';
  if (/\b(wars?|blocked|blockage|blockade|danger|threat|attack|damage|repair|protect\w*|failure|break one link|tax\w*|empires?|fortified checkpoint|fought over|disruption|harder to treat)\b/.test(text)) return 'hazard-operation';
  if (/\b(paper|manuscripts?|documents?|records?|archives?|reports?|decrees?|photographs?|religions?|stories|knowledge)\b/.test(text)) return 'archival-evidence';

  const hasTerrain = /\b(mountains?|deserts?|terrain|water sources?|oasis landscape|forests?|ocean floor|habitats?|environmental constraints?)\b/.test(text);
  const hasGeographicFlow = /\b(routes?|roads?|corridors?|lanes?)\b.*\b(link|links|linked|linking|connect|connects|connected|connecting|from|between)\b|\b(link|links|linked|linking|connect|connects|connected|connecting)\b.*\b(east|west|asia|europe|continents?|countries|regions?|cities)\b|\bfrom\b.+\bto\b/.test(text);
  if (hasTerrain && !hasGeographicFlow) return 'environmental-reconstruction';

  if (/\b(factories|factory|fabs?|manufactur\w*|produc\w*|machines?|plants?|clean rooms?|assembly|lithography equipment)\b/.test(text)) return 'industrial-process';
  if (/\b(lithograph\w*|circuit patterns?|transistors?|nanometers?|wafer layers?|inside|layers?|cores?|cutaway|components?|mechanisms?|signals?|fibers?|chips?|wafers?|membranes?|receptors?|gene transfer|genes?\s+(?:can\s+also\s+)?move|dna exchange)\b/.test(text)) return 'mechanism-cutaway';
  if (/\b(bacter\w*|cells?|viruses?|microb\w*|mutat\w*|genes?|immune\w*|microscop\w*|colon\w*|selection pressure|resistance traits?)\b/.test(text)) return 'microscopic-process';

  if (hasGeographicFlow || /\b(across continents?|trade routes?|shipping lanes?|land routes?|origin|destination|intermediary hubs?|border crossings?)\b/.test(text)) return 'geographic-route';
  if (/\b(spread between|spreads? between|propagat\w*|global.*depend|depend\w*.*global|supply chains?|distributed networks?|connect\w* nodes|bottlenecks?|flow through the system|larger share of the colony)\b/.test(text)) return 'network-flow';
  if (/\b(compare|versus|before|after|more than|less than|difference|two sides|alternative production|alternative capacity)\b/.test(text)) return 'comparison-stage';
  if (/\b(first|then|later|eventually|centuries?|years?|timeline|led to|caused|generation after generation)\b/.test(text)) return 'timeline-causality';

  return index === 0 ? 'environmental-reconstruction' : [
    'human-reconstruction',
    'environmental-reconstruction',
    'archival-evidence',
  ][index % 3];
};

const applyFamily = (scene, blueprint, family, source) => {
  const meta = FAMILY_META[family];
  const subject = clean(scene.heroVisual || scene.title || scene.voiceLine || plan.topic || 'main subject');
  const mustShow = unique([
    subject,
    ...(scene.mustShow || []),
    ...(blueprint.worldEntities || []),
  ]).slice(0, 8);
  const environment = clean(
    scene.visualContract?.visualDirection?.environment
    || blueprint.layerPlan?.background?.[0]
    || `${plan.category || 'documentary'}-specific real environment`,
  );
  const prompt = [
    'Vertical 9:16 editorial documentary illustration.',
    `Topic: ${clean(plan.topic)}.`,
    `Scene claim: ${clean(scene.voiceLine)}.`,
    `Scene family: ${family}.`,
    `Show: ${mustShow.join(', ')}.`,
    `Build ${meta.goal}.`,
    `Environment: ${environment}.`,
    'Clear foreground, midground and background with believable scale.',
    'No generic infographic cards, no decorative geometry, no readable text, no logos.',
  ].join(' ');

  return {
    ...blueprint,
    sceneId: Number(scene.id),
    sceneFamily: family,
    familyDecisionSource: source,
    visualStatement: `Make the narration visible by showing ${subject} as ${meta.goal}.`,
    worldEntities: mustShow,
    spatialRelations: [
      `foreground: dominant ${subject} and the physical action required by the claim`,
      `midground: ${meta.goal}`,
      `background: ${environment} with topic-specific scale and context`,
    ],
    layerPlan: {
      foreground: [subject, mustShow[1] || 'claim-specific physical prop'],
      midground: [mustShow[2] || 'visible cause-and-effect action', meta.goal],
      background: [environment, 'atmospheric depth and geographic context'],
    },
    motionIntent: {
      ...(blueprint.motionIntent || {}),
      grammar: meta.motion,
      heroAction: 'move only in the direction and manner implied by the spoken claim',
    },
    assetPlan: {
      ...(blueprint.assetPlan || {}),
      aiImageRecommended: meta.physical,
      aiImagePriority: meta.physical ? 3 : 1,
      fallbackRenderer: meta.fallback,
      prompt,
      searchQueries: unique([
        `${clean(plan.topic)} ${subject}`,
        `${subject} ${environment}`,
        `${clean(scene.voiceLine)} documentary reference`,
        ...((blueprint.assetPlan || {}).searchQueries || []),
      ]).slice(0, 6),
    },
  };
};

const scenes = plan.scenes || [];
for (const [index, scene] of scenes.entries()) {
  const blueprint = scene.v9Blueprint || {};
  const family = classify(scene, index, scenes.length);
  scene.v9Blueprint = applyFamily(
    scene,
    blueprint,
    family,
    index === scenes.length - 1
      ? 'mandatory-ending-consequence'
      : 'final-spoken-claim-repair',
  );
}

let mapCount = 0;
for (let index = 0; index < scenes.length - 1; index += 1) {
  const blueprint = scenes[index].v9Blueprint;
  if (blueprint.sceneFamily === 'geographic-route') {
    mapCount += 1;
    if (mapCount > 2) {
      const replacement = /mountain|desert|terrain|water|oasis/.test(localText(scenes[index]))
        ? 'environmental-reconstruction'
        : 'human-reconstruction';
      scenes[index].v9Blueprint = applyFamily(
        scenes[index],
        blueprint,
        replacement,
        'final-map-budget-repair',
      );
    }
  }
}

for (let index = 2; index < scenes.length - 1; index += 1) {
  const current = scenes[index].v9Blueprint;
  const previous = scenes[index - 1].v9Blueprint;
  const before = scenes[index - 2].v9Blueprint;
  if (current.sceneFamily === previous.sceneFamily && current.sceneFamily === before.sceneFamily) {
    const replacement = /mountain|desert|terrain|water|environment/.test(localText(scenes[index]))
      ? 'environmental-reconstruction'
      : 'human-reconstruction';
    scenes[index].v9Blueprint = applyFamily(
      scenes[index],
      current,
      replacement,
      'final-family-spam-repair',
    );
  }
}

const finalFamilies = scenes.map((scene) => scene.v9Blueprint.sceneFamily);
const physicalFamilies = new Set(Object.entries(FAMILY_META).filter(([, value]) => value.physical).map(([family]) => family));
const representationalCount = finalFamilies.filter((family) => physicalFamilies.has(family)).length;
plan.v9 = {
  ...(plan.v9 || {}),
  sceneFamilies: finalFamilies,
  familyCount: new Set(finalFamilies).size,
  mapSceneCount: finalFamilies.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number((representationalCount / Math.max(1, finalFamilies.length)).toFixed(3)),
  semanticFamilyRepair: 'final-spoken-claim-v3',
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 semantic family repair ready: ${finalFamilies.join(' -> ')}`);
