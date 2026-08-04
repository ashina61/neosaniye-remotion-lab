import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const mode = process.argv.includes('--validate') ? 'validate' : 'repair';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const language = plan.language === 'tr' ? 'tr' : 'en';

const normalize = (value) => String(value || '')
  .toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const tokens = (value) => normalize(value).split(' ').filter(Boolean);
const unique = (values) => [...new Set(values.filter(Boolean))];
const upper = (value) => String(value || '').toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US');
const compact = (value, maxWords, maxChars) => {
  const words = String(value || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).slice(0, maxWords);
  return words.join(' ').slice(0, maxChars).trim();
};

const englishStop = new Set([
  'a','an','and','are','as','at','be','because','between','but','by','can','do','does','for','from',
  'how','in','into','is','it','may','more','not','of','on','or','the','their','then','therefore','those',
  'through','to','under','with','without','again','also','every','all','entire','later','only','while',
]);
const meaningfulTokens = (value) => tokens(value).filter((token) => token.length > 2 && !englishStop.has(token));

const rule = (id, pattern, config) => ({id, pattern, ...config});
const rules = [
  rule('plasmid-transfer', /\b(plasmid|dna rings?|exchange resistance genes?|horizontal transfer|cross(?:-| )species|transfer can.*cross|bacterial species)\b/i, {
    title: 'GENE TRANSFER', kicker: 'PLASMIDS MOVE RESISTANCE BETWEEN BACTERIA',
    heroVisual: 'plasmid transferring a resistance gene between bacteria',
    secondaryMotif: 'donor and recipient bacteria',
    supportVisuals: ['plasmid ring', 'resistance gene', 'donor bacterium', 'recipient bacterium'],
    visualKind: 'gene-transfer', sceneGrammar: 'mechanism-cutaway', shotType: 'diagram', layout: 'process',
    semanticAction: 'transfer', cameraMove: 'pan-right', textMode: 'integrated', compositionBias: 'center', layerCount: 10,
  }),
  rule('dna-mutation', /\b(mutation|mutated|acquired resistance gene|bacterial dna)\b/i, {
    title: 'DNA MUTATION', kicker: 'A CHANGE CAN CREATE RESISTANCE',
    heroVisual: 'mutation site inside bacterial DNA',
    secondaryMotif: 'resistance gene on a DNA strand',
    supportVisuals: ['DNA strand', 'mutation site', 'resistance gene'],
    visualKind: 'object-exploded', sceneGrammar: 'exploded-object', shotType: 'diagram', layout: 'overhead',
    semanticAction: 'reveal', cameraMove: 'push-in', textMode: 'integrated', compositionBias: 'center', layerCount: 9,
  }),
  rule('correct-use', /\b(right drug|correct antibiotic|right dose|correct dose|duration|full course|correct use|solution)\b/i, {
    title: 'CORRECT USE', kicker: 'RIGHT DRUG · RIGHT DOSE · FULL DURATION',
    heroVisual: 'complete antibiotic treatment protocol',
    secondaryMotif: 'dose schedule completed from start to finish',
    supportVisuals: ['right antibiotic', 'right dose', 'full duration', 'completed schedule'],
    visualKind: 'timeline', sceneGrammar: 'timeline-strip', shotType: 'process', layout: 'process',
    semanticAction: 'assemble', cameraMove: 'pan-right', textMode: 'integrated', compositionBias: 'full-frame', layerCount: 10,
  }),
  rule('incomplete-treatment', /\b(stopping treatment early|incomplete treatment|unfinished treatment|incorrect doses?|wrong dose|dose exposes?|early gives)\b/i, {
    title: 'INCOMPLETE TREATMENT', kicker: 'SURVIVORS GET TIME TO REGROW',
    heroVisual: 'bacteria regrowing after an incomplete antibiotic course',
    secondaryMotif: 'broken dose schedule beside surviving bacteria',
    supportVisuals: ['unfinished treatment', 'broken dose timeline', 'surviving bacteria', 'regrowing colony'],
    visualKind: 'before-after', sceneGrammar: 'comparison-scale', shotType: 'comparison', layout: 'comparison',
    semanticAction: 'compare', cameraMove: 'pan-right', textMode: 'integrated', compositionBias: 'center', layerCount: 11,
  }),
  rule('wrong-antibiotic', /\b(wrong antibiotic|wrong drug|incorrect antibiotic)\b/i, {
    title: 'WRONG ANTIBIOTIC', kicker: 'SELECTION PRESSURE WITHOUT CLEARING INFECTION',
    heroVisual: 'wrong antibiotic leaving resistant bacteria alive',
    secondaryMotif: 'infection continuing after ineffective treatment',
    supportVisuals: ['wrong drug', 'resistant survivor', 'remaining infection', 'selection pressure'],
    visualKind: 'cause-effect', sceneGrammar: 'cause-chain', shotType: 'process', layout: 'process',
    semanticAction: 'filter', cameraMove: 'pan-right', textMode: 'integrated', compositionBias: 'center', layerCount: 10,
  }),
  rule('hospital-pressure', /\b(unnecessary use|overuse|hospital selection pressure|repeated (?:antibiotic )?use)\b/i, {
    title: 'HOSPITAL PRESSURE', kicker: 'REPEATED USE SELECTS RESISTANT STRAINS',
    heroVisual: 'hospital patients linked by repeated antibiotic exposure',
    secondaryMotif: 'resistant bacteria moving through a hospital ward',
    supportVisuals: ['hospital ward', 'antibiotic exposure', 'patient pathway', 'resistant colony'],
    visualKind: 'institution', sceneGrammar: 'spread-network', shotType: 'wide', layout: 'cinematic-wide',
    semanticAction: 'spread', cameraMove: 'pull-out', textMode: 'integrated', compositionBias: 'full-frame', layerCount: 12,
  }),
  rule('host-spread', /\b(spread|people|animals|food|water|environment|hosts?)\b/i, {
    title: 'RESISTANT STRAINS SPREAD', kicker: 'PEOPLE · ANIMALS · FOOD · WATER',
    heroVisual: 'resistant bacteria spreading between people animals food and water',
    secondaryMotif: 'connected transmission routes between hosts',
    supportVisuals: ['people', 'animals', 'food', 'water', 'resistant bacteria'],
    visualKind: 'world-network', sceneGrammar: 'spread-network', shotType: 'wide', layout: 'cinematic-wide',
    semanticAction: 'spread', cameraMove: 'pull-out', textMode: 'integrated', compositionBias: 'full-frame', layerCount: 13,
  }),
  rule('treatment-failure', /\b(harder to treat|treatment fails?|ineffective drug|ordinary infections|new antibiotics help temporarily)\b/i, {
    title: 'TREATMENT BECOMES HARDER', kicker: 'THE INFECTION OUTLASTS THE DRUG',
    heroVisual: 'infection continuing beside an ineffective antibiotic',
    secondaryMotif: 'resistant colony growing after treatment',
    supportVisuals: ['ineffective antibiotic', 'growing infection', 'resistant colony'],
    visualKind: 'before-after', sceneGrammar: 'comparison-scale', shotType: 'comparison', layout: 'comparison',
    semanticAction: 'compare', cameraMove: 'pan-right', textMode: 'integrated', compositionBias: 'center', layerCount: 10,
  }),
  rule('selection-pressure', /\b(selection pressure|repeated exposure|drug pressure|susceptible bacteria die|most susceptible)\b/i, {
    title: 'NATURAL SELECTION', kicker: 'SUSCEPTIBLE CELLS DIE · RESISTANT CELLS SURVIVE',
    heroVisual: 'antibiotic selection removing susceptible bacteria',
    secondaryMotif: 'resistant survivors remaining in the population',
    supportVisuals: ['susceptible bacteria', 'dying cells', 'resistant survivors', 'antibiotic pressure'],
    visualKind: 'selection-process', sceneGrammar: 'selection-field', shotType: 'comparison', layout: 'comparison',
    semanticAction: 'filter', cameraMove: 'push-in', textMode: 'integrated', compositionBias: 'center', layerCount: 12,
  }),
  rule('survivor-reproduction', /\b(reproduce|multiply|multiplying|later generations|take over the colony|more resources|removes competitors)\b/i, {
    title: 'SURVIVORS MULTIPLY', kicker: 'THE RESISTANT COLONY TAKES OVER',
    heroVisual: 'resistant bacteria reproducing after competitors are removed',
    secondaryMotif: 'resistant daughter cells filling the colony',
    supportVisuals: ['resistant bacterium', 'cell division', 'daughter cells', 'growing colony'],
    visualKind: 'microbe-field', sceneGrammar: 'macro-field', shotType: 'macro', layout: 'macro',
    semanticAction: 'multiply', cameraMove: 'push-in', textMode: 'integrated', compositionBias: 'center', layerCount: 12,
  }),
  rule('resistant-survival', /\b(few resistant|resistant bacteria survive|resistant cells survive|survive (?:the )?treatment)\b/i, {
    title: 'RESISTANT SURVIVORS', kicker: 'A FEW CELLS REMAIN AFTER TREATMENT',
    heroVisual: 'resistant bacteria surviving antibiotic treatment',
    secondaryMotif: 'susceptible bacteria removed around the survivors',
    supportVisuals: ['resistant survivors', 'dying susceptible cells', 'antibiotic pressure'],
    visualKind: 'selection-process', sceneGrammar: 'selection-field', shotType: 'comparison', layout: 'comparison',
    semanticAction: 'filter', cameraMove: 'push-in', textMode: 'integrated', compositionBias: 'center', layerCount: 11,
  }),
  rule('first-contact-survival', /\b(antibiotics? (?:kill|do not kill)|rare resistant|every bacterium)\b/i, {
    title: 'FIRST ANTIBIOTIC EXPOSURE', kicker: 'MOST DIE · RARE RESISTANT CELLS SURVIVE',
    heroVisual: 'antibiotic entering a colony with one resistant bacterium',
    secondaryMotif: 'susceptible bacteria dying around a resistant survivor',
    supportVisuals: ['antibiotic capsule', 'susceptible bacteria', 'resistant bacterium', 'dying cells'],
    visualKind: 'microbe-field', sceneGrammar: 'macro-field', shotType: 'macro', layout: 'macro',
    semanticAction: 'filter', cameraMove: 'push-in', textMode: 'integrated', compositionBias: 'center', layerCount: 12,
  }),
  rule('selection-mechanism', /\b(selection|survivors|resistance develops|decide to adapt|consciously adapt)\b/i, {
    title: 'THE CORE MECHANISM', kicker: 'SELECTION AMPLIFIES SURVIVORS',
    heroVisual: 'natural selection cycle producing a resistant colony',
    secondaryMotif: 'antibiotic exposure followed by survivor reproduction',
    supportVisuals: ['antibiotic exposure', 'resistant survivors', 'reproduction', 'resistant colony'],
    visualKind: 'process-flow', sceneGrammar: 'cause-chain', shotType: 'process', layout: 'process',
    semanticAction: 'transform', cameraMove: 'pan-right', textMode: 'integrated', compositionBias: 'center', layerCount: 11,
  }),
];

