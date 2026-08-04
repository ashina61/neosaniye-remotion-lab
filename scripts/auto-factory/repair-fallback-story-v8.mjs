import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
const trustedSources = new Set(['curated-topic-script', 'ranked-complete-research']);
const words = (value) => String(value || '').match(/[0-9A-Za-zÇĞİÖŞÜçğıöşü'-]+/g) || [];
const completeLine = (value) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  const count = words(text).length;
  if (count < 7 || count > 20) return false;
  if (!/[.!?]$/.test(text)) return false;
  if (/^(and|but|because|which|while|although|however|ve|ama|çünkü)\b/i.test(text)) return false;
  if (/\b(a|an|the|of|to|and|or|but|with|from|into|by|for|as|that|which|is|are|was|were|ve|ile|için|bir|bu|şu)\.$/i.test(text)) return false;
  return true;
};

const researchDepth = plan.researchDepth || {};
const trustedSceneCount = scenes.filter((scene) => trustedSources.has(scene.contentRepairSource)).length;
const hasGroundedSceneSet = (
  scenes.length >= 10
  && trustedSceneCount === scenes.length
  && scenes.every((scene) => completeLine(scene.voiceLine))
  && (
    scenes.every((scene) => scene.contentRepairSource === 'curated-topic-script')
    || (
      researchDepth.failClosed === true
      && Number(researchDepth.sourceCount || 0) >= 3
      && Number(researchDepth.excerptCharacters || 0) >= 4200
    )
  )
);

if (hasGroundedSceneSet) {
  plan.storyRepair = {
    version: 2,
    mode: 'preserve-grounded-v3-story',
    failClosed: true,
    selectedFactCount: scenes.length,
    minimumFactCount: 10,
    contentSources: [...new Set(scenes.map((scene) => scene.contentRepairSource))],
    researchSourceCount: Number(researchDepth.sourceCount || (plan.research || []).length),
    researchExcerptCharacters: Number(researchDepth.excerptCharacters || 0),
    reason: 'Existing ten-scene story already passed complete-sentence and research-depth checks.',
  };
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(`Fallback story V8 preserved existing grounded plan: scenes=${scenes.length}, sources=${[...new Set(scenes.map((scene) => scene.contentRepairSource))].join(',')}`);
  process.exit(0);
}

const run = spawnSync(process.execPath, ['scripts/auto-factory/repair-fallback-story.mjs'], {
  cwd: process.cwd(),
  env: {...process.env, PLAN_PATH: planPath, MANIFEST_PATH: manifestPath},
  encoding: 'utf8',
  stdio: 'pipe',
});
if (run.stdout) process.stdout.write(run.stdout);
if (run.stderr) process.stderr.write(run.stderr);
if (run.status !== 0) process.exit(run.status || 1);

const repaired = JSON.parse(await readFile(planPath, 'utf8'));
if (!Array.isArray(repaired.scenes) || repaired.scenes.length < 10) {
  throw new Error(`Fallback story V8 rejected undersized repaired plan: scenes=${repaired.scenes?.length || 0}, required=10.`);
}
console.log(`Fallback story V8 accepted extractive repair: scenes=${repaired.scenes.length}`);
