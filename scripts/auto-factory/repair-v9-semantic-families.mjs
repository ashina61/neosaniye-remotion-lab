import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();

const FAMILY_META = {
  'geographic-route': {physical: false, motion: 'route-trace-with-camera-follow', fallback: 'layered-route-map'},
  'human-reconstruction': {physical: true, motion: 'parallax-push-with-action-reveal', fallback: 'layered-human-silhouette-scene'},
  'environmental-reconstruction': {physical: true, motion: 'depth-parallax-establishing', fallback: 'layered-environment-stage'},
  'industrial-process': {physical: true, motion: 'machine-follow-and-process-build', fallback: 'industrial-layer-stage'},
  'mechanism-cutaway': {physical: true, motion: 'shell-open-and-signal-flow', fallback: 'semantic-cutaway'},
  'microscopic-process': {physical: true, motion: 'macro-drift-and-cause-effect', fallback: 'organic-macro-stage'},
  'market-exchange': {physical: true, motion: 'object-match-cut-through-handoffs', fallback: 'layered-exchange-stage'},
  'network-flow': {physical: false, motion: 'node-activation-and-flow-carry', fallback: 'semantic-network-stage'},
  'archival-evidence': {physical: true, motion: 'evidence-pullout-and-highlight', fallback: 'archive-desk-stage'},
  'hazard-operation': {physical: true, motion: 'threat-approach-impact-and-response', fallback: 'hazard-operation-stage'},
  'comparison-stage': {physical: false, motion: 'matched-split-and-difference-reveal', fallback: 'semantic-comparison-stage'},
  'timeline-causality': {physical: false, motion: 'event-trace-and-causal-carry', fallback: 'causal-timeline-stage'},
  'consequence-world': {physical: true, motion: 'pull-back-to-system-consequence', fallback: 'world-consequence-stage'},
};

const localText = (scene) => lower([
  scene.title,
  scene.voiceLine,
  scene.sceneGoal,
  scene.heroVisual,
  ...(scene.mustShow || []),
  ...(scene.supportVisuals || []),
].join(' '));

const classify = (scene, index, total) => {
  const text = localText(scene);
  if (index === total - 1) return 'consequence-world';

  if (/\b(market|bazaar|exchange|handoff|goods? changed hands?|bought|sold|stalls?|cargo transfer)\b/.test(text)) return 'market-exchange';
  if (/\b(caravans?|camels?|merchant journey|travell?ers?|pilgrims?|workers?|engineers?|scientists?|soldiers?|operators?|scholars?)\b/.test(text)) return 'human-reconstruction';
  if (/\b(ships?|merchant vessels?|ports?|harbou?rs?|docks?|sea routes?|maritime|aircraft)\b/.test(text)) return 'human-reconstruction';
  if (/\b(wars?|blocked|blockage|blockade|danger|threat|attack|damage|repair|protect|failure|break one link|tax checkpoint|fortified checkpoint|fought over|disruption|harder to treat)\b/.test(text)) return 'hazard-operation';
  if (/\b(paper|manuscripts?|documents?|records?|archives?|evidence|reports?|decrees?|photographs?|religions?|stories|knowledge|ideas?|technologies)\b/.test(text)) return 'archival-evidence';

  const hasTerrain = /\b(mountains?|deserts?|terrain|water sources?|oasis landscape|forests?|ocean floor|habitats?|environmental constraints?)\b/.test(text);
  const hasGeographicFlow = /\b(routes?|roads?|corridors?|lanes?)\b.*\b(link|links|linked|linking|connect|connects|connected|connecting|from|between)\b|\b(link|links|linked|linking|connect|connects|connected|connecting)\b.*\b(east|west|asia|europe|continents?|countries|regions?|cities)\b|\bfrom\b.+\bto\b/.test(text);
  if (hasTerrain && !hasGeographicFlow) return 'environmental-reconstruction';

  if (/\b(factories|factory|fabs?|manufactur\w*|produc\w*|machines?|plants?|clean rooms?|assembly|lithography equipment)\b/.test(text)) return 'industrial-process';
  if (/\b(lithograph\w*|circuit patterns?|transistors?|nanometers?|wafer layers?|inside|layers?|cores?|cutaway|components?|mechanisms?|signals?|fibers?|chips?|wafers?|membranes?|receptors?|gene transfer|genes move|dna exchange)\b/.test(text)) return 'mechanism-cutaway';
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

const scenes = plan.scenes || [];
for (const [index, scene] of scenes.entries()) {
  const blueprint = scene.v9Blueprint || {};
  const family = classify(scene, index, scenes.length);
  const meta = FAMILY_META[family];
  scene.v9Blueprint = {
    ...blueprint,
    sceneId: Number(scene.id ?? index + 1),
    sceneFamily: family,
    familyDecisionSource: index === scenes.length - 1
      ? 'mandatory-ending-consequence'
      : 'final-spoken-claim-repair',
    motionIntent: {
      ...(blueprint.motionIntent || {}),
      grammar: meta.motion,
    },
    assetPlan: {
      ...(blueprint.assetPlan || {}),
      aiImageRecommended: meta.physical,
      aiImagePriority: meta.physical ? (index === 0 ? 5 : 3) : 1,
      fallbackRenderer: meta.fallback,
    },
  };
}

const families = scenes.map((scene) => scene.v9Blueprint.sceneFamily);
let mapCount = 0;
for (let index = 0; index < scenes.length - 1; index += 1) {
  const blueprint = scenes[index].v9Blueprint;
  if (blueprint.sceneFamily === 'geographic-route') {
    mapCount += 1;
    if (mapCount > 2) {
      blueprint.sceneFamily = /mountain|desert|terrain|water|oasis/.test(localText(scenes[index]))
        ? 'environmental-reconstruction'
        : 'human-reconstruction';
      blueprint.familyDecisionSource = 'final-map-budget-repair';
      const meta = FAMILY_META[blueprint.sceneFamily];
      blueprint.motionIntent.grammar = meta.motion;
      blueprint.assetPlan.aiImageRecommended = meta.physical;
      blueprint.assetPlan.fallbackRenderer = meta.fallback;
    }
  }
}

for (let index = 2; index < scenes.length - 1; index += 1) {
  const current = scenes[index].v9Blueprint;
  const previous = scenes[index - 1].v9Blueprint;
  const before = scenes[index - 2].v9Blueprint;
  if (current.sceneFamily === previous.sceneFamily && current.sceneFamily === before.sceneFamily) {
    current.sceneFamily = /mountain|desert|terrain|water|environment/.test(localText(scenes[index]))
      ? 'environmental-reconstruction'
      : 'human-reconstruction';
    current.familyDecisionSource = 'final-family-spam-repair';
    const meta = FAMILY_META[current.sceneFamily];
    current.motionIntent.grammar = meta.motion;
    current.assetPlan.aiImageRecommended = meta.physical;
    current.assetPlan.fallbackRenderer = meta.fallback;
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
  semanticFamilyRepair: 'final-spoken-claim-v1',
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 semantic family repair ready: ${finalFamilies.join(' -> ')}`);
