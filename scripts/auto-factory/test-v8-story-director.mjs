import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const dir = await mkdtemp(join(tmpdir(), 'neosaniye-story-v8-'));
const planPath = join(dir, 'plan.json');
const makeScene = (index) => ({
  id: index + 1,
  start: index * 4.2,
  duration: 4.2,
  title: `GENERIC ${index + 1}`,
  kicker: 'GENERIC',
  voiceLine: 'Generic narration that should be replaced by the V8 story director.',
  props: ['GENERIC', 'SYSTEM', 'OBJECT'],
  beats: [
    {at: 0.18, label: 'generic object', action: 'reveal'},
    {at: 0.48, label: 'generic system', action: 'connect'},
  ],
});
const plan = {
  version: 2,
  topic: 'How undersea cables carry the internet',
  title: 'How undersea cables carry the internet',
  category: 'technology',
  language: 'en',
  duration: 46,
  fps: 30,
  narration: '',
  scenes: Array.from({length: 10}, (_, index) => makeScene(index)),
};
await writeFile(planPath, JSON.stringify(plan), 'utf8');
const run = spawnSync(process.execPath, ['scripts/auto-factory/apply-v8-story-director.mjs'], {
  cwd: process.cwd(),
  env: {...process.env, PLAN_PATH: planPath},
  encoding: 'utf8',
});
if (run.status !== 0) throw new Error(`${run.stdout}\n${run.stderr}`);
const result = JSON.parse(await readFile(planPath, 'utf8'));
if (result.scenes?.length !== 10) throw new Error(`Unexpected V8 story scene count: ${result.scenes?.length || 0}`);
if (result.storyDirector?.id !== 'undersea-cable-mechanism-v1') throw new Error(`Unexpected V8 story id: ${result.storyDirector?.id}`);
if (result.storyDirector?.narrationWords < 90 || result.storyDirector?.narrationWords > 118) {
  throw new Error(`V8 story narration outside natural range: ${result.storyDirector?.narrationWords}`);
}
if (!result.scenes.every((scene) => scene.contentRepairSource === 'curated-topic-script')) {
  throw new Error('V8 story scenes were not marked as curated-topic-script.');
}
const visible = JSON.stringify(result.scenes);
if (/India|researcher|professor|Baltic|party|accidentally|attributed|generic narration/i.test(visible)) {
  throw new Error('Event, biography, regional-statistic, or stale generic narration leaked into V8 cable story.');
}
for (const required of ['cable ship', 'light pulses', 'cable landing station', 'repair ship', 'alternate cable routes']) {
  if (!visible.toLowerCase().includes(required)) throw new Error(`Required V8 mechanism concept missing: ${required}`);
}
const kinds = new Set(result.scenes.map((scene) => scene.storyDirectorKind));
for (const required of ['realistic-object', 'environment', 'cross-section', 'mechanism', 'network', 'comparison', 'evidence']) {
  if (!kinds.has(required)) throw new Error(`Required V8 story kind missing: ${required}`);
}
const last = result.scenes[result.scenes.length - 1];
const totalEnd = Number((last.start + last.duration).toFixed(3));
if (Math.abs(totalEnd - result.duration) > 0.01) throw new Error(`V8 story timing does not end at target duration: ${totalEnd}`);
await rm(dir, {recursive: true, force: true});
console.log(`V8 Story Director regression passed: ${result.scenes.length} mechanism scenes, ${result.storyDirector.narrationWords} words, kinds=${[...kinds].join(',')}`);
