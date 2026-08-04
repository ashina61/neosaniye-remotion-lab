import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const fixtures = [
  {topic: 'Why black holes bend light', category: 'space', expected: 'cosmic-observatory', words: ['black hole', 'gravity', 'light', 'orbit']},
  {topic: 'How antibiotic resistance develops', category: 'health', expected: 'biological-macro', words: ['bacteria', 'antibiotic', 'dna', 'cell']},
  {topic: 'How undersea cables carry the internet', category: 'technology', expected: 'technical-blueprint', words: ['undersea cable', 'fiber optic', 'network', 'signal']},
  {topic: 'Why the Roman Empire split', category: 'history', expected: 'archive-noir', words: ['Roman Empire', 'history', 'emperor', 'border']},
  {topic: 'Why leafcutter ants farm fungus', category: 'nature', expected: 'naturalist-field', words: ['leafcutter ants', 'fungus', 'forest', 'colony']},
];

const makePlan = (fixture) => ({
  version: 3,
  topic: fixture.topic,
  slug: fixture.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  title: fixture.topic,
  hook: `The hidden mechanism behind ${fixture.topic}`,
  category: fixture.category,
  language: 'en',
  duration: 42,
  fps: 30,
  seed: 71,
  narration: `${fixture.words.join(' ')}. `.repeat(12),
  musicMode: 'off',
  palette: {paper: '#eee6d2', ink: '#111111', red: '#cc2f2f', teal: '#338c91', gold: '#d2a941', blue: '#3d67ac'},
  research: [],
  scenes: Array.from({length: 10}).map((_, index) => {
    const labelA = fixture.words[index % fixture.words.length];
    const labelB = fixture.words[(index + 1) % fixture.words.length];
    const mode = ['focus', 'process', 'comparison', 'timeline', 'network', 'evidence', 'exploded'][index % 7];
    return {
      id: index + 1,
      start: index * 4.2,
      duration: 4.2,
      title: `${labelA} ${index + 1}`,
      kicker: labelB,
      voiceLine: `${labelA} connects to ${labelB} and changes the outcome.`,
      transition: 'match-zoom',
      detailLevel: 2,
      avoid: [],
      visualContract: {
        version: 6,
        mode,
        subject: labelA,
        labels: [labelA, labelB, fixture.words[(index + 2) % fixture.words.length]],
        relation: 'reveal',
        layoutVariant: index % 4,
        groundingTokens: fixture.words.join(' ').split(/\s+/),
        source: 'test-fixture',
      },
    };
  }),
});

const directory = await mkdtemp(join(tmpdir(), 'neosaniye-v7-'));
const families = new Set();
try {
  for (const fixture of fixtures) {
    const planPath = join(directory, `${fixture.category}.json`);
    await writeFile(planPath, JSON.stringify(makePlan(fixture), null, 2));
    const result = spawnSync(process.execPath, ['scripts/auto-factory/build-adaptive-style-contract.mjs'], {
      cwd: process.cwd(),
      env: {...process.env, PLAN_PATH: planPath},
      encoding: 'utf8',
    });
    if (result.status !== 0) throw new Error(`${result.stdout}\n${result.stderr}`);
    const output = JSON.parse(await readFile(planPath, 'utf8'));
    if (output.v7?.primaryFamily !== fixture.expected) {
      throw new Error(`${fixture.topic}: expected ${fixture.expected}, got ${output.v7?.primaryFamily}`);
    }
    if (output.v7?.fixedStyle !== false || output.v7?.adaptiveStyle !== true) {
      throw new Error(`${fixture.topic}: adaptive style metadata is invalid`);
    }
    if (!output.scenes.every((scene) => scene.visualContract?.version === 7)) {
      throw new Error(`${fixture.topic}: not every scene was upgraded to V7`);
    }
    if (!output.scenes.every((scene) => scene.visualContract?.motifs?.length >= 2)) {
      throw new Error(`${fixture.topic}: drawable motifs are missing`);
    }
    families.add(output.v7.primaryFamily);
  }
  if (families.size !== fixtures.length) {
    throw new Error(`Style director collapsed unrelated topics into ${families.size} families: ${[...families].join(', ')}`);
  }
  console.log(`Adaptive style contract tests passed: ${[...families].join(', ')}`);
} finally {
  await rm(directory, {recursive: true, force: true});
}
