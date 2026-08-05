import assert from 'node:assert/strict';
import {writeFile, readFile, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {classifyV9Scene} from './v9-semantic-classifier.mjs';

const lockScript = new URL('./lock-v9-spoken-families.mjs', import.meta.url).pathname;

const fixtures = [
  {
    topic: 'How the Silk Road connected China and Europe',
    category: 'history',
    lines: [
      'The Silk Road was not one road, but a chain of routes linking China with Central Asia, the Middle East and Europe.',
      'Merchants moved in caravans because deserts, mountains and long distances made the journey dangerous.',
      'Oasis cities such as Samarkand connected one group of traders to the next.',
      'Silk, spices, glass and precious metals moved through markets instead of traveling with one merchant the whole way.',
      'Mountain passes, deserts and water sources decided where caravans could travel.',
      'Paper making, religions, stories and scientific knowledge crossed the same network.',
      'States protected some sections, taxed others and fought over the profitable corridors.',
      'Ships connected Asian ports with the land routes and expanded the trading network.',
      'War, disease or a blocked passage could break one link and redirect trade through another region.',
      'The Silk Road connected distant societies centuries before modern global supply chains.',
    ],
    families: ['geographic-route', 'human-reconstruction', 'human-reconstruction', 'market-exchange', 'environmental-reconstruction', 'archival-evidence', 'hazard-operation', 'human-reconstruction', 'hazard-operation', 'consequence-world'],
    archetypes: ['route-overview', 'caravan-journey', 'oasis-relay-city', 'market-handoff', 'terrain-constraint', 'knowledge-transfer', 'state-control-conflict', 'maritime-air-logistics', 'route-or-system-disruption', 'system-consequence'],
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
    families: ['microscopic-process', 'microscopic-process', 'microscopic-process', 'microscopic-process', 'mechanism-cutaway', 'microscopic-process', 'microscopic-process', 'network-flow', 'hazard-operation', 'consequence-world'],
    archetypes: ['micro-population-variation', 'antibiotic-attack', 'resistant-survivors', 'survivor-reproduction', 'gene-transfer-cutaway', 'selection-shift', 'selection-pressure', 'host-environment-spread', 'treatment-failure', 'system-consequence'],
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
    families: ['industrial-process', 'industrial-process', 'mechanism-cutaway', 'human-reconstruction', 'industrial-process', 'network-flow', 'human-reconstruction', 'hazard-operation', 'comparison-stage', 'consequence-world'],
    archetypes: ['industrial-ecosystem', 'fab-production', 'lithography-cutaway', 'human-expertise-cluster', 'capital-equipment-cycle', 'global-dependency-network', 'maritime-air-logistics', 'route-or-system-disruption', 'capacity-comparison', 'system-consequence'],
  },
];

const directory = await mkdtemp(join(tmpdir(), 'neosaniye-v9-'));
try {
  for (const fixture of fixtures) {
    const scenes = fixture.lines.map((voiceLine, index) => ({
      id: index + 1,
      title: '',
      voiceLine,
      sceneGoal: '',
      mustShow: [],
      heroVisual: voiceLine.split(' ').slice(0, 6).join(' '),
      visualContract: {visualDirection: {environment: `${fixture.category}-world`}},
      v9Blueprint: {
        worldEntities: [fixture.topic, 'topic-specific evidence'],
        negativeRules: ['no generic dashboard', 'no decorative geometry', 'no readable text', 'no logo'],
        layerPlan: {foreground: ['subject'], midground: ['action'], background: ['environment']},
        motionIntent: {camera: 'push-in'},
        assetPlan: {searchQueries: ['topic reference', 'scene reference']},
      },
    }));

    const direct = scenes.map((scene, index) => classifyV9Scene({scene, index, total: scenes.length}));
    assert.deepEqual(direct.map((item) => item.family), fixture.families, `${fixture.topic}: pure family classification`);
    assert.deepEqual(direct.map((item) => item.archetype), fixture.archetypes, `${fixture.topic}: pure archetype classification`);

    const planPath = join(directory, `${fixture.category}.json`);
    await writeFile(planPath, JSON.stringify({
      topic: fixture.topic,
      category: fixture.category,
      scenes,
      v9: {version: 9, renderer: 'semantic-visual-documentary-v9', brain: 'semantic-visual-blueprint-v9', semanticBlueprintReady: true},
    }, null, 2));

    const result = spawnSync(process.execPath, [lockScript], {
      cwd: process.cwd(),
      env: {...process.env, PLAN_PATH: planPath},
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);

    const built = JSON.parse(await readFile(planPath, 'utf8'));
    const blueprints = built.scenes.map((scene) => scene.v9Blueprint);
    assert.deepEqual(blueprints.map((item) => item.sceneFamily), fixture.families, `${fixture.topic}: locked families`);
    assert.deepEqual(blueprints.map((item) => item.sceneArchetype), fixture.archetypes, `${fixture.topic}: locked archetypes`);
    assert.equal(built.v9.spokenFamilyLock, 'semantic-classifier-v1');
    assert.equal(built.v9.archetypeCount, new Set(fixture.archetypes).size);
    assert.ok(blueprints.every((item) => item.assetPlan.prompt.includes(`Locked scene archetype: ${item.sceneArchetype}`)));
    assert.ok(blueprints.every((item) => item.spatialRelations.length >= 3));
    assert.ok(blueprints.every((item) => item.motionIntent.grammar));

    for (let index = 1; index < fixture.archetypes.length; index += 1) {
      assert.notEqual(fixture.archetypes[index], fixture.archetypes[index - 1], `${fixture.topic}: repeated adjacent archetype`);
    }
  }

  console.log('V9 semantic classifier and lock integration: PASS (30/30 scenes)');
} finally {
  await rm(directory, {recursive: true, force: true});
}
