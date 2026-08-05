import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';
import {generateStructuredJson} from './v9-ai-provider-router.mjs';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const unique = (values) => [...new Set((values || []).map(clean).filter(Boolean))];
const scenes = plan.scenes || [];

const request = {
  task: 'Enrich locked semantic scene blueprints for a vertical editorial documentary.',
  topic: plan.topic,
  category: plan.category,
  rules: [
    'Never change sceneId or lockedSceneFamily.',
    'Use only facts and named entities present in the narration, mustShow list or research.',
    'Describe concrete people, objects, environments and physical actions, not cards or generic icons.',
    'Make foreground, midground and background visibly different.',
    'Return compact JSON only.',
  ],
  outputShape: {
    scenes: [{
      sceneId: 1,
      visualStatement: 'one concrete visual sentence',
      worldEntities: ['specific visible entity'],
      foreground: ['specific foreground layer'],
      midground: ['specific physical action'],
      background: ['specific environment and scale'],
      camera: 'semantic camera movement',
      heroAction: 'physical action tied to narration',
      transitionObject: 'meaningful object carried into next scene',
      imagePrompt: 'complete representational image prompt without text or logos',
    }],
  },
  research: (plan.research || []).slice(0, 6).map((item) => ({
    title: clean(item.title),
    excerpt: clean(item.excerpt || item.snippet).slice(0, 420),
  })),
  scenes: scenes.map((scene) => ({
    sceneId: scene.id,
    lockedSceneFamily: scene.v9Blueprint?.sceneFamily,
    narration: clean(scene.voiceLine),
    mustShow: scene.mustShow || [],
    currentWorldEntities: scene.v9Blueprint?.worldEntities || [],
    currentLayers: scene.v9Blueprint?.layerPlan || {},
  })),
};

const result = await generateStructuredJson({
  prompt: JSON.stringify(request, null, 2),
  systemInstruction: [
    'You are NeoSaniye V9 Art Director.',
    'You receive scene families that have already been selected from the spoken claim.',
    'Do not redesign the taxonomy. Enrich only the concrete mise-en-scene, depth, camera and image prompt.',
    'Return JSON only.',
  ].join(' '),
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
  const current = scene.v9Blueprint || {};
  const candidate = candidates.get(Number(scene.id));
  if (!candidate) continue;

  const foreground = unique(candidate.foreground || candidate.layerPlan?.foreground);
  const midground = unique(candidate.midground || candidate.layerPlan?.midground);
  const background = unique(candidate.background || candidate.layerPlan?.background);
  const worldEntities = unique([
    ...(current.worldEntities || []),
    ...(candidate.worldEntities || candidate.visibleEntities || candidate.subjects || []),
  ]).slice(0, 10);
  const visualStatement = clean(candidate.visualStatement || candidate.sceneDescription);
  const camera = clean(candidate.camera || candidate.motionIntent?.camera);
  const heroAction = clean(candidate.heroAction || candidate.motionIntent?.heroAction);
  const transitionObject = clean(candidate.transitionObject || candidate.motionIntent?.transitionObject);
  const imagePrompt = clean(candidate.imagePrompt || candidate.prompt || candidate.assetPlan?.prompt);

  scene.v9Blueprint = {
    ...current,
    sceneId: Number(scene.id),
    sceneFamily: current.sceneFamily,
    familyDecisionSource: current.familyDecisionSource,
    visualStatement: visualStatement || current.visualStatement,
    worldEntities: worldEntities.length >= 2 ? worldEntities : current.worldEntities,
    spatialRelations: [
      foreground.length ? `foreground: ${foreground.join(', ')}` : current.spatialRelations?.[0],
      midground.length ? `midground: ${midground.join(', ')}` : current.spatialRelations?.[1],
      background.length ? `background: ${background.join(', ')}` : current.spatialRelations?.[2],
    ].filter(Boolean),
    layerPlan: {
      foreground: foreground.length ? foreground : current.layerPlan?.foreground,
      midground: midground.length ? midground : current.layerPlan?.midground,
      background: background.length ? background : current.layerPlan?.background,
    },
    motionIntent: {
      ...(current.motionIntent || {}),
      camera: camera || current.motionIntent?.camera,
      heroAction: heroAction || current.motionIntent?.heroAction,
      transitionObject: transitionObject || current.motionIntent?.transitionObject,
    },
    assetPlan: {
      ...(current.assetPlan || {}),
      prompt: imagePrompt.length >= 40 ? imagePrompt : current.assetPlan?.prompt,
    },
    aiArtDirection: {
      provider: result.provider,
      model: result.model,
      refined: true,
    },
  };
  refinedCount += 1;
}

const previousAttempts = Array.isArray(plan.v9?.providerAttempts) ? plan.v9.providerAttempts : [];
const attempts = Array.isArray(result.attempts) ? result.attempts : [];
plan.v9 = {
  ...(plan.v9 || {}),
  brainProvider: result.provider !== 'deterministic' ? result.provider : plan.v9?.brainProvider || 'deterministic',
  brainModel: result.model || plan.v9?.brainModel || null,
  providerAttempts: [...previousAttempts, ...attempts],
  providerErrorCount: [...previousAttempts, ...attempts].filter((attempt) => !attempt.ok).length,
  aiArtDirectionRefinedSceneCount: refinedCount,
  aiArtDirectionVersion: 1,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 AI art direction ready: provider=${result.provider}, model=${result.model || 'none'}, refined=${refinedCount}/${scenes.length}`);
