import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];

const META = {
  'geographic-route': {physical: false, grammar: 'route-trace-with-camera-follow', fallback: 'layered-route-map', goal: 'a directional geographic route with origin, destination, intermediary hubs, terrain and moving flow'},
  'human-reconstruction': {physical: true, grammar: 'parallax-push-with-action-reveal', fallback: 'layered-human-silhouette-scene', goal: 'people physically performing the narrated action in a believable place, period and scale'},
  'environmental-reconstruction': {physical: true, grammar: 'depth-parallax-establishing', fallback: 'layered-environment-stage', goal: 'terrain, climate, water and physical scale visibly controlling the action'},
  'industrial-process': {physical: true, grammar: 'machine-follow-and-process-build', fallback: 'industrial-layer-stage', goal: 'real machinery, production stages, material flow and operator relationships'},
  'mechanism-cutaway': {physical: true, grammar: 'shell-open-and-signal-flow', fallback: 'semantic-cutaway', goal: 'an object-preserving cutaway with layers, input, transformation and output'},
  'microscopic-process': {physical: true, grammar: 'macro-drift-and-cause-effect', fallback: 'organic-macro-stage', goal: 'biological actors at coherent microscopic scale showing cause, survival, transfer or replication'},
  'market-exchange': {physical: true, grammar: 'object-match-cut-through-handoffs', fallback: 'layered-exchange-stage', goal: 'people, goods, stalls and a visible physical handoff'},
  'network-flow': {physical: false, grammar: 'node-activation-and-flow-carry', fallback: 'semantic-network-stage', goal: 'specific hubs, direction, propagation and bottlenecks rather than decorative lines'},
  'archival-evidence': {physical: true, grammar: 'evidence-pullout-and-highlight', fallback: 'archive-desk-stage', goal: 'specific documents, manuscripts, records or knowledge objects arranged as evidence'},
  'hazard-operation': {physical: true, grammar: 'threat-approach-impact-and-response', fallback: 'hazard-operation-stage', goal: 'the physical threat, affected subject, impact and response in one spatial world'},
  'comparison-stage': {physical: false, grammar: 'matched-split-and-difference-reveal', fallback: 'semantic-comparison-stage', goal: 'two concrete states compared at matched scale and camera position'},
  'timeline-causality': {physical: false, grammar: 'event-trace-and-causal-carry', fallback: 'causal-timeline-stage', goal: 'ordered events with visible causes carried into consequences'},
  'consequence-world': {physical: true, grammar: 'pull-back-to-system-consequence', fallback: 'world-consequence-stage', goal: 'a wide real-world consequence showing why the mechanism matters'},
};

const spoken = (scene) => lower([scene.title, scene.voiceLine, scene.sceneGoal].join(' '));
const required = (scene) => lower([scene.heroVisual, ...(scene.mustShow || [])].join(' '));

const classify = (scene, index, total) => {
  const speech = spoken(scene);
  const visual = required(scene);
  const text = `${speech} ${visual}`;
  if (index === total - 1) return 'consequence-world';

  // The spoken action wins. Supporting props may enrich, but must not hijack the family.
  if (/\b(paper|manuscripts?|documents?|records?|archives?|reports?|decrees?|photographs?|religions?|stories|knowledge|ideas?|scientific knowledge)\b/.test(speech)) return 'archival-evidence';
  if (/\b(mountains?|deserts?|terrain|water sources?|oases?|oasis|passes?|forests?|ocean floor|habitats?|environmental constraints?)\b/.test(speech)
      && !/\b(routes?|roads?|corridors?|lanes?)\b.*\b(link|connect|from|between)\b/.test(speech)) return 'environmental-reconstruction';
  if (/\b(wars?|blocked|blockage|blockade|danger|threat|attack|damage|repair|protect\w*|failure|break one link|tax\w*|empires?|fought|disruption|harder to treat)\b/.test(speech)) return 'hazard-operation';
  if (/\b(market|bazaar|exchange|handoff|goods? changed hands?|bought|sold|stalls?|cargo transfer)\b/.test(speech)) return 'market-exchange';

  if (/\b(lithography machines?.*(?:circuit|pattern)|microscopic circuit patterns?|circuit patterns?|transistors?|nanometers?|wafer layers?)\b/.test(speech)) return 'mechanism-cutaway';
  if (/\b(factories|factory|fabs?|manufactur\w*|produc\w*|machines?|plants?|clean rooms?|assembly|lithography equipment)\b/.test(speech)) return 'industrial-process';
  if (/\b(inside|layers?|cores?|cutaway|components?|mechanisms?|signals?|fibers?|membranes?|receptors?|gene transfer|genes?\s+(?:can\s+also\s+)?move|dna exchange)\b/.test(speech)) return 'mechanism-cutaway';
  if (/\b(bacter\w*|cells?|viruses?|microb\w*|mutat\w*|genes?|immune\w*|microscop\w*|colon\w*|selection pressure|resistance traits?)\b/.test(speech)) return 'microscopic-process';

  const geographic = /\b(routes?|roads?|corridors?|lanes?)\b.*\b(link|links|linked|linking|connect|connects|connected|connecting|from|between)\b|\b(link|links|linked|linking|connect|connects|connected|connecting)\b.*\b(east|west|asia|europe|continents?|countries|regions?|cities)\b|\bfrom\b.+\bto\b|\bacross continents?\b/.test(speech);
  if (geographic) return 'geographic-route';
  if (/\b(spread between|spreads? between|propagat\w*|global.*depend|depend\w*.*global|supply chains?|distributed networks?|bottlenecks?|flow through the system|larger share of the colony)\b/.test(speech)) return 'network-flow';
  if (/\b(compare|versus|before|after|more than|less than|difference|two sides|alternative production|alternative capacity)\b/.test(speech)) return 'comparison-stage';
  if (/\b(first|then|later|eventually|centuries?|years?|timeline|led to|caused|generation after generation)\b/.test(speech)) return 'timeline-causality';

  if (/\b(ships?|merchant vessels?|ports?|harbou?rs?|docks?|sea routes?|maritime|aircraft)\b/.test(text)) return 'human-reconstruction';
  if (/\b(caravans?|camels?|merchants?|travell?ers?|pilgrims?|workers?|engineers?|scientists?|soldiers?|operators?|scholars?|city gate|relay hub)\b/.test(text)) return 'human-reconstruction';

  return index === 0 ? 'environmental-reconstruction' : ['human-reconstruction', 'environmental-reconstruction', 'archival-evidence'][index % 3];
};

