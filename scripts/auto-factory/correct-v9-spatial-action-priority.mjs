import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();
const unique = (values) => [...new Set((values || []).map(clean).filter(Boolean))];

const META = {
  'geographic-route': {
    physical: false,
    grammar: 'route-trace-with-camera-follow',
    fallback: 'layered-route-map',
    goal: 'a directional route with origin, destination, intermediary hubs, terrain and moving flow',
  },
  'human-reconstruction': {
    physical: true,
    grammar: 'parallax-push-with-action-reveal',
    fallback: 'layered-human-silhouette-scene',
    goal: 'people, vehicles or city infrastructure physically performing the narrated action',
  },
  'environmental-reconstruction': {
    physical: true,
    grammar: 'depth-parallax-establishing',
    fallback: 'layered-environment-stage',
    goal: 'terrain, water and physical scale visibly deciding where the action can happen',
  },
};

const speech = (scene) => lower([scene.title, scene.voiceLine, scene.sceneGoal].join(' '));
const visible = (scene) => lower([scene.heroVisual, ...(scene.mustShow || [])].join(' '));

const spatialFamily = (scene) => {
  const spoken = speech(scene);
  const text = `${spoken} ${visible(scene)}`;
  const terrain = /\b(mountains?|deserts?|terrain|water sources?|oases?|oasis|passes?|forests?|ocean floor|habitats?)\b/.test(spoken);
  const terrainIsSubject = /^(?:terrain|mountains?|deserts?|mountain passes?|water sources?|oases?|oasis|forests?|ocean floor)\b/.test(spoken)
    || /\b(terrain|mountains?|deserts?|mountain passes?|water sources?)\b.{0,55}\b(decid\w*|shap\w*|determin\w*|limit\w*|forc\w*|control\w*)\b/.test(spoken);
  if (terrain && terrainIsSubject) return 'environmental-reconstruction';

  const humanAction = /\b(ships?|merchant vessels?|ports?|harbou?rs?|docks?|sea routes?|maritime|aircraft|caravans?|camels?|merchants?|travell?ers?|pilgrims?|workers?|engineers?|scientists?|soldiers?|operators?|scholars?|oasis cities?|city gates?|relay hubs?|samarkand|cities became|city became|trading cities?)\b/.test(text);
  if (humanAction) return 'human-reconstruction';

  const macroRoute = /\b(routes?|roads?|corridors?|lanes?)\b.{0,100}\b(link|links|linked|linking|connect|connects|connected|connecting)\b.{0,100}\b(east|west|asia|europe|continents?|countries|regions?|china|persia)\b/.test(spoken)
    || /\b(link|links|linked|linking|connect|connects|connected|connecting)\b.{0,100}\b(east|west|asia|europe|continents?|countries|regions?|china|persia)\b/.test(spoken)
    || /\bfrom\b.{1,80}\bto\b/.test(spoken)
    || /\bacross continents?\b/.test(spoken);
  if (macroRoute) return 'geographic-route';

  return null;
};

const apply = (scene, family) => {
  const current = scene.v9Blueprint || {};
  const meta = META[family];
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
    sceneFamily: family,
    familyDecisionSource: 'spatial-action-priority-v1',
    visualStatement: `Make the spoken claim visible as ${meta.goal}.`,
    worldEntities,
    spatialRelations: [
      `foreground: ${subject} and the main physical action`,
      `midground: ${meta.goal}`,
      `background: ${environment} with believable scale and geographic context`,
    ],
    layerPlan: {
      foreground: [subject, worldEntities[1] || 'claim-specific physical prop'],
      midground: [worldEntities[2] || 'visible action', meta.goal],
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
        `Locked scene family: ${family}.`,
        `Show: ${worldEntities.join(', ')}.`,
        `Build ${meta.goal}.`,
        `Environment: ${environment}.`,
        'Clear foreground, midground and background with believable scale.',
        'Avoid dashboard layouts and abstract decorative marks. No readable text, logos or watermarks.',
      ].join(' '),
    },
  };
};

const scenes = plan.scenes || [];
for (const [index, scene] of scenes.entries()) {
  if (index === scenes.length - 1) continue;
  const family = spatialFamily(scene);
  if (family) apply(scene, family);
}

const families = scenes.map((scene) => scene.v9Blueprint?.sceneFamily);
const physical = new Set([
  'human-reconstruction', 'environmental-reconstruction', 'industrial-process',
  'mechanism-cutaway', 'microscopic-process', 'market-exchange',
  'archival-evidence', 'hazard-operation', 'consequence-world',
]);
const representationalCount = families.filter((family) => physical.has(family)).length;
plan.v9 = {
  ...(plan.v9 || {}),
  sceneFamilies: families,
  familyCount: new Set(families).size,
  mapSceneCount: families.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number((representationalCount / Math.max(1, families.length)).toFixed(3)),
  spatialActionPriority: 'terrain-subject-human-action-macro-route-v1',
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 spatial action priority ready: ${families.join(' -> ')}`);
