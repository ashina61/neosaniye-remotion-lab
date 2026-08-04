import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
const force = process.env.FALLBACK_STORY_FORCE === 'true';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
const language = plan.language === 'tr' ? 'tr' : 'en';
const noAiPlan = force || manifest.aiPlan === false || !String(process.env.POLLINATIONS_API_KEY || '').trim();
const specializedTopic = /antibiotic resistance|antimicrobial resistance|antibiyotik direnci|antimikrobiyal direnç/i.test(String(plan.topic || ''));

if (!noAiPlan || specializedTopic) {
  console.log(`Fallback story repair skipped: aiPlan=${!noAiPlan}, specialized=${specializedTopic}`);
  process.exit(0);
}

const EN_STOP = new Set('a an the and or but if then than to of in on at by for from with without into onto over under through during before after is are was were be been being it its this that these those how why what when where who which can could may might will would should do does did done have has had most more less very just one two three first last new old same other another people thing things way ways as about around across their its his her our your'.split(' '));
const TR_STOP = new Set('bir bu şu ve veya ama fakat çünkü için ile de da ki mi mı mu mü nasıl neden ne zaman nerede kim hangi olan olarak daha en çok az sonra önce ise kadar gibi her bazı diğer aynı yeni eski ilk son'.split(' '));
const QUESTION = new Set('how why what when where who which nasıl neden ne niçin kim nerede ne zaman'.split(' '));
const GENERIC = new Set('topic subject detail visual scene system mechanism process object thing things concept main supporting larger heavier different modern early subsequent generation generations includes include typical typically individual individually one more their its stretches stretche suitable konu nesne şey kavram sahne sistem mekanizma süreç'.split(' '));
const PRONOUN_START = /^(he|she|they|it|others|someone|somebody|his|her|their|its|this|that|these|those)\b/i;
const BIOGRAPHY = /\b(born|author|researcher|professor|politician|actor|actress|singer|joined|graduated|career|best-known|american|british|turkish)\b/i;
const MEDIA_TITLE = /\b(film|song|album|novel|episode|video game|television series)\b/i;
const STATISTICS = /\b(as of|percent|percentage|million|billion|trillion|tonnes?|kilometres?|kilometers?|millimetres?|millimeters?|mm|km|gb|exabytes?|\d+(?:\.\d+)?%|\d+\s+in\s+\d+)\b/i;
const HISTORY_MARKERS = /\b(first|began|beginning|century|year|years|operational|constructed|founded|laid in|in 1[0-9]{3}|in 20[0-9]{2}|on \w+ \d{1,2})\b/i;
const FRAGMENT_START = /^(and|or|but|while|although|because|so|then|which|where|whose|such as|for example|others?)\b/i;
const BAD_END = /\b(a|an|the|and|or|but|to|of|in|on|at|by|for|from|with|between|through|which|that|as|is|are|was|were|be|been|being|has|have|had|contains?|contained|used|similar|where|which|suitable|protective)$/i;
const ACTION_WORDS = new Set('use uses used carry carries carried transmit transmits transmitted send sends sent route routes routed connect connects connected contain contains contained convert converts converted amplify amplifies amplified protect protects protected move moves moved travel travels traveled work works worked form forms formed create creates created allow allows allowed provide provides provided flow flows flowed bend bends bent split splits divided divide grows grew develop develops developed lay lays laid coat coats coated store stores stored encode encodes encoded decode decodes decoded reflect reflects reflected orbit orbits feed feeds fed cultivate cultivates cultivated sit sits shield shields'.split(' '));
const CAUSE_WORDS = new Set('because cause causes caused due leads lead led results result allows allow makes make prevents prevent pressure effect effects reason reasons'.split(' '));
const HISTORY_WORDS = new Set('first began beginning later subsequent earlier century year years founded created built constructed became divided split collapsed rose fell'.split(' '));
const SYNONYM_GROUPS = [
  ['undersea','submarine','subsea','seabed','seafloor','oceanic'],
  ['internet','data','network','communications','communication','telecommunication','traffic'],
  ['cable','cables','fiber','fibre','wire','wires'],
  ['carry','carries','carried','transmit','transmits','send','sends','route','routes'],
  ['black','dark'],
  ['light','photon','photons','radiation'],
  ['bend','bends','bent','curve','curves','curved','warp','warps','warped','lens','lensing'],
  ['ant','ants','colony','colonies'],
  ['fungus','fungi','fungal'],
  ['roman','rome'],
  ['empire','imperial'],
  ['split','splits','divided','division','partition'],
];

