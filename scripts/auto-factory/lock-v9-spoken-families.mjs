import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';
import {classifyV9Scene} from './v9-semantic-classifier.mjs';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const unique = (values) => [...new Set((values || []).map(clean).filter(Boolean))];

const META = {
  'geographic-route': {physical: false, grammar: 'route-trace-with-camera-follow', fallback: 'layered-route-map', goal: 'a directional route with origin, destination, intermediary hubs, terrain and moving flow'},
  'human-reconstruction': {physical: true, grammar: 'parallax-push-with-action-reveal', fallback: 'layered-human-silhouette-scene', goal: 'people or vehicles physically performing the narrated action in a believable place and scale'},
  'environmental-reconstruction': {physical: true, grammar: 'depth-parallax-establishing', fallback: 'layered-environment-stage', goal: 'terrain, climate, water and physical scale visibly controlling the action'},
  'industrial-process': {physical: true, grammar: 'machine-follow-and-process-build', fallback: 'industrial-layer-stage', goal: 'real machinery, production stages, material flow and operator relationships'},
  'mechanism-cutaway': {physical: true, grammar: 'shell-open-and-signal-flow', fallback: 'semantic-cutaway', goal: 'an object-preserving cutaway with layers, input, transformation and output'},
  'microscopic-process': {physical: true, grammar: 'macro-drift-and-cause-effect', fallback: 'organic-macro-stage', goal: 'biological actors at coherent microscopic scale showing cause, survival or replication'},
  'market-exchange': {physical: true, grammar: 'object-match-cut-through-handoffs', fallback: 'layered-exchange-stage', goal: 'people, goods, stalls and a visible physical handoff'},
  'network-flow': {physical: false, grammar: 'node-activation-and-flow-carry', fallback: 'semantic-network-stage', goal: 'specific hubs, direction, propagation and bottlenecks rather than decorative lines'},
  'archival-evidence': {physical: true, grammar: 'evidence-pullout-and-highlight', fallback: 'archive-desk-stage', goal: 'specific documents, manuscripts, records or knowledge objects arranged as evidence'},
  'hazard-operation': {physical: true, grammar: 'threat-approach-impact-and-response', fallback: 'hazard-operation-stage', goal: 'the physical threat, affected subject, impact and response in one spatial world'},
  'comparison-stage': {physical: false, grammar: 'matched-split-and-difference-reveal', fallback: 'semantic-comparison-stage', goal: 'two concrete states compared at matched scale and camera position'},
  'timeline-causality': {physical: false, grammar: 'event-trace-and-causal-carry', fallback: 'causal-timeline-stage', goal: 'ordered events with visible causes carried into consequences'},
  'consequence-world': {physical: true, grammar: 'pull-back-to-system-consequence', fallback: 'world-consequence-stage', goal: 'a wide real-world consequence showing why the mechanism matters'},
};

const apply = (scene, decision) => {
  const current = scene.v9Blueprint || {};
  const meta = META[decision.family];
  const subject = clean(scene.heroVisual || scene.title || scene.voiceLine || plan.topic || 'main subject');
  const worldEntities = unique([subject, ...(scene.mustShow || []), ...(current.worldEntities || [])]).slice(0, 10);
  const environment = clean(
    scene.visualContract?.visualDirection?.environment
      || current.layerPlan?.background?.[0]
      || `${plan.category || 'documentary'}-specific real environment`,
  );

  scene.v9Blueprint = {
    ...current,
    sceneId: Number(scene.id),
    sceneFamily: decision.family,
    sceneArchetype: decision.archetype,
    familyDecisionSource: `semantic-classifier:${decision.reason}`,
    visualStatement: `Make the spoken claim visible as ${meta.goal}; stage it as ${decision.archetype}.`,
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
      prompt: [
        'Vertical 9:16 editorial documentary illustration.',
        `Topic: ${clean(plan.topic)}.`,
        `Scene claim: ${clean(scene.voiceLine)}.`,
        `Locked scene family: ${decision.family}.`,
        `Locked scene archetype: ${decision.archetype}.`,
        `Show: ${worldEntities.join(', ')}.`,
        `Build ${meta.goal}.`,
        `Environment: ${environment}.`,
        'Clear foreground, midground and background with believable scale.',
        'Avoid dashboard layouts and abstract decorative marks. No readable text, logos or watermarks.',
      ].join(' '),
      searchQueries: unique([
        `${clean(plan.topic)} ${decision.archetype}`,
        `${subject} ${environment}`,
        `${clean(scene.voiceLine)} documentary reference`,
        ...((current.assetPlan || {}).searchQueries || []),
      ]).slice(0, 6),
    },
  };
};

const scenes = plan.scenes || [];
for (const [index, scene] of scenes.entries()) {
  apply(scene, classifyV9Scene({scene, index, total: scenes.length}));
}

const families = scenes.map((scene) => scene.v9Blueprint.sceneFamily);
const archetypes = scenes.map((scene) => scene.v9Blueprint.sceneArchetype);
const physicalFamilies = new Set(Object.entries(META).filter(([, value]) => value.physical).map(([family]) => family));
const representationalCount = families.filter((family) => physicalFamilies.has(family)).length;
plan.v9 = {
  ...(plan.v9 || {}),
  sceneFamilies: families,
  sceneArchetypes: archetypes,
  familyCount: new Set(families).size,
  archetypeCount: new Set(archetypes).size,
  mapSceneCount: families.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number((representationalCount / Math.max(1, families.length)).toFixed(3)),
  spokenFamilyLock: 'semantic-classifier-v1',
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 semantic lock ready: ${archetypes.join(' -> ')}`);
