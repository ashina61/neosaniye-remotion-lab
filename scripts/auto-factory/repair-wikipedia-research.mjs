import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const EN_STOP = new Set('a an the and or but to of in on at by for from with without into over under through during is are was were be been being it its this that these those how why what when where who which can could may might will would should do does did done have has had actually really so very'.split(' '));
const TR_STOP = new Set('bir bu şu ve veya ama fakat için ile de da ki mi mı mu mü nasıl neden ne zaman nerede kim hangi olan olarak daha en çok az sonra önce ise kadar gibi her bazı diğer aynı'.split(' '));
const GENERIC_SUBJECTS = new Set('country countries people world thing things event events process system history story reason reasons'.split(' '));
const GLOBAL_NEGATIVE = /\b(film|television|tv series|album|song|novel|video game|franchise|superhero|fictional character|actor|actress|singer)\b/i;
const BIOGRAPHY = /\b(born|career|professor|author|actor|actress|singer|politician|personal life)\b/i;
const CATEGORY_HINTS = {
  history: 'history ancient historical trade route empire civilization archaeology',
  science: 'science scientific mechanism biology physics chemistry',
  economy: 'economics economy finance monetary trade',
  geopolitics: 'geopolitics international relations strategy geography',
  technology: 'technology engineering computing mechanism',
  mystery: 'history investigation mystery evidence',
  nature: 'biology ecology nature animal environment',
};
const CATEGORY_POSITIVE = {
  history: /\b(history|historical|ancient|century|trade route|caravan|merchant|empire|dynasty|archaeolog|civilization)\b/i,
  science: /\b(science|scientific|biology|physics|chemistry|cell|molecule|theory|experiment)\b/i,
  economy: /\b(econom|finance|monetary|bank|currency|trade|market|inflation|debt)\b/i,
  geopolitics: /\b(country|state|border|treaty|military|strateg|international|territor|government)\b/i,
  technology: /\b(technology|engineering|computer|network|device|system|digital|electronic)\b/i,
  mystery: /\b(mystery|disappearance|investigation|evidence|unexplained|incident|case)\b/i,
  nature: /\b(animal|plant|biology|ecology|species|climate|ocean|forest|natural)\b/i,
};
const CATEGORY_NEGATIVE = {
  history: /\b(online black market|darknet|dark web|bitcoin|cryptocurrency|cybercriminal|illegal drug marketplace|superhero|film franchise)\b/i,
  science: /\b(film franchise|album|song|fictional character)\b/i,
  economy: /\b(film franchise|fictional character|video game)\b/i,
  geopolitics: /\b(film franchise|fictional character|album|song)\b/i,
  technology: /\b(film franchise|fictional character|album|song)\b/i,
  mystery: /\b(film franchise|album|song|video game)\b/i,
  nature: /\b(film franchise|fictional character|album|song)\b/i,
};

const normalize = (value, language = 'en') => String(value || '')
  .toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/giu, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const tokens = (value, language = 'en') => {
  const stop = language === 'tr' ? TR_STOP : EN_STOP;
  return normalize(value, language).split(' ').filter((token) => token.length >= 2 && !stop.has(token));
};

export const deriveResearchSubject = (topic, language = 'en') => {
  let value = String(topic || '').replace(/[?!.,:;]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (language === 'tr') {
    value = value
      .replace(/^(nasıl|neden|niçin|ne|kim|nerede|ne zaman)\s+/i, '')
      .replace(/^(ne oldu|ne yaşandı|neye sebep oldu)\s+/i, '')
      .replace(/\b(aslında|gerçekte)\b/gi, ' ')
      .replace(/\b(çalışır|çalıştı|gelişir|gelişti|oluşur|oluştu|başladı|değiştirdi|etkiler|yükselir|düşer)\b.*$/i, '');
  } else {
    value = value
      .replace(/^(how|why|what|when|where|who|which)\s+/i, '')
      .replace(/^(happened\s+(?:at|to)|caused)\s+/i, '')
      .replace(/\b(actually|really)\b/gi, ' ')
      .replace(/\b(?:works?|worked|develops?|developed|forms?|formed|begins?|began|happens?|happened|changes?|changed|reshapes?|reshaped|expands?|expanded|bends?|trains?|copies?|calculates?|generates?|travels?|stores?|communicates?|affects?|reduces?|raises?|rises?|runs?|split|was built|were built|was created|were created|became|is disputed|cannot be predicted|default(?:s|ed)?|means?)\b.*$/i, '');
  }
  value = value.replace(/^(the|a|an)\s+/i, '').replace(/\s+/g, ' ').trim();
  const subjectTokens = tokens(value, language);
  if (!subjectTokens.length || subjectTokens.every((token) => GENERIC_SUBJECTS.has(token))) {
    const fallback = String(topic || '')
      .replace(/^(how|why|what|when|where|who|which|nasıl|neden|niçin|ne|kim|nerede)\s+/i, '')
      .replace(/\b(actually|really|aslında|gerçekte)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return fallback || String(topic || '').trim();
  }
  return value || String(topic || '').trim();
};

export const scoreResearchItem = (item, context) => {
  const {topic, subject, category, language = 'en'} = context;
  const title = String(item?.title || '');
  const excerpt = String(item?.excerpt || item?.snippet || '');
  const normalizedTitle = normalize(title, language);
  const normalizedSubject = normalize(subject, language);
  const subjectSet = new Set(tokens(subject, language));
  const topicSet = new Set(tokens(topic, language));
  const titleSet = new Set(tokens(title, language));
  const excerptSet = new Set(tokens(excerpt, language));
  const titleHits = [...subjectSet].filter((token) => titleSet.has(token)).length;
  const excerptHits = [...subjectSet].filter((token) => excerptSet.has(token)).length;
  const topicHits = [...topicSet].filter((token) => titleSet.has(token) || excerptSet.has(token)).length;
  const overlapRatio = titleHits / Math.max(1, subjectSet.size);
  if (!titleHits && !excerptHits) return -1000;

  let score = titleHits * 28 + excerptHits * 7 + topicHits * 3 + overlapRatio * 45;
  if (normalizedTitle === normalizedSubject) score += 140;
  if (normalizedTitle.startsWith(`${normalizedSubject} `) && !title.includes('(')) score += 35;
  const combined = `${title} ${excerpt}`;
  if (CATEGORY_POSITIVE[category]?.test(combined)) score += 18;
  if (CATEGORY_NEGATIVE[category]?.test(combined)) score -= 140;
  if (GLOBAL_NEGATIVE.test(combined) && !GLOBAL_NEGATIVE.test(topic)) score -= 70;
  if (BIOGRAPHY.test(excerpt) && !/^(who|kim)\b/i.test(String(topic || ''))) score -= 35;
  if (/\([^)]*(marketplace|film|song|album|franchise|video game)[^)]*\)/i.test(title)) score -= 100;
  return score;
};

