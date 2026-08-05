import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';
import {generateStructuredJson, providerAvailability} from './v9-ai-provider-router.mjs';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));

const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];

const DOMAIN_RULES = [
  ['history', /\b(history|historical|ancient|empire|dynasty|roman|silk road|war|revolution|medieval|ottoman|archaeolog)\b/i],
  ['science', /\b(science|cell|bacteria|virus|dna|gene|antibiotic|immune|physics|chemistry|disease|medicine)\b/i],
  ['technology', /\b(technology|internet|chip|semiconductor|computer|software|cable|fiber|network|satellite|robot|server|battery)\b/i],
  ['nature', /\b(nature|animal|forest|ocean|ecosystem|species|insect|plant|wildlife|volcano|climate)\b/i],
  ['geopolitics', /\b(geopolit|country|border|treaty|sanction|territory|taiwan|nato|strait|trade route)\b/i],
  ['economy', /\b(economy|market|currency|inflation|finance|price|stock|bank|supply chain|production|factory)\b/i],
  ['mystery', /\b(mystery|crime|disappear|investigation|evidence|case|forensic|voynich|cicada)\b/i],
  ['space', /\b(space|planet|star|galaxy|black hole|universe|orbit|moon|asteroid)\b/i],
];

const SCENE_FAMILIES = {
  'geographic-route': {physical: false, goal: 'Show named origins, destinations, intermediary nodes, terrain and directional flow in one readable geographic system.', motion: 'route-trace-with-camera-follow', fallback: 'layered-route-map'},
  'human-reconstruction': {physical: true, goal: 'Stage people performing the action in a believable place, period and scale.', motion: 'parallax-push-with-action-reveal', fallback: 'layered-human-silhouette-scene'},
  'environmental-reconstruction': {physical: true, goal: 'Build a foreground, midground and background environment that makes the subject physically understandable.', motion: 'depth-parallax-establishing', fallback: 'layered-environment-stage'},
  'industrial-process': {physical: true, goal: 'Show the real production floor, machinery, material flow and operator relationship.', motion: 'machine-follow-and-process-build', fallback: 'industrial-layer-stage'},
  'mechanism-cutaway': {physical: true, goal: 'Reveal internal layers, inputs, transformation and output while preserving the object silhouette.', motion: 'shell-open-and-signal-flow', fallback: 'semantic-cutaway'},
  'microscopic-process': {physical: true, goal: 'Show biological actors, scale, cause, survival or replication inside a coherent microscopic world.', motion: 'macro-drift-and-cause-effect', fallback: 'organic-macro-stage'},
  'market-exchange': {physical: true, goal: 'Show people, goods, locations and the handoff that makes exchange concrete.', motion: 'object-match-cut-through-handoffs', fallback: 'layered-exchange-stage'},
  'network-flow': {physical: false, goal: 'Show nodes, direction, bottlenecks and propagation without reducing the scene to decorative lines.', motion: 'node-activation-and-flow-carry', fallback: 'semantic-network-stage'},
  'archival-evidence': {physical: true, goal: 'Present a specific document, object, photograph or record with readable evidence hierarchy.', motion: 'evidence-pullout-and-highlight', fallback: 'archive-desk-stage'},
  'hazard-operation': {physical: true, goal: 'Show the physical threat, affected subject and protective or repair action in the same spatial world.', motion: 'threat-approach-impact-and-response', fallback: 'hazard-operation-stage'},
  'comparison-stage': {physical: false, goal: 'Compare two concrete states using matched scale, camera and labels.', motion: 'matched-split-and-difference-reveal', fallback: 'semantic-comparison-stage'},
  'timeline-causality': {physical: false, goal: 'Show ordered causes and consequences as distinct events, not generic cards.', motion: 'event-trace-and-causal-carry', fallback: 'causal-timeline-stage'},
  'consequence-world': {physical: true, goal: 'End on a wide consequence scene that shows why the mechanism matters in the real world.', motion: 'pull-back-to-system-consequence', fallback: 'world-consequence-stage'},
};

const topicText = lower(`${plan.topic} ${plan.title} ${plan.category} ${plan.narration}`);
const domain = DOMAIN_RULES.find(([, pattern]) => pattern.test(topicText))?.[0] || lower(plan.category) || 'technology';

