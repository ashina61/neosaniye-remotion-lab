import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const dir = await mkdtemp(join(tmpdir(), 'neosaniye-story-'));
const planPath = join(dir, 'plan.json');
const manifestPath = join(dir, 'manifest.json');
const makeScene = (index) => ({
  id: index + 1,
  start: index * 4.2,
  duration: 4.2,
  title: `GENERIC ${index + 1}`,
  kicker: 'VERİ · SİSTEM',
  voiceLine: 'Generic fallback sentence that does not explain the requested topic.',
  visualKind: 'mechanism',
  layout: 'center-hero',
  transition: 'cut',
  motion: 'push-in',
  sfx: 'none',
  accent: 'red',
  props: ['VERİ', 'SİSTEM', 'SİNYAL'],
  beats: [
    {at: 0.18, label: 'VERİ', action: 'reveal'},
    {at: 0.48, label: 'SİSTEM', action: 'connect'},
  ],
  detailLevel: 2,
  imagePrompt: 'Generic abstract geometry.',
});

const plan = {
  topic: 'How undersea cables carry the internet',
  title: 'How undersea cables carry the internet',
  hook: 'Generic hook.',
  category: 'technology',
  language: 'en',
  duration: 42,
  fps: 30,
  narration: '',
  research: [
    {
      title: 'Submarine communications cable',
      url: 'https://example.com/submarine',
      excerpt: 'A submarine communications cable is a cable laid on the seabed between land-based stations to carry telecommunication signals across stretches of ocean and sea. Subsequent generations of cables carried telephone traffic, then data communications traffic. These early cables used copper wires in their cores, but modern cables use optical fiber technology to carry digital data, which includes telephone, internet and private data traffic. Larger and heavier cables are used for shallow-water sections near shore.',
    },
    {
      title: 'Fiber-optic cable',
      url: 'https://example.com/fiber',
      excerpt: 'A fiber-optic cable is an assembly containing one or more optical fibers that are used to carry light. The optical fiber elements are individually coated with plastic layers and contained in a protective tube suitable for the environment where the cable is used. Different types of cable provide long-distance telecommunication and high-speed data connections.',
    },
    {
      title: 'Internet in India',
      url: 'https://example.com/india',
      excerpt: 'As of 2025, seven in ten Indians are online, with more than one billion internet users. Government initiatives and others further expedite internet-based ecosystems.',
    },
    {
      title: 'Nicole Starosielski',
      url: 'https://example.com/person',
      excerpt: 'She is an American author, researcher, and professor. She conducts research on global internet and media distribution and joined several academic projects.',
    },
    {
      title: 'Transatlantic telegraph cable',
      url: 'https://example.com/history',
      excerpt: 'The first cable was laid in 1858. The 1865 cable was retrieved and spliced, so two telegraph cables entered service.',
    },
  ],
  scenes: Array.from({length: 10}, (_, index) => makeScene(index)),
};

await writeFile(planPath, JSON.stringify(plan), 'utf8');
await writeFile(manifestPath, JSON.stringify({aiPlan: false}), 'utf8');
const run = spawnSync(process.execPath, ['scripts/auto-factory/repair-fallback-story.mjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PLAN_PATH: planPath,
    MANIFEST_PATH: manifestPath,
    FALLBACK_STORY_FORCE: 'true',
    POLLINATIONS_API_KEY: '',
  },
  encoding: 'utf8',
});
if (run.status !== 0) throw new Error(`${run.stdout}\n${run.stderr}`);

const result = JSON.parse(await readFile(planPath, 'utf8'));
const sourceTitles = result.storyRepair?.selectedSources?.map((source) => source.title) || [];
if (sourceTitles.join('|') !== 'Submarine communications cable|Fiber-optic cable') {
  throw new Error(`Wrong sources survived: ${sourceTitles.join(', ')}`);
}
if (result.scenes.length < 7 || result.scenes.length > 10) throw new Error(`Unexpected scene count: ${result.scenes.length}`);
const visible = JSON.stringify(result.scenes);
if (/India|Nicole|Starosielski|She conducts|others to|1865|1858|VERİ|SİSTEM|SİNYAL/i.test(visible)) {
  throw new Error('Off-topic research or stale fallback text survived.');
}
for (const scene of result.scenes) {
  if (!Array.isArray(scene.visualConcepts) || scene.visualConcepts.length < 2 || scene.visualConcepts.length > 5) {
    throw new Error(`Scene ${scene.id} has invalid visual concepts.`);
  }
  if (scene.visualConcepts.some((value) => value.length > 36)) throw new Error(`Scene ${scene.id} has an oversized visual concept.`);
  if (/^(he|she|they|others|and|but|which|where)\b/i.test(scene.voiceLine)) throw new Error(`Scene ${scene.id} starts as a fragment.`);
  if (/\b(and|or|to|of|in|with|which|where|protective)\.$/i.test(scene.voiceLine)) throw new Error(`Scene ${scene.id} ends as a fragment.`);
  if (scene.contentRepairSource !== 'ranked-wikipedia-fallback-v1') throw new Error(`Scene ${scene.id} was not repaired.`);
}

await rm(dir, {recursive: true, force: true});
console.log(`Fallback story regression passed: ${result.scenes.length} grounded scenes, sources=${sourceTitles.join(' | ')}`);