const clean = (value) => String(value || '')
  .replace(/\[[^\]]*]/g, ' ')
  .replace(/\([^)]{1,80}\)/g, ' ')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const stem = (raw) => {
  let token = String(raw || '').toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')
    .replace(/[^a-z0-9çğıöşü'-]+/giu, '');
  if (language === 'en') {
    if (token.endsWith('ies') && token.length > 4) token = `${token.slice(0, -3)}y`;
    else if (token.endsWith('ing') && token.length > 6) token = token.slice(0, -3);
    else if (token.endsWith('ed') && token.length > 5) token = token.slice(0, -2);
    else if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) token = token.slice(0, -1);
  }
  return token;
};

const rawTokens = (value) => (clean(value).match(/[0-9A-Za-zÇĞİÖŞÜçğıöşü'-]+/g) || []).map(stem).filter(Boolean);
const stop = language === 'tr' ? TR_STOP : EN_STOP;
const contentTokens = (value) => rawTokens(value).filter((token) => token.length >= 3 && !stop.has(token) && !QUESTION.has(token) && !GENERIC.has(token));
const unique = (values) => [...new Set(values.filter(Boolean))];

const synonymGroupFor = (token) => {
  for (const group of SYNONYM_GROUPS) {
    const stems = new Set(group.map(stem));
    if (stems.has(token)) return stems;
  }
  return new Set([token]);
};

const topicTokens = unique(contentTokens(plan.topic));
const topicGroups = topicTokens.map(synonymGroupFor);
const intent = (() => {
  const topic = clean(plan.topic).toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');
  if (plan.category === 'history' || /\b(history|origin|rise|fall|war|empire|first|tarih|köken|savaş|imparatorluk)\b/i.test(topic)) return 'history';
  if (/^(why|neden|niçin)\b/i.test(topic)) return 'cause';
  if (/^(what|ne|kim)\b/i.test(topic)) return 'definition';
  if (/^(how|nasıl)\b/i.test(topic)) return 'mechanism';
  return 'explain';
})();

const groupHitCount = (value) => {
  const set = new Set(rawTokens(value));
  return topicGroups.reduce((sum, group) => sum + ([...group].some((token) => set.has(token)) ? 1 : 0), 0);
};
const directOverlap = (value) => {
  const set = new Set(contentTokens(value));
  return topicTokens.filter((token) => set.has(token)).length;
};

const pageScore = (item) => {
  const title = clean(item.title);
  const excerpt = clean(item.excerpt || item.snippet);
  const titleHits = groupHitCount(title);
  const excerptHits = groupHitCount(excerpt);
  let score = titleHits * 12 + excerptHits * 3 + directOverlap(title) * 5;
  if (titleHits === 0) score -= 18;
  if (BIOGRAPHY.test(excerpt) && titleHits < 2 && !/^(who|kim)\b/i.test(clean(plan.topic))) score -= 28;
  if (MEDIA_TITLE.test(title) && !MEDIA_TITLE.test(clean(plan.topic))) score -= 35;
  if (intent === 'mechanism' && STATISTICS.test(excerpt) && titleHits < 2) score -= 14;
  if (intent === 'mechanism' && HISTORY_MARKERS.test(title) && titleHits < 2) score -= 10;
  return {score, titleHits, excerptHits};
};

const rankedPages = (plan.research || [])
  .map((item, index) => ({...item, index, ...pageScore(item)}))
  .filter((item) => item.score >= 8 && (item.titleHits >= 1 || item.excerptHits >= 2))
  .sort((a, b) => b.score - a.score || a.index - b.index)
  .slice(0, 3);

if (!rankedPages.length) {
  throw new Error(`Fallback story repair failed: no research page is relevant enough to "${plan.topic}".`);
}

const sentenceSplit = (value) => clean(value)
  .split(/(?<=[.!?])\s+/)
  .map((sentence) => sentence.trim())
  .filter(Boolean);

const subjectFor = (title) => {
  const words = clean(title).replace(/\s*\([^)]*\)\s*/g, ' ').split(/\s+/).filter(Boolean);
  return words.slice(0, 5).join(' ');
};

const normalizeFragment = (fragment, subject) => {
  let value = clean(fragment).replace(/^[,;:.!?-]+|[,;:]+$/g, '').trim();
  if (!value) return '';
  value = value
    .replace(/^which\s+/i, `${subject} `)
    .replace(/^where\s+/i, `${subject} `)
    .replace(/^containing\s+/i, `${subject} contains `)
    .replace(/^used to carry\s+/i, `${subject} carries `)
    .replace(/^to carry\s+/i, `${subject} carries `)
    .replace(/^to transmit\s+/i, `${subject} transmits `)
    .replace(/^to send\s+/i, `${subject} sends `)
    .replace(/^providing\s+/i, `${subject} provides `)
    .replace(/^between\s+/i, `${subject} connects `)
    .replace(/^across\s+/i, `${subject} crosses `)
    .replace(/^coated with\s+/i, `${subject} is coated with `)
    .replace(/^contained in\s+/i, `${subject} sits inside `)
    .replace(/^for example\s+/i, '');
  if (FRAGMENT_START.test(value)) return '';
  if (language === 'en' && /^[a-z]/.test(value)) {
    const startsWithPredicate = /^(is|are|was|were|has|have|had|contains?|carries?|transmits?|uses?|provides?|connects?|sits?|becomes?|includes?)\b/i.test(value);
    value = startsWithPredicate ? `${subject} ${value}` : value;
  }
  value = value.charAt(0).toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US') + value.slice(1);
  return value;
};

const sentenceFacts = (sentence, subject) => {
  const base = clean(sentence);
  const facts = [base];
  const addMatch = (pattern, builder) => {
    const match = base.match(pattern);
    if (match) facts.push(...builder(match).filter(Boolean));
  };

  addMatch(/between\s+([^,.]+?)\s+to\s+carry\s+([^,.]+)/i, (match) => [
    `${subject} connects ${match[1]}`,
    `${subject} carries ${match[2]}`,
  ]);
  addMatch(/containing\s+([^,.]+?)\s+that\s+are\s+used\s+to\s+carry\s+([^,.]+)/i, (match) => [
    `${subject} contains ${match[1]}`,
    `${match[1]} carry ${match[2]}`,
  ]);
  addMatch(/([^,.]+?)\s+are\s+(?:typically\s+)?individually\s+coated\s+with\s+([^,.]+?)\s+and\s+contained\s+in\s+([^,.]+)/i, (match) => [
    `${match[1]} are coated with ${match[2]}`,
    `${match[1]} sit inside ${match[3]}`,
  ]);
  addMatch(/(?:modern|current)\s+([^,.]+?)\s+use\s+([^,.]+?)\s+to\s+carry\s+([^,.]+)/i, (match) => [
    `Modern ${match[1]} use ${match[2]}`,
    `Modern ${match[1]} carry ${match[3]}`,
  ]);
  addMatch(/(?:these\s+)?early\s+([^,.]+?)\s+used\s+([^,.]+)/i, (match) => [
    `Early ${match[1]} used ${match[2]}`,
  ]);
  addMatch(/larger\s+and\s+heavier\s+([^,.]+?)\s+are\s+used\s+for\s+([^,.]+)/i, (match) => [
    `Larger and heavier ${match[1]} protect ${match[2]}`,
  ]);

  if (rawTokens(base).length > 16) {
    const split = base.split(/;\s+|,\s+(?:but|while|although|whereas|which|where|and|so)\s+|,\s+(?=(?:to|between|across|containing|coated|contained|providing|used)\b)/i);
    facts.push(...split);
    const relationParts = base.split(/\b(?=between|to carry|to transmit|to send|across|containing|coated with|contained in|providing|used to carry)\b/i);
    facts.push(...relationParts);
  }
  return unique(facts.map((part) => normalizeFragment(part, subject)).filter(Boolean));
};

const hasVerb = (value) => {
  const set = new Set(rawTokens(value));
  if ([...set].some((token) => ACTION_WORDS.has(token) || CAUSE_WORDS.has(token) || HISTORY_WORDS.has(token))) return true;
  return /\b(is|are|was|were|has|have|had|can|becomes?|became|includes?|means?|consists?)\b/i.test(value);
};

const compressFact = (value, maxWords = 14) => {
  let text = clean(value)
    .replace(/\b(?:typically|individually)\b/gi, '')
    .replace(/,\s*(?:such as|for example)\b.*$/i, '')
    .replace(/\s+(?:which|where)\b.*$/i, '')
    .replace(/\s+suitable\s+for\b.*$/i, '')
    .replace(/[;:]+.*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  let words = text.split(/\s+/).filter(Boolean);
  if (words.length > maxWords) {
    words = words.slice(0, maxWords);
    while (words.length > 5 && BAD_END.test(words[words.length - 1])) words.pop();
  }
  text = words.join(' ').replace(/[,.!?;:]+$/g, '').trim();
  return text ? `${text}.` : '';
};

const candidateRows = [];
for (const page of rankedPages) {
  const subject = subjectFor(page.title);
  const sentences = sentenceSplit(page.excerpt || page.snippet);
  sentences.forEach((sentence, sentenceIndex) => {
    sentenceFacts(sentence, subject).forEach((fact, fragmentIndex) => {
      const compact = compressFact(fact);
      const count = rawTokens(compact).length;
      if (count < 6 || count > 16 || !hasVerb(compact)) return;
      if (PRONOUN_START.test(compact) && !/^(who|kim)\b/i.test(clean(plan.topic))) return;
      if (BIOGRAPHY.test(compact) && page.titleHits < 2 && !/^(who|kim)\b/i.test(clean(plan.topic))) return;
      if (intent === 'mechanism' && (STATISTICS.test(compact) || /\b\d{3,4}\b/.test(compact))) return;
      if (intent === 'mechanism' && HISTORY_MARKERS.test(compact) && !/\b(early|modern|current|later|subsequent)\b/i.test(compact)) return;
      const hits = groupHitCount(compact);
      if (hits === 0 && page.titleHits < 2) return;
      const titleOverlap = directOverlap(page.title);
      let score = page.score * 0.35 + hits * 8 + titleOverlap * 2;
      const compactTokens = new Set(rawTokens(compact));
      if (intent === 'mechanism' && [...compactTokens].some((token) => ACTION_WORDS.has(token))) score += 8;
      if (intent === 'cause' && [...compactTokens].some((token) => CAUSE_WORDS.has(token))) score += 8;
      if (intent === 'history' && ([...compactTokens].some((token) => HISTORY_WORDS.has(token)) || HISTORY_MARKERS.test(compact))) score += 7;
      if (intent !== 'history' && HISTORY_MARKERS.test(compact)) score -= 6;
      if (intent === 'mechanism' && /\bsubsequent generations\b/i.test(compact)) score -= 12;
      if (fragmentIndex === 0 && sentenceIndex === 0) score += 5;
      candidateRows.push({
        text: compact,
        sourceTitle: page.title,
        pageIndex: page.index,
        sentenceIndex,
        fragmentIndex,
        score,
        hits,
      });
    });
  });
}

candidateRows.sort((a, b) => b.score - a.score || a.pageIndex - b.pageIndex || a.sentenceIndex - b.sentenceIndex || a.fragmentIndex - b.fragmentIndex);

const stageFor = (text) => {
  if (/\b(is|are)\s+(?:a|an|the)\b|\bmeans\b|\brefers to\b|\bconsists of\b/i.test(text)) return 'definition';
  if (/\b(seabed|seafloor|between|connect|across|route|network|station|ocean|sea|laid on|runs? under)\b/i.test(text)) return 'location';
  if (/\b(protect|shield|shallow|deep|environment|armou?r|heavier)\b/i.test(text)) return 'protection';
  if (/\b(modern|current|early|older|later|subsequent|before|after|different)\b/i.test(text)) return 'comparison';
  if (/\b(provide|application|high-speed|long-distance|use case)\b/i.test(text)) return 'application';
  if (/\b(contain|inside|coated|layer|core|tube|fiber|fibre|part|section|assembly)\b/i.test(text)) return 'structure';
  if (/\b(carry|transmit|send|signal|light|data|traffic|flow|pulse|encode|decode)\b/i.test(text)) return 'transfer';
  if (/\b(because|due|cause|lead|result|allow|prevent|pressure|reason)\b/i.test(text)) return 'cause';
  return 'other';
};

const topicAnchorTokens = new Set(topicGroups.flatMap((group) => [...group]));
const semanticTokensFor = (text) => contentTokens(text).filter((token) => (
  !topicAnchorTokens.has(token)
  && !new Set(['modern','current','early','older','later','subsequent','different','larger','heavier','first','one','more']).has(token)
));

const selected = [];
const selectedTokenSets = [];
const perSource = new Map();
const addCandidate = (row) => {
  const key = contentTokens(row.text).join(' ');
  if (!key) return false;
  const semantic = new Set(semanticTokensFor(row.text));
  const all = new Set(contentTokens(row.text));
  const duplicate = selectedTokenSets.some(({semantic: previousSemantic, all: previousAll}) => {
    const left = semantic.size ? semantic : all;
    const right = previousSemantic.size ? previousSemantic : previousAll;
    const overlap = [...left].filter((token) => right.has(token)).length;
    const ratio = overlap / Math.max(1, Math.min(left.size, right.size));
    return ratio >= 0.68;
  });
  if (duplicate) return false;
  const sourceCount = perSource.get(row.sourceTitle) || 0;
  const maxFromSource = Math.max(3, Math.ceil(Math.min(plan.scenes.length, 10) * 0.6));
  if (sourceCount >= maxFromSource) return false;
  selected.push({...row, stage: stageFor(row.text)});
  selectedTokenSets.push({semantic, all});
  perSource.set(row.sourceTitle, sourceCount + 1);
  return true;
};

if (intent === 'mechanism') {
  const quotas = [
    ['definition', 1],
    ['location', 2],
    ['comparison', 2],
    ['structure', 3],
    ['transfer', 3],
    ['protection', 2],
    ['application', 1],
    ['other', 1],
  ];
  for (const [stage, quota] of quotas) {
    let count = 0;
    for (const row of candidateRows) {
      if (stageFor(row.text) !== stage) continue;
      if (addCandidate(row)) count += 1;
      if (count >= quota || selected.length >= Math.min(plan.scenes.length, 12)) break;
    }
  }
} else if (intent === 'cause') {
  for (const stage of ['definition', 'cause', 'other', 'comparison', 'location', 'structure', 'transfer']) {
    for (const row of candidateRows) {
      if (stageFor(row.text) === stage) addCandidate(row);
      if (selected.length >= Math.min(plan.scenes.length, 12)) break;
    }
    if (selected.length >= Math.min(plan.scenes.length, 12)) break;
  }
} else {
  for (const row of candidateRows) {
    addCandidate(row);
    if (selected.length >= Math.min(plan.scenes.length, 12)) break;
  }
}

const minimumScenes = Math.min(plan.scenes.length, intent === 'history' ? 8 : 7);
if (selected.length < minimumScenes) {
  for (const row of candidateRows) {
    addCandidate(row);
    if (selected.length >= minimumScenes) break;
  }
}
if (selected.length < minimumScenes) {
  throw new Error(
    `Fallback story repair failed: only ${selected.length} grounded facts for "${plan.topic}", minimum ${minimumScenes}.`,
  );
}

const stageOrder = new Map([
  ['definition', 0],
  ['location', 1],
  ['comparison', 2],
  ['structure', 3],
  ['transfer', 4],
  ['protection', 5],
  ['cause', 6],
  ['application', 7],
  ['other', 8],
]);
if (intent === 'mechanism') {
  selected.sort((a, b) => (stageOrder.get(a.stage) ?? 9) - (stageOrder.get(b.stage) ?? 9) || b.score - a.score);
} else if (intent === 'history') {
  selected.sort((a, b) => a.pageIndex - b.pageIndex || a.sentenceIndex - b.sentenceIndex || a.fragmentIndex - b.fragmentIndex);
} else {
  selected.sort((a, b) => b.score - a.score || a.pageIndex - b.pageIndex || a.sentenceIndex - b.sentenceIndex);
}

const desiredCount = Math.min(plan.scenes.length, Math.max(minimumScenes, Math.min(10, selected.length)));
const facts = selected.slice(0, desiredCount);

const verbLike = new Set([...ACTION_WORDS, ...CAUSE_WORDS, ...HISTORY_WORDS, 'is','are','was','were','has','have','had','can','typically','individually']);
const conceptPhrases = (fact, sourceTitle) => {
  const words = clean(fact).replace(/[.!?]+$/g, '').split(/\s+/).filter(Boolean);
  const chunks = [];
  let current = [];
  const flush = () => {
    if (!current.length) return;
    const phrase = current.join(' ').replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü0-9]+|[^A-Za-zÇĞİÖŞÜçğıöşü0-9]+$/g, '');
    current = [];
    if (!phrase || phrase.length > 36) return;
    const phraseTokens = contentTokens(phrase);
    if (!phraseTokens.length || phraseTokens.every((token) => GENERIC.has(token))) return;
    if (phraseTokens.length === 1 && GENERIC.has(phraseTokens[0])) return;
    chunks.push(phrase);
  };
  for (const word of words) {
    const token = stem(word);
    const boundary = !token
      || stop.has(token)
      || verbLike.has(token)
      || /^(to|and|or|but|which|that|between|across|inside|with|from|into|then)$/i.test(word);
    if (boundary) {
      flush();
      continue;
    }
    current.push(word.replace(/[,.!?;:]+$/g, ''));
    if (current.length >= 4) flush();
  }
  flush();
  if (/telephone,?\s+internet\s+and\s+private\s+data\s+traffic/i.test(fact)) {
    chunks.splice(0, chunks.length, 'telephone traffic', 'internet traffic', 'private data traffic');
  }

  const candidates = [...chunks, subjectFor(sourceTitle)]
    .map((value) => clean(value))
    .filter(Boolean)
    .sort((a, b) => contentTokens(b).length - contentTokens(a).length || a.length - b.length);

  const concepts = [];
  const conceptSets = [];
  for (const candidate of candidates) {
    const set = new Set(contentTokens(candidate));
    if (!set.size) continue;
    const redundant = conceptSets.some((existing) => {
      const overlap = [...set].filter((token) => existing.has(token)).length;
      return overlap === set.size || overlap === existing.size;
    });
    if (redundant) continue;
    concepts.push(candidate);
    conceptSets.push(set);
    if (concepts.length >= 5) break;
  }

  if (concepts.length < 2) {
    for (const token of contentTokens(fact)) {
      if (token.length < 5 || GENERIC.has(token) || concepts.some((value) => contentTokens(value).includes(token))) continue;
      concepts.push(token);
      if (concepts.length >= 5) break;
    }
  }
  return concepts.slice(0, 5);
};

const prepared = facts.map((fact) => {
  let concepts = conceptPhrases(fact.text, fact.sourceTitle);
  if (concepts.length < 2) {
    concepts = unique([...concepts, ...contentTokens(fact.text).filter((token) => token.length >= 5).slice(0, 4)]).slice(0, 5);
  }
  if (concepts.length < 2) {
    throw new Error(`Fallback story repair failed: weak visual concepts for "${fact.text}"`);
  }
  return {...fact, concepts};
});

const modeFor = (text, index) => {
  if (index === 0) return {visualKind: 'object-exploded', semanticAction: 'reveal'};
  if (/\b(before|after|older|modern|early|later|larger|smaller|more|less|versus|different)\b/i.test(text)) return {visualKind: 'comparison', semanticAction: 'compare'};
  if (/\b(connect|network|route|across|between|link|traffic|station)\b/i.test(text)) return {visualKind: 'world-network', semanticAction: 'connect'};
  if (intent === 'history' || HISTORY_MARKERS.test(text)) return {visualKind: 'timeline', semanticAction: 'trace'};
  if (/\b(inside|contain|layer|core|tube|fiber|part|section|structure)\b/i.test(text)) return {visualKind: 'object-exploded', semanticAction: 'assemble'};
  return {visualKind: 'mechanism', semanticAction: 'transform'};
};

const totalDuration = Number(plan.duration || 42);
const hookDuration = Math.min(3.4, Math.max(2.8, totalDuration * 0.075));
const finalDuration = Math.min(4.4, Math.max(3.7, totalDuration * 0.1));
const middleCount = Math.max(1, prepared.length - 2);
const middleDuration = (totalDuration - hookDuration - finalDuration) / middleCount;
let cursor = 0;
const original = plan.scenes || [];

plan.scenes = prepared.map((fact, index) => {
  const base = original[index % original.length] || {};
  const duration = index === 0 ? hookDuration : index === prepared.length - 1 ? finalDuration : middleDuration;
  const mode = modeFor(fact.text, index);
  const title = fact.concepts.slice(0, 2).join(' ');
  const props = fact.concepts.map((value) => value.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US').slice(0, 32));
  const scene = {
    ...base,
    id: index + 1,
    start: Number(cursor.toFixed(3)),
    duration: Number(duration.toFixed(3)),
    voiceStart: index === 0 ? 0.06 : 0.12,
    voiceEndPadding: index === prepared.length - 1 ? 0.5 : 0.28,
    title: title.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US').slice(0, 52),
    kicker: fact.sourceTitle.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US').slice(0, 56),
    voiceLine: fact.text,
    visualKind: mode.visualKind,
    semanticAction: mode.semanticAction,
    props,
    beats: fact.concepts.slice(0, 3).map((label, beatIndex) => ({
      at: [0.16, 0.44, 0.72][beatIndex],
      label: label.slice(0, 42),
      action: ['reveal', 'connect', 'highlight'][beatIndex],
    })),
    heroVisual: fact.concepts[0],
    primaryMotif: fact.concepts[0],
    secondaryMotif: fact.concepts[1],
    supportVisuals: fact.concepts.slice(1),
    mustShow: fact.concepts,
    subjectTokens: unique([...contentTokens(fact.text), ...contentTokens(fact.sourceTitle)]).slice(0, 16),
    conceptTags: unique([...contentTokens(fact.text), ...contentTokens(fact.sourceTitle)]).slice(0, 12),
    visualConcepts: fact.concepts,
    visualSignature: `fallback-story-v1:${index + 1}:${fact.concepts.map((value) => contentTokens(value).join('-')).join('|')}`.slice(0, 180),
    imagePrompt: `Vertical 9:16 editorial documentary collage about ${plan.topic}. Show ${fact.concepts.join(', ')}. Illustrate only this sourced fact: ${fact.text} No unrelated objects, no readable text, no logo.`,
    sourceNote: fact.sourceTitle.slice(0, 160),
    contentRepairSource: 'ranked-wikipedia-fallback-v1',
  };
  cursor += duration;
  return scene;
});

plan.scenes[plan.scenes.length - 1].duration = Number((totalDuration - plan.scenes[plan.scenes.length - 1].start).toFixed(3));
plan.narration = plan.scenes.map((scene) => scene.voiceLine).join(' ').replace(/\s+/g, ' ').trim();
plan.hook = plan.scenes[0].voiceLine;
plan.title = plan.topic;
plan.storyRepair = {
  version: 1,
  mode: 'ranked-extractive-fallback',
  intent,
  failClosed: true,
  selectedSources: rankedPages.map((page) => ({
    title: page.title,
    score: Number(page.score.toFixed(2)),
    titleHits: page.titleHits,
    excerptHits: page.excerptHits,
  })),
  rejectedSourceCount: Math.max(0, (plan.research || []).length - rankedPages.length),
  candidateCount: candidateRows.length,
  selectedFactCount: prepared.length,
  minimumFactCount: minimumScenes,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `Fallback story repaired: topic="${plan.topic}", intent=${intent}, sources=${rankedPages.map((page) => page.title).join(' | ')}, scenes=${plan.scenes.length}`,
);