const sceneFamilyFor = (scene, index, total) => {
  const text = lower(`${scene.title} ${scene.voiceLine} ${scene.sceneGoal} ${(scene.mustShow || []).join(' ')}`);
  if (index === total - 1) return 'consequence-world';
  if (/\b(route|from .+ to|corridor|journey|trade road|shipping lane|border|continent|desert|mountain pass|oasis)\b/.test(text)) return 'geographic-route';
  if (/\b(lithograph\w*|circuit pattern\w*|transistor\w*|nanometer\w*|wafer layer\w*)\b/.test(text)) return 'mechanism-cutaway';
  if (/\b(factory|fab|manufactur\w*|produc\w*|machine\w*|plant|clean room|assembly)\b/.test(text)) return 'industrial-process';
  if (/\b(inside|layer|core|cutaway|component|mechanism|signal|fiber|chip|wafer|membrane|receptor|gene transfer|genes move|genes can also move|dna exchange)\b/.test(text)) return 'mechanism-cutaway';
  if (/\b(bacter\w*|cell\w*|virus\w*|microb\w*|mutat\w*|gene\w*|immune\w*|microscop\w*|colon\w*)\b/.test(text)) return 'microscopic-process';
  if (/\b(network\w*|spread\w*|propagat\w*|depend\w*|supply chain|connect\w*|flow\w*|distribut\w*)\b/.test(text)) return 'network-flow';
  if (/\b(people|worker\w*|merchant\w*|scientist\w*|soldier\w*|leader\w*|operator\w*|engineer\w*|traveler\w*|caravan\w*)\b/.test(text)) return 'human-reconstruction';
  if (/\b(trade|merchant|market|exchange|goods|cargo|handoff|sold|bought)\b/.test(text)) return 'market-exchange';
  if (/\b(document|record|archive|evidence|report|decree|manuscript|photograph|paper|religion|story|knowledge)\b/.test(text)) return 'archival-evidence';
  if (/\b(risk|threat|attack|damage|repair|protect|failure|danger|war|blockade|break|blocked)\b/.test(text)) return 'hazard-operation';
  if (/\b(compare|versus|before|after|more than|less than|difference|two sides)\b/.test(text)) return 'comparison-stage';
  if (/\b(first|then|later|eventually|century|year|timeline|led to|caused)\b/.test(text)) return 'timeline-causality';
  return index === 0 ? 'environmental-reconstruction' : ['human-reconstruction', 'environmental-reconstruction', 'archival-evidence'][index % 3];
};

const visibleEntities = (scene) => unique([
  scene.title,
  scene.heroVisual,
  scene.primaryMotif,
  scene.secondaryMotif,
  ...(scene.mustShow || []),
  ...(scene.supportVisuals || []),
  ...((scene.visualContract?.motifs || []).map((item) => item?.label)),
]).slice(0, 12);