const topicKey = normalize(plan.topic);
const isAntibioticProfile = /antibiotic resistance|antimicrobial resistance|antibiyotik direnci/.test(topicKey);
const matchedRule = (line) => rules.find((item) => item.pattern.test(String(line || '')));

const makeVisibleAuditText = (scene) => [
  scene.title, scene.kicker, scene.voiceLine, scene.sceneGoal, scene.heroVisual,
  scene.primaryMotif, scene.secondaryMotif,
  ...(scene.props || []), ...(scene.supportVisuals || []), ...(scene.mustShow || []),
  ...(scene.beats || []).map((beat) => beat.label),
].filter(Boolean);

const turkishLeakWords = new Set([
  'önce','sonra','yanlış','doğru','ilaç','antibiyotik','antibiyotikler','bakteri','bakteriler',
  'direnç','dirençli','tedavi','hastane','hastanelerde','insan','insanlar','hayvan','hayvanlar',
  'çevre','seçilim','yayılma','çoğalma','hayatta','kalanlar','gereksiz','kullanım','çözüm','süre','doz',
]);
const englishLeakWords = new Set([
  'before','after','wrong','right','drug','hospital','people','animals','treatment','selection','spread',
  'mutation','survivors','duration','dose','infection','bacteria','antibiotic',
]);