export const rankResearchItems = (items, context, limit = 5) => {
  const seen = new Set();
  return (items || [])
    .map((item, index) => ({...item, _index: index, _score: scoreResearchItem(item, context)}))
    .filter((item) => item.title && item.excerpt && item._score >= 12)
    .sort((a, b) => b._score - a._score || a._index - b._index)
    .filter((item) => {
      const key = normalize(item.title, context.language);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({_index, _score, ...item}) => ({...item, researchScore: Number(_score.toFixed(2))}));
};

const fetchJson = async (url) => {
  const response = await fetch(url, {headers: {'user-agent': 'NeoSaniye-AutoFactory/7.0'}});
  if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
  return response.json();
};

const fetchWikipediaCandidates = async ({topic, subject, category, language}) => {
  const endpoint = language === 'tr' ? 'https://tr.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  const hint = CATEGORY_HINTS[category] || '';
  const queries = [
    `intitle:"${subject}" ${hint}`.trim(),
    `"${subject}" ${hint}`.trim(),
    `${topic} ${hint}`.trim(),
  ];
  const titles = [subject];
  for (const query of queries) {
    const url = `${endpoint}?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=1&format=json&origin=*&srlimit=8`;
    const result = await fetchJson(url);
    titles.push(...(result?.query?.search || []).map((item) => String(item.title || '')));
  }
  const uniqueTitles = [...new Set(titles.map((title) => title.trim()).filter(Boolean))].slice(0, 24);
  const extractUrl = `${endpoint}?action=query&prop=extracts&explaintext=1&exintro=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(uniqueTitles.join('|'))}`;
  const extracts = await fetchJson(extractUrl);
  return Object.values(extracts?.query?.pages || {}).map((page) => ({
    title: String(page?.title || ''),
    url: `${language === 'tr' ? 'https://tr.wikipedia.org/wiki/' : 'https://en.wikipedia.org/wiki/'}${encodeURIComponent(String(page?.title || '').replace(/ /g, '_'))}`,
    excerpt: String(page?.extract || '').replace(/\s+/g, ' ').slice(0, 2400),
  })).filter((item) => item.title && item.excerpt);
};

export const repairWikipediaResearch = async ({planPath, manifestPath}) => {
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  let manifest = {};
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
  if ((manifest.researchMode || process.env.RESEARCH_MODE || 'wikipedia') !== 'wikipedia') {
    console.log('Wikipedia research disambiguation skipped: research mode is not wikipedia.');
    return {changed: false, plan, manifest};
  }

  const language = plan.language === 'tr' ? 'tr' : 'en';
  const subject = deriveResearchSubject(plan.topic, language);
  const context = {topic: plan.topic, subject, category: plan.category, language};
  const candidates = await fetchWikipediaCandidates(context);
  const ranked = rankResearchItems(candidates, context, 5);
  if (!ranked.length) {
    console.warn(`Wikipedia research disambiguation found no safe replacement for "${plan.topic}"; existing research preserved.`);
    return {changed: false, plan, manifest};
  }

  const oldTitles = (plan.research || []).map((item) => normalize(item.title, language));
  const newTitles = ranked.map((item) => normalize(item.title, language));
  const changed = oldTitles.join('|') !== newTitles.join('|');
  plan.research = ranked.map(({researchScore, ...item}) => item);
  plan.researchDisambiguation = {
    version: 1,
    subject,
    category: plan.category,
    changed,
    selected: ranked.map((item) => ({title: item.title, score: item.researchScore})),
  };
  manifest.researchCount = plan.research.length;
  manifest.researchSubject = subject;
  manifest.researchDisambiguated = changed;
  if (changed && manifest.aiPlan === true) {
    manifest.aiPlan = false;
    manifest.aiPlanInvalidatedByResearch = true;
  }
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  console.log(`Wikipedia research disambiguated: subject="${subject}", sources=${ranked.map((item) => item.title).join(' | ')}`);
  return {changed, plan, manifest};
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
  const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
  await repairWikipediaResearch({planPath, manifestPath});
}