const deterministicBlueprint = (scene, index, total) => {
  const sceneFamily = sceneFamilyFor(scene, index, total);
  const family = SCENE_FAMILIES[sceneFamily];
  const entities = visibleEntities(scene);
  const subject = clean(scene.visualContract?.visualDirection?.subject || scene.visualContract?.subject || scene.heroVisual || scene.title);
  const environment = clean(scene.visualContract?.visualDirection?.environment || `${domain}-specific real environment`);
  const mustShow = unique([subject, ...entities, family.physical ? 'believable physical scale' : 'clear spatial relationship']).slice(0, 8);

  return {
    sceneId: Number(scene.id ?? index + 1),
    sceneFamily,
    visualStatement: `Make the narration visible by showing ${subject} through ${family.goal.toLowerCase()}`,
    worldEntities: mustShow,
    spatialRelations: [
      `foreground: dominant ${subject}`,
      `midground: action or transfer described by "${clean(scene.voiceLine)}"`,
      `background: ${environment} with topic-specific scale and geography`,
    ],
    layerPlan: {
      foreground: [subject, mustShow[1] || 'topic-specific physical prop'],
      midground: [mustShow[2] || 'cause-and-effect action', 'directional relationship'],
      background: [environment, 'atmospheric depth and geographic context'],
    },
    motionIntent: {
      camera: clean(scene.motionContract?.cameraMove || 'controlled-push-in'),
      grammar: family.motion,
      heroAction: 'move only in the direction implied by the narration',
      transitionLogic: 'carry one meaningful object, route, signal or texture into the next scene',
    },
    assetPlan: {
      aiImageRecommended: family.physical,
      aiImagePriority: family.physical ? (index === 0 ? 5 : 3) : 1,
      prompt: ['Vertical 9:16 editorial documentary illustration.', `Topic: ${clean(plan.topic)}.`, `Scene claim: ${clean(scene.voiceLine)}.`, `Show: ${mustShow.join(', ')}.`, `Environment: ${environment}.`, 'Clear foreground, midground and background. Historically or scientifically believable scale.', 'No generic infographic cards, no decorative geometry, no readable text, no logos.'].join(' '),
      fallbackRenderer: family.fallback,
      searchQueries: unique([`${clean(plan.topic)} ${subject}`, `${subject} ${environment}`, `${clean(scene.voiceLine)} documentary reference`]),
    },
    negativeRules: [
      'Do not represent the whole claim with one icon.',
      'Do not use a map unless origin, destination, intermediary nodes and direction are visible.',
      'Do not repeat the previous scene composition.',
      'Do not use floating circles, cards or lines as the hero subject.',
      'Do not invent named facts that are absent from the narration or research.',
    ],
    semanticSpecificityScore: Math.min(1, 0.42 + mustShow.length * 0.07),
  };
};

const baseBlueprints = (plan.scenes || []).map(deterministicBlueprint);
const isBlueprint = (value) => value && Number.isFinite(Number(value.sceneId)) && SCENE_FAMILIES[value.sceneFamily] && clean(value.visualStatement) && Array.isArray(value.worldEntities) && value.worldEntities.length >= 2 && Array.isArray(value.spatialRelations) && value.spatialRelations.length >= 3 && clean(value?.assetPlan?.prompt);
const validateAiPlan = (value) => value && Array.isArray(value.scenes) && value.scenes.length === baseBlueprints.length && value.scenes.every(isBlueprint);

const aiPrompt = JSON.stringify({
  task: 'Refine a semantic visual blueprint for an automated 9:16 documentary short.',
  topic: plan.topic,
  category: plan.category,
  language: plan.language,
  rules: {
    useOnlyNarrationAndResearch: true,
    physicalSceneRatioMinimum: 0.5,
    maximumMapScenes: 2,
    routeSceneRequirement: 'Every route scene must identify origin, destination, intermediary nodes, terrain and direction.',
    sceneVariety: 'Use at least four scene families and never repeat the same family more than twice consecutively.',
    representationalPriority: 'Prefer people, places, objects, environments, machinery and physical actions over icons or geometric abstractions.',
    output: 'Return JSON only with {"scenes": [...]} and preserve every sceneId.',
  },
  research: (plan.research || []).slice(0, 8).map((item) => ({title: clean(item.title), excerpt: clean(item.excerpt || item.snippet).slice(0, 500)})),
  scenes: (plan.scenes || []).map((scene, index) => ({sceneId: scene.id, narration: clean(scene.voiceLine), mustShow: scene.mustShow || [], currentVisualDirection: scene.visualContract?.visualDirection || {}, deterministicDraft: baseBlueprints[index]})),
}, null, 2);

const ai = await generateStructuredJson({
  prompt: aiPrompt,
  systemInstruction: ['You are NeoSaniye V9 Semantic Visual Brain.', 'Think like an editorial documentary illustrator and motion designer, not a dashboard designer.', 'Translate each spoken claim into a concrete spatial scene.', 'Output JSON only. Never add facts, names or locations not supported by the input.'].join(' '),
  validate: validateAiPlan,
});