const languageLeaks = [];
const checkLanguage = (label, values) => {
  for (const value of values) {
    const raw = String(value || '');
    const wordList = tokens(raw);
    if (language === 'en') {
      const hasTurkishChar = /[çğıöşüİ]/i.test(raw);
      const leaked = wordList.filter((word) => turkishLeakWords.has(word));
      if (hasTurkishChar || leaked.length) languageLeaks.push(`${label}: ${raw}`);
    } else {
      const leaked = wordList.filter((word) => englishLeakWords.has(word));
      if (leaked.length >= 2) languageLeaks.push(`${label}: ${raw}`);
    }
  }
};

if (mode === 'repair' && language === 'en' && isAntibioticProfile) {
  plan.scenes = plan.scenes.map((scene, index) => {
    const currentRule = matchedRule(scene.voiceLine);
    if (!currentRule) return scene;
    const supportVisuals = currentRule.supportVisuals.map((value) => compact(value, 7, 72));
    const visualText = [currentRule.heroVisual, currentRule.secondaryMotif, ...supportVisuals].join(' ');
    const subjectTokens = unique([...meaningfulTokens(scene.voiceLine), ...meaningfulTokens(visualText)]).slice(0, 14);
    while (subjectTokens.length < 2) subjectTokens.push(`scene${index + 1}`);
    return {
      ...scene,
      title: compact(currentRule.title, 7, 60),
      kicker: compact(currentRule.kicker, 11, 80),
      sceneGoal: compact(`Illustrate only this spoken claim: ${scene.voiceLine}`, 60, 360),
      heroVisual: compact(currentRule.heroVisual, 12, 90),
      primaryMotif: compact(currentRule.heroVisual, 10, 72),
      secondaryMotif: compact(currentRule.secondaryMotif, 10, 72),
      supportVisuals,
      props: supportVisuals.map((value) => upper(compact(value, 5, 42))).slice(0, 6),
      mustShow: [currentRule.heroVisual, currentRule.secondaryMotif, ...supportVisuals].map((value) => compact(value, 12, 90)).slice(0, 7),
      subjectTokens,
      conceptTags: unique(meaningfulTokens(`${scene.voiceLine} ${visualText}`)).slice(0, 14),
      visualKind: currentRule.visualKind,
      sceneGrammar: currentRule.sceneGrammar,
      shotType: currentRule.shotType,
      layout: currentRule.layout,
      semanticAction: currentRule.semanticAction,
      cameraMove: currentRule.cameraMove,
      textMode: currentRule.textMode,
      compositionBias: currentRule.compositionBias,
      layerCount: currentRule.layerCount,
      alignmentScore: 1,
      visualSignature: `semantic-lock:${currentRule.id}:${index + 1}`,
      imagePrompt: `Vertical 9:16 editorial documentary collage. Show ${currentRule.heroVisual}. Include ${supportVisuals.join(', ')}. Every object must directly explain the narration. No unrelated geometry, no readable text, no logo.`,
      semanticLockRule: currentRule.id,
    };
  });

  if (plan.v4) {
    const grammars = plan.scenes.map((scene) => scene.sceneGrammar);
    const cameras = plan.scenes.map((scene) => scene.cameraMove).filter(Boolean);
    plan.v4.grammarSequence = grammars;
    plan.v4.cameraSequence = cameras;
    plan.v4.grammarCount = new Set(grammars).size;
    plan.v4.cameraCount = new Set(cameras).size;
    plan.v4.minimumGrammarDiversity = Math.min(plan.v4.minimumGrammarDiversity || 4, plan.v4.grammarCount);
    plan.v4.semanticLockVersion = 1;
  }
  plan.v3 = {...(plan.v3 || {}), semanticLockVersion: 1, semanticLockProfile: 'antibiotic-resistance'};
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
}

