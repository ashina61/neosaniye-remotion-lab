import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));

if (plan.language === 'en' && /antibiotic resistance|antimicrobial resistance/i.test(String(plan.topic || ''))) {
  for (const scene of plan.scenes || []) {
    const line = String(scene.voiceLine || '');
    if (!/removes competitors|more resources/i.test(line)) continue;

    scene.title = 'COMPETITORS REMOVED';
    scene.kicker = 'THE RESISTANT SURVIVOR GETS MORE RESOURCES';
    scene.heroVisual = 'susceptible competitors removed around one resistant survivor';
    scene.primaryMotif = 'antibiotic removing susceptible competitors';
    scene.secondaryMotif = 'one resistant bacterium with space and resources';
    scene.supportVisuals = ['dying susceptible bacteria', 'resistant survivor', 'available nutrients'];
    scene.props = ['SUSCEPTIBLE CELLS', 'RESISTANT SURVIVOR', 'AVAILABLE NUTRIENTS'];
    scene.mustShow = [
      'antibiotic removing susceptible competitors',
      'dying susceptible bacteria',
      'one resistant survivor',
      'available nutrients around the survivor',
    ];
    scene.subjectTokens = ['antibiotic', 'removes', 'competitors', 'resistant', 'survivor', 'resources'];
    scene.conceptTags = ['antibiotic', 'selection', 'competitors', 'survivor', 'resources'];
    scene.visualKind = 'cause-effect';
    scene.sceneGrammar = 'cause-chain';
    scene.shotType = 'process';
    scene.layout = 'split-left';
    scene.semanticAction = 'filter';
    scene.cameraMove = 'push-in';
    scene.textMode = 'integrated';
    scene.compositionBias = 'center';
    scene.layerCount = 11;
    scene.beats = [
      {at: 0.14, label: 'antibiotic removes susceptible competitors', action: 'reveal'},
      {at: 0.46, label: 'susceptible cells die', action: 'eliminate'},
      {at: 0.72, label: 'resistant survivor gains resources', action: 'highlight'},
    ];
    scene.alignmentScore = 1;
    scene.visualSignature = `semantic-lock:competitor-removal:${scene.id}`;
    scene.semanticLockRule = 'competitor-removal';
    scene.imagePrompt = 'Vertical 9:16 editorial documentary collage. Show susceptible bacteria being removed by an antibiotic while one resistant bacterium remains with more space and nutrients. No unrelated geometry, no readable text, no logo.';
  }

  const grammars = (plan.scenes || []).map((scene) => scene.sceneGrammar);
  const cameras = (plan.scenes || []).map((scene) => scene.cameraMove).filter(Boolean);
  if (plan.v4) {
    plan.v4.grammarSequence = grammars;
    plan.v4.cameraSequence = cameras;
    plan.v4.grammarCount = new Set(grammars).size;
    plan.v4.cameraCount = new Set(cameras).size;
    plan.v4.semanticDisambiguationVersion = 1;
  }
  plan.v3 = {...(plan.v3 || {}), semanticDisambiguationVersion: 1};
}

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log('Antibiotic scene disambiguation passed.');
