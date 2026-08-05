import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import process from 'node:process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const scenes = plan.scenes || [];
const v9 = plan.v9 || {};

const expectedFamilies = [
  'geographic-route',
  'human-reconstruction',
  'human-reconstruction',
  'market-exchange',
  'environmental-reconstruction',
  'archival-evidence',
  'hazard-operation',
  'human-reconstruction',
  'hazard-operation',
  'consequence-world',
];
const expectedArchetypes = [
  'route-overview',
  'caravan-journey',
  'oasis-relay-city',
  'market-handoff',
  'terrain-constraint',
  'knowledge-transfer',
  'state-control-conflict',
  'maritime-air-logistics',
  'route-or-system-disruption',
  'system-consequence',
];

assert.equal(scenes.length, 10, `Expected 10 Silk Road scenes, got ${scenes.length}`);
assert.deepEqual(
  scenes.map((scene) => scene.v9Blueprint?.sceneFamily),
  expectedFamilies,
  'Silk Road semantic families changed',
);
assert.deepEqual(
  scenes.map((scene) => scene.v9Blueprint?.sceneArchetype),
  expectedArchetypes,
  'Silk Road semantic archetypes changed',
);
assert.equal(v9.spokenFamilyLock, 'semantic-classifier-v1');
assert.equal(v9.archetypeCount, 10);
assert.equal(v9.mapSceneCount, 1);

for (const scene of scenes) {
  const blueprint = scene.v9Blueprint || {};
  assert.match(
    blueprint.assetPlan?.prompt || '',
    new RegExp(`Locked scene archetype: ${blueprint.sceneArchetype}`),
  );
}

const requireGemini = String(process.env.V9_REQUIRE_GEMINI || '').toLowerCase() === 'true';
if (requireGemini) {
  assert.equal(v9.brainProvider, 'gemini', `Strict Gemini proof required, provider is ${v9.brainProvider}`);
  assert.ok(Number(v9.aiArtDirectionRefinedSceneCount || 0) >= 8, 'Gemini refined fewer than 8 scenes');
} else if (process.env.GEMINI_API_KEY && v9.brainProvider !== 'gemini') {
  const attemptedGemini = (v9.providerAttempts || []).some((attempt) => attempt.provider === 'gemini');
  assert.ok(attemptedGemini, 'Gemini key exists but Gemini was not attempted before deterministic fallback');
}

console.log(`V9 Silk Road proof: PASS provider=${v9.brainProvider || 'deterministic'} archetypes=${expectedArchetypes.length}/10`);
