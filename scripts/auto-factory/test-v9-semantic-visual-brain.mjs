import assert from 'node:assert/strict';
import {writeFile, readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const script = new URL('./build-semantic-visual-blueprint-v9.mjs', import.meta.url).pathname;

const fixtures = [
  {
    topic: 'How the Silk Road connected China and Europe',
    category: 'history',
    lines: [
      'The Silk Road was a network of routes linking East Asia with Europe.',
      'Caravans left Chinese cities carrying silk and other goods.',
      'They crossed deserts and mountain passes in stages.',
      'Oasis cities became relay points for merchants and animals.',
      'Goods changed hands many times instead of traveling with one merchant.',
      'Paper, technologies and ideas moved alongside luxury goods.',
      'Different empires taxed and protected sections of the route.',
      'Sea routes later joined the older overland network.',
      'Wars and political changes could redirect the flow.',
      'Its real power came from connecting distant societies.',
    ],
    expect: ['geographic-route', 'market-exchange', 'human-reconstruction'],
  },
  {
    topic: 'How antibiotic resistance develops',
    category: 'science',
    lines: [
      'A bacterial population contains small biological differences.',
      'An antibiotic kills the bacteria that are sensitive to it.',
      'A few bacteria may survive because of resistance traits.',
      'Those survivors reproduce after the treatment removes competitors.',
      'Resistance genes can also move between bacteria.',
      'The resistant population becomes a larger share of the colony.',
      'Repeated exposure increases the selection pressure.',
      'Resistant strains can spread between people and environments.',
      'Some infections then become harder to treat.',
      'The process is evolution under strong human-made pressure.',
    ],
    expect: ['microscopic-process', 'mechanism-cutaway', 'network-flow'],
  },
  {
    topic: 'Why Taiwan became the center of global chip production',
    category: 'geopolitics',
    lines: [
      'Taiwan built a dense semiconductor manufacturing ecosystem.',
      'Specialized factories focus on producing chips designed by other companies.',
      'Clean rooms and lithography machines create microscopic circuit patterns.',
      'Engineers, suppliers and research institutions cluster near the fabs.',
      'Large investment keeps each generation of equipment competitive.',
      'Global electronics companies depend on this concentrated capacity.',
      'Ships and aircraft connect the island to international supply chains.',
      'Disruption around Taiwan would affect factories far beyond the island.',
      'Other countries are trying to build alternative production capacity.',
      'Taiwan remains central because the whole ecosystem is difficult to copy.',
    ],
    expect: ['industrial-process', 'mechanism-cutaway', 'network-flow'],
  },
];

const directory = await mkdtemp(join(tmpdir(), 'neosaniye-v9-'));
try {
  for (const fixture of fixtures) {
    const planPath = join(directory, `${fixture.category}.json`);
    const scenes = fixture.lines.map((voiceLine, index) => ({
      id: index + 1,
      title: voiceLine.split(' ').slice(0, 5).join(' '),
      voiceLine,
      sceneGoal: `Illustrate only this spoken claim: ${voiceLine}`,
      mustShow: [],
      supportVisuals: ['topic evidence'],
      visualContract: {
        version: 8,
        subject: fixture.topic,
        motifs: [{label: fixture.topic, kind: 'hero-object'}],
        visualDirection: {subject: fixture.topic, environment: `${fixture.category}-world`},
      },
      motionContract: {version: 8, cameraMove: index % 2 ? 'pan-right' : 'push-in'},
    }));
    await writeFile(planPath, JSON.stringify({
      topic: fixture.topic,
      title: fixture.topic,
      category: fixture.category,
      language: 'en',
      duration: 46,
      seed: 151,
      scenes,
      research: [],
    }, null, 2));

    const result = spawnSync(process.execPath, [script], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PLAN_PATH: planPath,
        GEMINI_API_KEY: '',
        CLOUDFLARE_ACCOUNT_ID: '',
        CLOUDFLARE_API_TOKEN: '',
        POLLINATIONS_API_KEY: '',
      },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    const built = JSON.parse(await readFile(planPath, 'utf8'));
    assert.equal(built.v9.version, 9);
    assert.equal(built.v9.aiProvider, 'deterministic');
    assert.equal(built.scenes.length, 10);
    assert.ok(
      new Set(built.scenes.map((scene) => scene.v9Blueprint.sceneFamily)).size >= 4,
      `${fixture.topic}: ${built.scenes.map((scene) => scene.v9Blueprint.sceneFamily).join(',')}`,
    );
    assert.ok(built.scenes.every((scene) => scene.v9Blueprint.worldEntities.length >= 2));
    assert.ok(built.scenes.every((scene) => scene.v9Blueprint.spatialRelations.length >= 3));
    assert.ok(built.scenes.every((scene) => !/generic floating cards/i.test(scene.imagePrompt)));
    for (const family of fixture.expect) {
      assert.ok(
        built.scenes.some((scene) => scene.v9Blueprint.sceneFamily === family),
        `${fixture.topic} did not produce ${family}`,
      );
    }
    const mapScenes = built.scenes.filter((scene) => scene.v9Blueprint.sceneFamily === 'geographic-route');
    assert.ok(mapScenes.length <= 2 || fixture.category === 'history');
    for (const scene of mapScenes) {
      assert.match(scene.v9Blueprint.visualStatement, /origin|destination|route|geographic|named/i);
    }
  }
  console.log('V9 semantic visual brain regression: PASS');
} finally {
  await rm(directory, {recursive: true, force: true});
}