const apply = (scene, family, source) => {
  const current = scene.v9Blueprint || {};
  const meta = META[family];
  const subject = clean(scene.heroVisual || scene.title || scene.voiceLine || plan.topic || 'main subject');
  const worldEntities = unique([subject, ...(scene.mustShow || []), ...(current.worldEntities || [])]).slice(0, 8);
  const environment = clean(
    scene.visualContract?.visualDirection?.environment
      || current.layerPlan?.background?.[0]
      || `${plan.category || 'documentary'}-specific real environment`,
  );
  const prompt = [
    'Vertical 9:16 editorial documentary illustration.',
    `Topic: ${clean(plan.topic)}.`,
    `Scene claim: ${clean(scene.voiceLine)}.`,
    `Locked scene family: ${family}.`,
    `Show: ${worldEntities.join(', ')}.`,
    `Build ${meta.goal}.`,
    `Environment: ${environment}.`,
    'Clear foreground, midground and background with believable scale.',
    'No generic infographic cards, no decorative geometry, no readable text, no logos.',
  ].join(' ');

  scene.v9Blueprint = {
    ...current,
    sceneId: Number(scene.id),
    sceneFamily: family,
    familyDecisionSource: source,
    visualStatement: `Make the spoken claim visible as ${meta.goal}.`,
    worldEntities,
    spatialRelations: [
      `foreground: ${subject} and the physical action required by the spoken claim`,
      `midground: ${meta.goal}`,
      `background: ${environment} with topic-specific scale and context`,
    ],
    layerPlan: {
      foreground: [subject, worldEntities[1] || 'claim-specific physical prop'],
      midground: [worldEntities[2] || 'visible cause-and-effect action', meta.goal],
      background: [environment, 'atmospheric depth and geographic context'],
    },
    motionIntent: {
      ...(current.motionIntent || {}),
      grammar: meta.grammar,
      heroAction: 'move only in the direction and manner implied by the spoken claim',
    },
    assetPlan: {
      ...(current.assetPlan || {}),
      aiImageRecommended: meta.physical,
      aiImagePriority: meta.physical ? 3 : 1,
      fallbackRenderer: meta.fallback,
      prompt,
      searchQueries: unique([
        `${clean(plan.topic)} ${subject}`,
        `${subject} ${environment}`,
        `${clean(scene.voiceLine)} documentary reference`,
        ...((current.assetPlan || {}).searchQueries || []),
      ]).slice(0, 6),
    },
  };
};

const scenes = plan.scenes || [];
for (const [index, scene] of scenes.entries()) {
  apply(scene, classify(scene, index, scenes.length), index === scenes.length - 1 ? 'mandatory-ending-consequence' : 'spoken-claim-finalizer');
}

let mapCount = 0;
for (let index = 0; index < scenes.length - 1; index += 1) {
  const scene = scenes[index];
  if (scene.v9Blueprint.sceneFamily === 'geographic-route') {
    mapCount += 1;
    if (mapCount > 2) {
      const replacement = /mountain|desert|terrain|water|oasis/.test(spoken(scene)) ? 'environmental-reconstruction' : 'human-reconstruction';
      apply(scene, replacement, 'final-map-budget-repair');
    }
  }
}

for (let index = 2; index < scenes.length - 1; index += 1) {
  const family = scenes[index].v9Blueprint.sceneFamily;
  if (family === scenes[index - 1].v9Blueprint.sceneFamily && family === scenes[index - 2].v9Blueprint.sceneFamily) {
    const replacement = /mountain|desert|terrain|water|environment/.test(spoken(scenes[index])) ? 'environmental-reconstruction' : 'human-reconstruction';
    apply(scenes[index], replacement, 'final-family-spam-repair');
  }
}

const families = scenes.map((scene) => scene.v9Blueprint.sceneFamily);
const physical = new Set(Object.entries(META).filter(([, value]) => value.physical).map(([family]) => family));
const representationalCount = families.filter((family) => physical.has(family)).length;
plan.v9 = {
  ...(plan.v9 || {}),
  sceneFamilies: families,
  familyCount: new Set(families).size,
  mapSceneCount: families.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number((representationalCount / Math.max(1, families.length)).toFixed(3)),
  semanticContractFinalizer: 'spoken-claim-priority-v1',
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 semantic contracts finalized: ${families.join(' -> ')}`);
