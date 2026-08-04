import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const dir = await mkdtemp(join(tmpdir(), 'neosaniye-fallback-v8-'));
const planPath = join(dir, 'plan.json');
const manifestPath = join(dir, 'manifest.json');
const facts = [
  'Submarine cables connect landing stations across oceans and carry digital communications.',
  'Modern systems transmit data as light pulses through extremely thin optical fibers.',
  'Protective layers surround the glass core and resist pressure on the seabed.',
  'Repeaters restore weakened optical signals along routes that cross entire oceans.',
  'Cable ships survey the seabed before carefully laying each planned route.',
  'Landing stations connect the submarine system with terrestrial fiber networks.',
  'Shallow-water sections receive heavier armor because anchors and fishing threaten them.',
  'Network operators use alternate routes when one cable is damaged or disconnected.',
  'Repair crews locate faults and raise damaged cable sections from the ocean floor.',
  'Global internet traffic depends on many physical cables rather than invisible satellites.',
];
const plan = {
  topic: 'How undersea cables carry the internet', category: 'technology', language: 'en',
  research: [{title: 'Submarine communications cable', excerpt: 'x'.repeat(2300)}, {title: 'Optical fiber', excerpt: 'x'.repeat(2100)}, {title: 'Fiber-optic cable', excerpt: 'x'.repeat(1800)}],
  researchDepth: {version: 1, sourceCount: 3, excerptCharacters: 6200, failClosed: true},
  scenes: facts.map((voiceLine, index) => ({id: index + 1, voiceLine, contentRepairSource: 'ranked-complete-research'})),
};
await writeFile(planPath, JSON.stringify(plan), 'utf8');
await writeFile(manifestPath, JSON.stringify({aiPlan: false, researchMode: 'wikipedia'}), 'utf8');
const run = spawnSync(process.execPath, ['scripts/auto-factory/repair-fallback-story-v8.mjs'], {
  cwd: process.cwd(), env: {...process.env, PLAN_PATH: planPath, MANIFEST_PATH: manifestPath}, encoding: 'utf8',
});
if (run.status !== 0) throw new Error(`${run.stdout}\n${run.stderr}`);
const result = JSON.parse(await readFile(planPath, 'utf8'));
if (result.scenes.length !== 10) throw new Error(`Trusted V3 story was resized: ${result.scenes.length}`);
if (result.scenes.some((scene, index) => scene.voiceLine !== facts[index])) throw new Error('Trusted V3 facts were overwritten.');
if (result.storyRepair?.mode !== 'preserve-grounded-v3-story') throw new Error(`Unexpected V8 fallback mode: ${result.storyRepair?.mode}`);
await rm(dir, {recursive: true, force: true});
console.log('Fallback story V8 regression passed: trusted ten-scene grounded plans are preserved.');