const aiById = new Map((ai.value?.scenes || []).map((scene) => [Number(scene.sceneId), scene]));
const mergedBlueprints = baseBlueprints.map((fallback) => {
  const candidate = aiById.get(Number(fallback.sceneId));
  if (!candidate || !isBlueprint(candidate)) return fallback;
  return {
    ...fallback,
    ...candidate,
    sceneId: fallback.sceneId,
    negativeRules: unique([...(fallback.negativeRules || []), ...(candidate.negativeRules || [])]).slice(0, 10),
    assetPlan: {...fallback.assetPlan, ...(candidate.assetPlan || {}), searchQueries: unique([...(fallback.assetPlan.searchQueries || []), ...((candidate.assetPlan || {}).searchQueries || [])]).slice(0, 6)},
  };
});

const DOMAIN_ALTERNATES = {
  history: ['human-reconstruction', 'environmental-reconstruction', 'market-exchange', 'archival-evidence'],
  science: ['microscopic-process', 'mechanism-cutaway', 'human-reconstruction', 'environmental-reconstruction'],
  technology: ['industrial-process', 'mechanism-cutaway', 'human-reconstruction', 'environmental-reconstruction'],
  nature: ['environmental-reconstruction', 'human-reconstruction', 'microscopic-process', 'hazard-operation'],
  geopolitics: ['environmental-reconstruction', 'human-reconstruction', 'industrial-process', 'archival-evidence'],
  economy: ['industrial-process', 'market-exchange', 'human-reconstruction', 'environmental-reconstruction'],
  mystery: ['archival-evidence', 'human-reconstruction', 'hazard-operation', 'environmental-reconstruction'],
  space: ['environmental-reconstruction', 'mechanism-cutaway', 'comparison-stage', 'consequence-world'],
};

const alternates = DOMAIN_ALTERNATES[domain] || DOMAIN_ALTERNATES.technology;
let mapCount = 0;
for (let index = 0; index < mergedBlueprints.length; index += 1) {
  const blueprint = mergedBlueprints[index];
  if (blueprint.sceneFamily === 'geographic-route') {
    mapCount += 1;
    if (mapCount > 2) blueprint.sceneFamily = alternates[index % alternates.length];
  }
  if (index >= 2 && blueprint.sceneFamily === mergedBlueprints[index - 1].sceneFamily && blueprint.sceneFamily === mergedBlueprints[index - 2].sceneFamily) {
    blueprint.sceneFamily = alternates.find((family) => family !== blueprint.sceneFamily) || alternates[0];
  }
}

const physicalFamilies = new Set(Object.entries(SCENE_FAMILIES).filter(([, value]) => value.physical).map(([key]) => key));
const physicalCount = mergedBlueprints.filter((item) => physicalFamilies.has(item.sceneFamily)).length;
const minimumPhysical = Math.ceil(mergedBlueprints.length * 0.5);
for (let index = 0; physicalCount < minimumPhysical && index < mergedBlueprints.length; index += 1) {
  if (!physicalFamilies.has(mergedBlueprints[index].sceneFamily) && mergedBlueprints[index].sceneFamily !== 'geographic-route') mergedBlueprints[index].sceneFamily = alternates[index % alternates.length];
}

for (const [index, scene] of (plan.scenes || []).entries()) scene.v9Blueprint = mergedBlueprints[index];
const families = mergedBlueprints.map((item) => item.sceneFamily);
const familyCount = new Set(families).size;
const representationalCount = families.filter((family) => physicalFamilies.has(family)).length;
const representationalRatio = mergedBlueprints.length ? representationalCount / mergedBlueprints.length : 0;
const provider = ai.provider || 'deterministic';

plan.v9 = {
  ...(plan.v9 || {}),
  version: 9,
  renderer: 'semantic-visual-documentary-v9',
  brain: 'semantic-visual-blueprint-v9',
  brainProvider: provider,
  providerAvailability: providerAvailability(),
  providerErrorCount: ai.errors?.length || 0,
  familyCount,
  sceneFamilies: families,
  mapSceneCount: families.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number(representationalRatio.toFixed(3)),
  minimumRepresentationalRatio: 0.5,
  maximumMapScenes: 2,
  maxAiImagesPerVideo: Math.max(0, Number(process.env.V9_MAX_AI_IMAGES || 4)),
  semanticBlueprintReady: true,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 semantic visual brain ready: provider=${provider}, families=${familyCount}, representational=${representationalCount}/${mergedBlueprints.length}, maps=${plan.v9.mapSceneCount}, errors=${plan.v9.providerErrorCount}`);
