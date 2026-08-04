import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';

const runner = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const groundingScript = resolve('scripts/auto-factory/v3-topic-grounding.ts');

const buildScenes = (lines) => lines.map((voiceLine, index) => ({
  id: index + 1,
  start: index * 4.6,
  duration: 4.6,
  title: voiceLine.split(' ').slice(0, 4).join(' ').toUpperCase(),
  kicker: '',
  voiceLine,
  heroVisual: 'main subject',
  supportVisuals: ['supporting detail'],
  layout: 'hero',
  visualKind: 'object-exploded',
  visualSignature: `fixture-${index + 1}`,
  alignmentScore: 0,
}));

const fixtures = [
  {
    name: 'lightning-random-nature',
    expectedWorld: 'atmospheric-electricity',
    plan: {
      language: 'en',
      duration: 46,
      topic: 'How lightning forms',
      title: 'How lightning forms',
      hook: 'Lightning begins when charge separates inside a storm cloud.',
      category: 'nature',
      scenes: buildScenes([
        'Lightning begins when collisions separate electric charge inside a thundercloud.',
        'Small ice particles carry positive charge toward the upper cloud layer.',
        'Heavier particles leave a negative charge near the cloud base.',
        'The growing imbalance creates a strong electric field toward the ground.',
        'A stepped leader moves downward through a temporary ionized air path.',
        'Upward streamers rise from tall objects as the leader approaches.',
        'The connected path releases a bright return stroke through the channel.',
        'Branching discharges spread while the main current reaches the ground.',
        'Rapid heating expands the surrounding air into a thunder shock wave.',
        'The electrical discharge fades after the cloud and ground exchange charge.',
      ]),
    },
  },
  {
    name: 'unknown-random-topic',
    expectedWorld: 'general-explainer',
    plan: {
      language: 'en',
      duration: 46,
      topic: 'How glass frogs hide their blood',
      title: 'How glass frogs hide their blood',
      hook: 'A glass frog changes where red blood cells are stored while resting.',
      category: 'any',
      scenes: buildScenes([
        'A resting glass frog becomes more transparent against a green leaf.',
        'Its circulating red blood cells normally absorb visible light.',
        'During sleep many of those cells move away from peripheral blood vessels.',
        'The liver stores the concentrated cells inside reflective tissue.',
        'Clearer vessels allow more background light to pass through the body.',
        'The effect reduces the dark outline seen by predators below the leaf.',
        'The frog still keeps enough circulation to support resting organs.',
        'When activity returns the stored cells move back into circulation.',
        'Researchers compare awake and sleeping frogs with optical measurements.',
        'Temporary blood storage therefore improves camouflage without removing blood.',
      ]),
    },
  },
];

for (const fixture of fixtures) {
  const directory = await mkdtemp(join(tmpdir(), 'neosaniye-grounding-'));
  const planPath = join(directory, 'plan.json');
  try {
    await writeFile(planPath, `${JSON.stringify(fixture.plan, null, 2)}\n`, 'utf8');
    execFileSync(runner, ['tsx', groundingScript], {
      cwd: process.cwd(),
      env: {...process.env, PLAN_PATH: planPath},
      stdio: 'pipe',
    });
    const result = JSON.parse(await readFile(planPath, 'utf8'));
    const motifs = result.scenes.map((scene) => scene.primaryMotif);
    const kinds = result.scenes.map((scene) => scene.visualKind);
    const consecutive = motifs.filter((motif, index) => index > 0 && motif === motifs[index - 1]);
    const placeholderHeroes = result.scenes.filter((scene) => /^(main subject|supporting detail)$/i.test(String(scene.heroVisual || '').trim()));

    if (result.topicProfile?.visualWorld !== fixture.expectedWorld) {
      throw new Error(`${fixture.name}: expected world ${fixture.expectedWorld}, received ${result.topicProfile?.visualWorld}`);
    }
    if (new Set(motifs).size < 4) throw new Error(`${fixture.name}: only ${new Set(motifs).size} unique motifs`);
    if (new Set(kinds).size < 6) throw new Error(`${fixture.name}: only ${new Set(kinds).size} visual kinds`);
    if (consecutive.length) throw new Error(`${fixture.name}: consecutive motif repetition detected`);
    if (placeholderHeroes.length) throw new Error(`${fixture.name}: placeholder hero survived grounding`);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
}

console.log('Topic grounding diversity regression: PASS');
