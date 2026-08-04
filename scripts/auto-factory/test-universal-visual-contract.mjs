import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const cases = [
  {
    topic: 'Why the Roman Empire split',
    category: 'history',
    lines: [
      'The empire became too large to govern from one capital.',
      'Diocletian divided authority between eastern and western courts.',
      'Different tax bases and armies pulled the halves apart.',
      'Constantinople grew richer while western defenses weakened.',
    ],
  },
  {
    topic: 'How black holes bend light',
    category: 'science',
    lines: [
      'A black hole curves the spacetime around its enormous mass.',
      'Nearby light follows those curved paths instead of straight lines.',
      'The warped image can form arcs and bright rings.',
      'Astronomers use that distortion to map invisible gravity.',
    ],
  },
  {
    topic: 'How undersea cables carry the internet',
    category: 'technology',
    lines: [
      'Laser pulses encode data inside hair-thin glass fibers.',
      'Repeaters amplify the signal across thousands of ocean kilometers.',
      'Landing stations route the traffic into national networks.',
      'A single cable break can redirect traffic around the world.',
    ],
  },
  {
    topic: 'How leafcutter ants farm fungus',
    category: 'nature',
    lines: [
      'Workers cut leaves but do not eat the fresh pieces.',
      'They carry the fragments into humid underground chambers.',
      'The colony feeds those leaves to a cultivated fungus.',
      'The fungus becomes the ants primary food source.',
    ],
  },
];

const makeScene = (voiceLine, index) => ({
  id: index + 1,
  start: index * 3,
  duration: 3,
  title: voiceLine.split(/\s+/).slice(0, 4).join(' '),
  kicker: '',
  voiceLine,
  visualKind: ['timeline', 'mechanism', 'world-network', 'comparison'][index % 4],
  sceneGrammar: ['timeline-strip', 'cause-chain', 'spread-network', 'comparison-scale'][index % 4],
  semanticAction: ['trace', 'transform', 'connect', 'compare'][index % 4],
  heroVisual: 'main subject',
  primaryMotif: 'main subject',
  secondaryMotif: 'supporting detail',
  props: ['HÜCRE', 'SİNYAL', 'MEKANİZMA'],
  supportVisuals: ['supporting detail'],
  mustShow: ['main subject', 'supporting detail'],
  subjectTokens: ['main', 'subject'],
  beats: [{at: 0.2, label: 'visual detail', action: 'reveal'}, {at: 0.6, label: 'supporting detail', action: 'connect'}],
  imagePrompt: 'Generic documentary scene with abstract geometry.',
});

for (const item of cases) {
  const dir = await mkdtemp(join(tmpdir(), 'neosaniye-v6-'));
  const path = join(dir, 'plan.json');
  const plan = {
    topic: item.topic,
    category: item.category,
    language: 'en',
    scenes: item.lines.map(makeScene),
  };
  await writeFile(path, JSON.stringify(plan), 'utf8');
  const run = spawnSync(process.execPath, ['scripts/auto-factory/build-universal-visual-contract.mjs'], {
    cwd: process.cwd(),
    env: {...process.env, PLAN_PATH: path},
    encoding: 'utf8',
  });
  if (run.status !== 0) {
    throw new Error(`${item.topic} failed:\n${run.stdout}\n${run.stderr}`);
  }
  const result = JSON.parse(await readFile(path, 'utf8'));
  if (result.v6?.renderer !== 'universal-semantic-v6') throw new Error(`${item.topic}: V6 metadata missing`);
  for (const scene of result.scenes) {
    if (!scene.visualContract || scene.visualContract.labels.length < 2) throw new Error(`${item.topic}: scene contract missing`);
    const visible = JSON.stringify([scene.props, scene.mustShow, scene.beats]);
    if (/HÜCRE|SİNYAL|MEKANİZMA/.test(visible)) throw new Error(`${item.topic}: stale Turkish fallback props survived`);
    if (/main subject|supporting detail|visual detail/i.test(visible)) throw new Error(`${item.topic}: placeholder visuals survived`);
  }
  await rm(dir, {recursive: true, force: true});
}

console.log(`Universal visual contract regression passed: ${cases.length} unrelated topics.`);
