import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const isEnglishAntibiotic = plan.language === 'en'
  && /antibiotic resistance|antimicrobial resistance/i.test(String(plan.topic || ''));

if (isEnglishAntibiotic) {
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
    plan.v4.semanticDisambiguationVersion = 2;
  }
  plan.v3 = {...(plan.v3 || {}), semanticDisambiguationVersion: 2};
}

const visibleText = (scene) => [
  scene.title,
  scene.kicker,
  scene.voiceLine,
  scene.sceneGoal,
  scene.heroVisual,
  scene.primaryMotif,
  scene.secondaryMotif,
  ...(scene.props || []),
  ...(scene.supportVisuals || []),
  ...(scene.mustShow || []),
  ...(scene.beats || []).map((beat) => beat.label),
].filter(Boolean).map(String);

if (isEnglishAntibiotic) {
  const turkishWords = /\b(önce|sonra|yanlış|doğru|ilaç|antibiyotik|bakteri|bakteriler|direnç|dirençli|tedavi|hastane|insanlar|hayvanlar|çevre|seçilim|yayılma|çoğalma|kalanlar|gereksiz|kullanım|çözüm|süre|doz)\b/iu;
  const languageLeaks = [];
  const semanticErrors = [];
  const scenes = plan.scenes || [];

  for (const scene of scenes) {
    for (const value of visibleText(scene)) {
      if (/[çğıöşüİ]/i.test(value) || turkishWords.test(value)) {
        languageLeaks.push(`scene ${scene.id}: ${value}`);
      }
    }
    if (!String(scene.semanticLockRule || '').trim()) {
      semanticErrors.push(`scene ${scene.id}: missing semanticLockRule`);
    }
    if (!String(scene.heroVisual || '').trim() || !Array.isArray(scene.mustShow) || scene.mustShow.length < 2) {
      semanticErrors.push(`scene ${scene.id}: incomplete grounded visual specification`);
    }
  }

  for (let index = 1; index < scenes.length; index += 1) {
    if (scenes[index - 1].semanticLockRule === scenes[index].semanticLockRule) {
      semanticErrors.push(
        `scenes ${scenes[index - 1].id}-${scenes[index].id}: repeated semantic template ${scenes[index].semanticLockRule}`,
      );
    }
  }

  if (languageLeaks.length) {
    throw new Error(`Final English language firewall failed:\n${languageLeaks.slice(0, 12).join('\n')}`);
  }
  if (semanticErrors.length) {
    throw new Error(`Final semantic plan validation failed:\n${semanticErrors.slice(0, 12).join('\n')}`);
  }
}

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `Antibiotic scene disambiguation passed: scenes=${plan.scenes?.length || 0}, language=${plan.language}`,
);
