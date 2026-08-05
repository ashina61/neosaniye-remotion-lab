import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const dir = await mkdtemp(join(tmpdir(), 'neosaniye-v8-story-visual-'));
const planPath = join(dir, 'plan.json');
const story = [
  ['THE PHYSICAL INTERNET', 'realistic-object', 'international internet traffic', 'Most international internet traffic travels through cables resting on the seabed.'],
  ['ROUTES ARE SURVEYED', 'environment', 'cable ship', 'Cable ships lower planned routes carefully across thousands of ocean kilometers.'],
  ['LAYERS PROTECT GLASS', 'cross-section', 'glass fibers', 'Each cable surrounds glass fibers with insulation, power conductors, and protective armor.'],
  ['DATA BECOMES LIGHT', 'mechanism', 'laser transmitter', 'Lasers encode digital information into rapid light pulses inside those fibers.'],
  ['LIGHT STAYS INSIDE', 'cross-section', 'total internal reflection', 'Total internal reflection keeps the light traveling through the glass core.'],
  ['REPEATERS RESTORE SIGNALS', 'mechanism', 'optical repeater', 'Optical repeaters restore weakening signals at intervals along extremely long routes.'],
  ['THE CABLE REACHES LAND', 'realistic-object', 'cable landing station', 'Landing stations connect submarine cables to terrestrial networks and data centers.'],
  ['COASTLINES NEED ARMOR', 'comparison', 'armored shore cable', 'Near coastlines, extra armor protects cables from anchors and fishing gear.'],
  ['DAMAGE CAN BE REPAIRED', 'evidence', 'repair ship', 'When damage occurs, repair ships locate, raise, splice, and replace sections.'],
  ['REDUNDANCY KEEPS DATA MOVING', 'network', 'alternate cable routes', 'Multiple routes provide redundancy when one cable suddenly stops carrying traffic.'],
];
const makeContract = (index, subject) => ({
  version: 8,
  baseVersion: 7,
  motifs: [{label: subject, kind: 'hero-object', importance: 'hero', depth: 0}],
  style: {family: 'technical-blueprint', palette: {bg:'#07131f',surface:'#dfe8e0',ink:'#11211e',primary:'#d46b3f',secondary:'#4d8d7b',highlight:'#e8d276',muted:'#65736c'}, typography:'mono', texture:'grid', lighting:'cinematic', effects:['grain'], density:'medium'},
  visualDirection: {
    directorVersion: 1,
    domain: 'technology-systems',
    sceneRole: index === 0 ? 'hook' : index === 9 ? 'resolution' : 'development',
    sceneMode: index % 2 ? 'system-map' : 'realistic-object',
    presentationClass: index % 2 ? 'diagram' : 'realistic',
    realismScore: 0.7,
    heroAssetType: 'object',
    environment: 'network-grid',
    composition: 'two-region-split',
    depthPlan: {foreground:'object',midground:'network-grid',background:'context'},
    renderStrategy: 'hybrid-explainer',
    assetPriority: 'optional',
    subject,
    supportingSubjects: ['support one', 'support two'],
    avoid: ['generic shapes'],
  },
});
const plan = {
  topic: 'How undersea cables carry the internet',
  category: 'technology',
  language: 'en',
  duration: 46,
  seed: 6061,
  storyDirector: {id: 'undersea-cable-mechanism-v1', version: 1},
  v8: {version: 8, renderer: 'visual-motion-documentary-v8', visualDirector: {version: 1}},
  scenes: story.map(([title, kind, subject, voiceLine], index) => ({
    id: index + 1,
    title,
    kicker: subject,
    voiceLine,
    storyDirectorKind: kind,
    visualConcepts: [subject, 'support one', 'support two'],
    visualContract: makeContract(index, subject),
  })),
};
await writeFile(planPath, JSON.stringify(plan), 'utf8');
const run = spawnSync(process.execPath, ['scripts/auto-factory/refine-v8-story-visual-direction.mjs'], {
  cwd: process.cwd(), env: {...process.env, PLAN_PATH: planPath}, encoding: 'utf8',
});
if (run.status !== 0) throw new Error(`${run.stdout}\n${run.stderr}`);
const result = JSON.parse(await readFile(planPath, 'utf8'));
const modes = result.scenes.map((scene) => scene.visualContract.visualDirection.sceneMode);
const compositions = result.scenes.map((scene) => scene.visualContract.visualDirection.composition);
const expectedModes = [
  'realistic-object', 'realistic-object', 'technical-cutaway', 'technical-cutaway', 'technical-cutaway',
  'realistic-object', 'realistic-object', 'realistic-object', 'realistic-object', 'system-map',
];
if (modes.join('|') !== expectedModes.join('|')) throw new Error(`Unexpected story-driven modes: ${modes.join(', ')}`);
for (const required of ['cable-ship-operation', 'exploded-axis', 'signal-through-core', 'repeater-line', 'shore-landing-station', 'anchor-hazard', 'repair-ship-operation', 'redundant-route-map']) {
  if (!compositions.includes(required)) throw new Error(`Missing physical V8 composition: ${required}`);
}
if (result.v8?.visualDirector?.physicalSceneCount < 6) throw new Error(`Physical scene count too low: ${result.v8?.visualDirector?.physicalSceneCount}`);
if (result.scenes.some((scene) => !/realistic scale, materials, lighting/i.test(scene.imagePrompt))) throw new Error('Refined image prompts do not demand believable physical scenes.');
await rm(dir, {recursive: true, force: true});
console.log(`V8 story visual refinement regression passed: physical=${modes.filter((mode) => mode === 'realistic-object').length}, cutaway=${modes.filter((mode) => mode === 'technical-cutaway').length}, map=${modes.filter((mode) => mode === 'system-map').length}`);
