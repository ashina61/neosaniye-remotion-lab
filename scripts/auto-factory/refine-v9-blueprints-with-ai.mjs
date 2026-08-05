import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';
import {generateStructuredJson} from './v9-ai-provider-router.mjs';
import {mergeV9ArtDirection} from './v9-ai-refinement-merge.mjs';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const scenes = plan.scenes || [];

const locked = new Map(scenes.map((scene) => [Number(scene.id), {
  family: clean(scene.v9Blueprint?.sceneFamily),
  archetype: clean(scene.v9Blueprint?.sceneArchetype),
}]));
for (const [sceneId, semantic] of locked) {
  if (!semantic.family || !semantic.archetype) {
    throw new Error(`V9 scene ${sceneId} must be classified before AI refinement.`);
  }
}

const request = {
  task: 'Enrich locked semantic scene blueprints for a vertical editorial documentary.',
  topic: plan.topic,
  category: plan.category,
  rules: [
    'Never change sceneId, lockedSceneFamily or lockedSceneArchetype.',
    'Use only facts and named entities present in narration, mustShow or research.',
    'Describe concrete people, objects, environments and physical actions.',
    'Make foreground, midground and background visibly different.',
    'Return compact JSON only.',
  ],
  outputShape: {
    scenes: [{
      sceneId: 1,
      visualStatement: 'concrete visual sentence',
      worldEntities: ['visible entity'],
      foreground: ['foreground layer'],
      midground: ['physical action'],
      background: ['environment and scale'],
      camera: 'semantic camera movement',
      heroAction: 'physical action',
      transitionObject: 'meaningful carried object',
      imagePrompt: 'representational prompt without text or logos',
    }],
  },
  research: (plan.research || []).slice(0, 6).map((item) => ({
    title: clean(item.title),
    excerpt: clean(item.excerpt || item.snippet).slice(0, 420),
  })),
  scenes: scenes.map((scene) => ({
    sceneId: Number(scene.id),
    lockedSceneFamily: scene.v9Blueprint.sceneFamily,
    lockedSceneArchetype: scene.v9Blueprint.sceneArchetype,
    narration: clean(scene.voiceLine),
    mustShow: scene.mustShow || [],
    currentWorldEntities: scene.v9Blueprint.worldEntities || [],
    currentLayers: scene.v9Blueprint.layerPlan || {},
  })),
};

const result = await generateStructuredJson({
  prompt: JSON.stringify(request, null, 2),
  systemInstruction: 'You are NeoSaniye V9 Art Director. Families and archetypes are already selected from the spoken claim. Enrich only mise-en-scene, depth, camera and image prompt. Return JSON only.',
  validate: (value) => (
    value
    && Array.isArray(value.scenes)
    && value.scenes.some((scene) => Number.isFinite(Number(scene?.sceneId)))
  ),
});

const candidates = new Map(
  (result.value?.scenes || [])
    .filter((scene) => Number.isFinite(Number(scene?.sceneId)))
    .map((scene) => [Number(scene.sceneId), scene]),
);
let refinedCount = 0;

for (const scene of scenes) {
  const candidate = candidates.get(Number(scene.id));
  scene.v9Blueprint = mergeV9ArtDirection({
    scene,
    candidate,
    provider: result.provider,
    model: result.model,
  });
  if (candidate) refinedCount += 1;

  const expected = locked.get(Number(scene.id));
  if (
    scene.v9Blueprint.sceneFamily !== expected.family
    || scene.v9Blueprint.sceneArchetype !== expected.archetype
  ) {
    throw new Error(`V9 scene ${scene.id} semantic lock failed after AI refinement.`);
  }
}

const sceneFamilies = scenes.map((scene) => clean(scene.v9Blueprint.sceneFamily));
const sceneArchetypes = scenes.map((scene) => clean(scene.v9Blueprint.sceneArchetype));
const physicalFamilies = new Set([
  'human-reconstruction',
  'environmental-reconstruction',
  'industrial-process',
  'mechanism-cutaway',
  'microscopic-process',
  'market-exchange',
  'archival-evidence',
  'hazard-operation',
  'consequence-world',
]);
const representationalCount = sceneFamilies.filter((family) => physicalFamilies.has(family)).length;
const previousAttempts = Array.isArray(plan.v9?.providerAttempts) ? plan.v9.providerAttempts : [];
const attempts = Array.isArray(result.attempts) ? result.attempts : [];

plan.v9 = {
  ...(plan.v9 || {}),
  brainProvider: result.provider !== 'deterministic'
    ? result.provider
    : plan.v9?.brainProvider || 'deterministic',
  brainModel: result.model || plan.v9?.brainModel || null,
  providerAttempts: [...previousAttempts, ...attempts],
  providerErrorCount: [...previousAttempts, ...attempts].filter((attempt) => !attempt.ok).length,
  aiArtDirectionRefinedSceneCount: refinedCount,
  aiArtDirectionVersion: 4,
  aiSceneSemanticLock: 'family-and-archetype-v1',
  sceneFamilies,
  sceneArchetypes,
  familyCount: new Set(sceneFamilies).size,
  archetypeCount: new Set(sceneArchetypes).size,
  mapSceneCount: sceneFamilies.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number((representationalCount / Math.max(1, sceneFamilies.length)).toFixed(3)),
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 AI art direction ready: provider=${result.provider}, model=${result.model || 'none'}, refined=${refinedCount}/${scenes.length}, archetypes=${sceneArchetypes.join(' -> ')}`);