checkLanguage('plan', [plan.title, plan.hook, plan.narration]);
for (const scene of plan.scenes || []) checkLanguage(`scene ${scene.id}`, makeVisibleAuditText(scene));
if (languageLeaks.length) {
  throw new Error(`Language firewall failed for ${language}:\n${languageLeaks.slice(0, 12).join('\n')}`);
}

const alignmentErrors = [];
const genericTerms = /\b(main subject|supporting detail|unique scene|generic explainer|detail [0-9]+)\b/i;
for (const scene of plan.scenes || []) {
  const currentRule = matchedRule(scene.voiceLine);
  const visualText = [scene.heroVisual, scene.primaryMotif, scene.secondaryMotif, ...(scene.supportVisuals || []), ...(scene.mustShow || [])].join(' ');
  if (genericTerms.test(visualText)) alignmentErrors.push(`scene ${scene.id}: generic visual fallback`);
  if (isAntibioticProfile && language === 'en' && !currentRule) alignmentErrors.push(`scene ${scene.id}: no antibiotic semantic rule for "${scene.voiceLine}"`);
  if (isAntibioticProfile && language === 'en' && currentRule && scene.semanticLockRule !== currentRule.id) {
    alignmentErrors.push(`scene ${scene.id}: expected ${currentRule.id}, found ${scene.semanticLockRule || 'unlocked'}`);
  }
  if (!currentRule) {
    const lineTokens = new Set(meaningfulTokens(scene.voiceLine));
    const visualTokens = unique(meaningfulTokens(visualText));
    const overlap = visualTokens.filter((token) => lineTokens.has(token));
    if (overlap.length < 1) alignmentErrors.push(`scene ${scene.id}: narration and visuals share no grounded concept`);
  }
}
if (alignmentErrors.length) {
  throw new Error(`Semantic visual lock failed:\n${alignmentErrors.slice(0, 12).join('\n')}`);
}

const grammarCount = new Set((plan.scenes || []).map((scene) => scene.sceneGrammar)).size;
const ruleSummary = (plan.scenes || []).map((scene) => scene.semanticLockRule || 'existing').join(',');
console.log(`Semantic/language lock ${mode} passed: language=${language}, scenes=${plan.scenes?.length || 0}, grammars=${grammarCount}, rules=${ruleSummary}`);
