import {readFile, writeFile} from 'node:fs/promises';
import process from 'node:process';
import {generateStructuredJson} from './v9-ai-provider-router.mjs';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const sanitizeAiText = (value) => clean(value)
  .replace(/generic floating cards/gi, 'dashboard-style card layouts')
  .replace(/decorative geometry as (?:the )?hero/gi, 'abstract decoration as the central subject')
  .replace(/single icon explains?/gi, 'one-symbol shorthand')
  .replace(/random circles and lines/gi, 'arbitrary geometric marks');
const unique = (values) => [...new Set((values || []).map(sanitizeAiText).filter(Boolean))];
const scenes = plan.scenes || [];

const lockedFamilies = new Map(
  scenes.map((scene, index) => [
    Number(scene.id),
    index === scenes.length - 1
      ? 'consequence-world'
      : clean(scene.v9Blueprint?.sceneFamily),
  ]),
);
const lockedDecisionSources = new Map(
  scenes.map((scene, index) => [
    Number(scene.id),
    index === scenes.length - 1
      ? 'mandatory-ending-consequence'
      : clean(scene.v9Blueprint?.familyDecisionSource),
  ]),
);

const request = {
  task: 'Enrich locked semantic scene blueprints for a vertical editorial documentary.',
  topic: plan.topic,
  category: plan.category,
  rules: [
    'Never change sceneId or lockedSceneFamily.',
    'Use only facts and named entities present in the narration, mustShow list or research.',
    'Describe concrete people, objects, environments and physical actions, not dashboard layouts or generic icons.',
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
    sceneId: Number(scene.id),
    lockedSceneFamily: lockedFamilies.get(Number(scene.id)),
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
  const sceneId = Number(scene.id);
  const current = scene.v9Blueprint || {};
  const lockedFamily = lockedFamilies.get(sceneId) || clean(current.sceneFamily);
  const lockedDecisionSource = lockedDecisionSources.get(sceneId) || clean(current.familyDecisionSource);
  const candidate = candidates.get(sceneId);

  if (!candidate) {
    scene.v9Blueprint = {
      ...current,
      sceneId,
      sceneFamily: lockedFamily,
      familyDecisionSource: lockedDecisionSource,
    };
    continue;
  }

  const foreground = unique(candidate.foreground || candidate.layerPlan?.foreground);
  const midground = unique(candidate.midground || candidate.layerPlan?.midground);
  const background = unique(candidate.background || candidate.layerPlan?.background);
  const worldEntities = unique([
    ...(current.worldEntities || []),
    ...(candidate.worldEntities || candidate.visibleEntities || candidate.subjects || []),
  ]).slice(0, 10);
  const visualStatement = sanitizeAiText(candidate.visualStatement || candidate.sceneDescription);
  const camera = sanitizeAiText(candidate.camera || candidate.motionIntent?.camera);
  const heroAction = sanitizeAiText(candidate.heroAction || candidate.motionIntent?.heroAction);
  const transitionObject = sanitizeAiText(candidate.transitionObject || candidate.motionIntent?.transitionObject);
  const rawImagePrompt = sanitizeAiText(candidate.imagePrompt || candidate.prompt || candidate.assetPlan?.prompt);
  const imagePrompt = rawImagePrompt.length >= 40
    ? `${rawImagePrompt} Avoid dashboard layouts and abstract decorative marks. No readable text, captions, logos or watermarks.`
    : current.assetPlan?.prompt;

  scene.v9Blueprint = {
    ...current,
    sceneId,
    sceneFamily: lockedFamily,
    familyDecisionSource: lockedDecisionSource,
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
      prompt: imagePrompt,
    },
    aiArtDirection: {
      provider: result.provider,
      model: result.model,
      refined: true,
    },
  };
  refinedCount += 1;
}

for (const [index, scene] of scenes.entries()) {
  const sceneId = Number(scene.id);
  const expectedFamily = index === scenes.length - 1
    ? 'consequence-world'
    : lockedFamilies.get(sceneId);
  if (!expectedFamily) {
    throw new Error(`V9 scene ${sceneId} had no locked semantic family before AI refinement.`);
  }
  scene.v9Blueprint = {
    ...(scene.v9Blueprint || {}),
    sceneId,
    sceneFamily: expectedFamily,
    familyDecisionSource: index === scenes.length - 1
      ? 'mandatory-ending-consequence'
      : lockedDecisionSources.get(sceneId) || scene.v9Blueprint?.familyDecisionSource,
  };
  if (scene.v9Blueprint.sceneFamily !== expectedFamily) {
    throw new Error(`V9 scene ${sceneId} family lock failed: ${scene.v9Blueprint.sceneFamily} != ${expectedFamily}`);
  }
}

const sceneFamilies = scenes.map((scene) => clean(scene.v9Blueprint?.sceneFamily));
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
  brainProvider: result.provider !== 'deterministic' ? result.provider : plan.v9?.brainProvider || 'deterministic',
  brainModel: result.model || plan.v9?.brainModel || null,
  providerAttempts: [...previousAttempts, ...attempts],
  providerErrorCount: [...previousAttempts, ...attempts].filter((attempt) => !attempt.ok).length,
  aiArtDirectionRefinedSceneCount: refinedCount,
  aiArtDirectionVersion: 3,
  aiSceneFamilyLock: 'pre-request-and-post-merge-v1',
  sceneFamilies,
  familyCount: new Set(sceneFamilies).size,
  mapSceneCount: sceneFamilies.filter((family) => family === 'geographic-route').length,
  representationalCount,
  representationalRatio: Number((representationalCount / Math.max(1, sceneFamilies.length)).toFixed(3)),
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V9 AI art direction ready: provider=${result.provider}, model=${result.model || 'none'}, refined=${refinedCount}/${scenes.length}, families=${sceneFamilies.join(' -> ')}`);
