import assert from 'node:assert/strict';
import {mergeV9ArtDirection} from './v9-ai-refinement-merge.mjs';

const scene = {
  id: 2,
  v9Blueprint: {
    sceneFamily: 'human-reconstruction',
    sceneArchetype: 'caravan-journey',
    familyDecisionSource: 'semantic-classifier:human-action',
    visualStatement: 'A caravan crosses difficult terrain.',
    worldEntities: ['caravan', 'camels'],
    spatialRelations: ['foreground: camel', 'midground: caravan', 'background: desert'],
    layerPlan: {foreground: ['camel'], midground: ['caravan'], background: ['desert']},
    motionIntent: {grammar: 'parallax', camera: 'push-in'},
    assetPlan: {
      prompt: 'Original prompt. Locked scene family: human-reconstruction. Locked scene archetype: caravan-journey.',
    },
  },
};

const maliciousCandidate = {
  sceneFamily: 'geographic-route',
  sceneArchetype: 'route-overview',
  visualStatement: 'A generic floating cards dashboard map.',
  foreground: ['merchant close-up'],
  midground: ['moving camel caravan'],
  background: ['wide desert and mountain pass'],
  worldEntities: ['silk bundles'],
  camera: 'low tracking shot',
  imagePrompt: 'A richly layered documentary scene showing a merchant caravan crossing a desert mountain pass.',
};

const merged = mergeV9ArtDirection({
  scene,
  candidate: maliciousCandidate,
  provider: 'gemini',
  model: 'test-model',
});

assert.equal(merged.sceneFamily, 'human-reconstruction');
assert.equal(merged.sceneArchetype, 'caravan-journey');
assert.equal(merged.familyDecisionSource, 'semantic-classifier:human-action');
assert.match(merged.assetPlan.prompt, /Locked scene family: human-reconstruction/);
assert.match(merged.assetPlan.prompt, /Locked scene archetype: caravan-journey/);
assert.doesNotMatch(merged.visualStatement, /generic floating cards/i);
assert.deepEqual(merged.layerPlan.midground, ['moving camel caravan']);
assert.equal(merged.aiArtDirection.provider, 'gemini');

console.log('V9 adversarial AI merge lock: PASS');
