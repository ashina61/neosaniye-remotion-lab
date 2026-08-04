import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {rankResearchItems} from './repair-wikipedia-research.mjs';

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const normalize = (value) => clean(value).toLowerCase();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const deriveDepthSubject = (topic, language = 'en') => {
  let value = clean(topic).replace(/[?!.,:;]+/g, ' ');
  if (language === 'tr') {
    value = value
      .replace(/^(nasıl|neden|niçin|ne|kim|nerede|ne zaman)\s+/i, '')
      .replace(/\b(aslında|gerçekte)\b/gi, ' ')
      .replace(/\b(taşır|taşıyor|iletiyor|gönderir|çalışır|gelişir|oluşur|başlar|değiştirir|etkiler|yükselir|düşer|hesaplar|üretir|depolar)\b.*$/i, '');
  } else {
    value = value
      .replace(/^(how|why|what|when|where|who|which)\s+/i, '')
      .replace(/\b(actually|really)\b/gi, ' ')
      .replace(/\b(?:carry|carries|carried|carrying|transmit|transmits|transmitted|send|sends|sent|work|works|worked|develop|develops|developed|form|forms|formed|begin|begins|began|change|changes|changed|reshape|reshapes|reshaped|expand|expands|expanded|bend|bends|train|trains|copy|copies|calculate|calculates|generate|generates|travel|travels|store|stores|communicate|communicates|affect|affects|reduce|reduces|raise|raises|rise|rises|run|runs|split|default|defaults|mean|means)\b.*$/i, '');
  }
  return value.replace(/^(the|a|an)\s+/i, '').replace(/\s+/g, ' ').trim() || clean(topic);
};

export const canonicalResearchSeeds = (subject, topic, category) => {
  const text = normalize(`${subject} ${topic}`);
  const seeds = [subject];
  if (/\b(undersea|submarine|subsea)\b/.test(text) && /\bcables?\b/.test(text)) {
    seeds.push('Submarine communications cable', 'Fiber-optic cable', 'Optical fiber', 'Cable landing point', 'Transatlantic telegraph cable');
  }
  if (/\bantibiotic resistance\b|\bantimicrobial resistance\b/.test(text)) {
    seeds.push('Antimicrobial resistance', 'Antibiotic misuse', 'Horizontal gene transfer', 'Plasmid');
  }
  if (/\bsilk road\b/.test(text)) {
    seeds.push('Silk Road', 'Silk Road transmission of Buddhism', 'Eurasian Steppe Route', 'Maritime Silk Road');
  }
  if (/\bblack holes?\b/.test(text)) {
    seeds.push('Black hole', 'Gravitational time dilation', 'Event horizon', 'Accretion disk');
  }
  const categorySeeds = {
    history: [`${subject} history`, `${subject} trade routes`, `${subject} primary sources`],
    science: [`${subject} mechanism`, `${subject} biology`, `${subject} scientific explanation`],
    technology: [`${subject} engineering`, `${subject} components`, `${subject} infrastructure`],
    nature: [`${subject} ecology`, `${subject} behavior`, `${subject} habitat`],
    economy: [`${subject} economics`, `${subject} mechanism`, `${subject} institutions`],
    geopolitics: [`${subject} geography`, `${subject} strategy`, `${subject} international relations`],
    mystery: [`${subject} evidence`, `${subject} investigation`, `${subject} history`],
  };
  seeds.push(...(categorySeeds[category] || [`${subject} explanation`]));
  return [...new Set(seeds.map(clean).filter(Boolean))].slice(0, 12);
};

const fetchJson = async (url, label = 'request') => {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, {headers: {'user-agent': 'NeoSaniye-AutoFactory/8.0'}});
    if (response.ok) return response.json();
    lastStatus = response.status;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 2) break;
    await sleep(700 * (2 ** attempt));
  }
  throw new Error(`Wikipedia HTTP ${lastStatus} during ${label}`);
};

const fetchDepthCandidates = async ({subject, topic, category, language}) => {
  const endpoint = language === 'tr' ? 'https://tr.wikipedia.org/w/api.php' : 'https://en.wikipedia.org/w/api.php';
  const seeds = canonicalResearchSeeds(subject, topic, category);
  const titles = [...seeds];
  const searchQueries = [...new Set([subject, `${subject} ${category}`].map(clean).filter(Boolean))].slice(0, 2);
  for (const query of searchQueries) {
    const searchUrl = `${endpoint}?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=1&format=json&origin=*&srlimit=8`;
    const result = await fetchJson(searchUrl, `search:${query}`);
    titles.push(...(result?.query?.search || []).map((item) => String(item.title || '')));
  }
  const uniqueTitles = [...new Set(titles.map(clean).filter(Boolean))].slice(0, 28);
  const extractUrl = `${endpoint}?action=query&prop=extracts&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(uniqueTitles.join('|'))}`;
  const extracts = await fetchJson(extractUrl, 'batch-extract');
  return Object.values(extracts?.query?.pages || {}).map((page) => ({
    title: String(page?.title || ''),
    url: `${language === 'tr' ? 'https://tr.wikipedia.org/wiki/' : 'https://en.wikipedia.org/wiki/'}${encodeURIComponent(String(page?.title || '').replace(/ /g, '_'))}`,
    excerpt: String(page?.extract || '').replace(/\s+/g, ' ').slice(0, 5200),
  })).filter((item) => item.title && item.excerpt);
};

const writeState = async (planPath, manifestPath, plan, manifest) => {
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
};

export const repairResearchDepth = async ({planPath, manifestPath}) => {
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  let manifest = {};
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch {}
  const researchMode = manifest.researchMode || process.env.RESEARCH_MODE || 'wikipedia';
  if (researchMode !== 'wikipedia') {
    console.log('Research depth repair skipped: research mode is not wikipedia.');
    return {changed: false, plan, manifest};
  }
  const language = plan.language === 'tr' ? 'tr' : 'en';
  const subject = deriveDepthSubject(plan.topic, language);
  const context = {topic: plan.topic, subject, category: plan.category, language};
  const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
  const curatedReady = scenes.length >= 10 && scenes.every((scene) => scene.contentRepairSource === 'curated-topic-script');
  if (curatedReady) {
    const existing = plan.research || [];
    const combinedLength = existing.reduce((sum, item) => sum + clean(item.excerpt).length, 0);
    plan.researchDepth = {
      version: 1,
      mode: 'curated-story-network-bypass',
      subject,
      sourceCount: existing.length,
      excerptCharacters: combinedLength,
      selected: existing.map((item) => ({title: item.title, score: null})),
      failClosed: true,
    };
    manifest.researchDepthSubject = subject;
    manifest.researchDepthCharacters = combinedLength;
    manifest.researchDepthBypassedForCuratedStory = true;
    await writeState(planPath, manifestPath, plan, manifest);
    console.log(`Research depth network bypass: trusted curated story already has ${scenes.length} scenes for "${subject}".`);
    return {changed: false, plan, manifest};
  }

  const existingRanked = rankResearchItems(plan.research || [], context, 7);
  const existingLength = existingRanked.reduce((sum, item) => sum + clean(item.excerpt).length, 0);
  let fetched = [];
  let networkError = null;
  try {
    fetched = await fetchDepthCandidates(context);
  } catch (error) {
    networkError = error;
    if (existingRanked.length < 3 || existingLength < 4200) throw error;
    console.warn(`Research depth network degraded safely: ${error.message}; using existing ranked sources.`);
  }

  const merged = [...(plan.research || []), ...fetched];
  const ranked = rankResearchItems(merged, context, 7);
  const combinedLength = ranked.reduce((sum, item) => sum + clean(item.excerpt).length, 0);
  if (ranked.length < 3 || combinedLength < 4200) {
    throw new Error(`Research depth repair failed for "${plan.topic}": sources=${ranked.length}, excerptChars=${combinedLength}.`);
  }
  const oldTitles = (plan.research || []).map((item) => normalize(item.title)).join('|');
  const newTitles = ranked.map((item) => normalize(item.title)).join('|');
  const changed = oldTitles !== newTitles;
  plan.research = ranked.map(({researchScore, ...item}) => item);
  plan.researchDepth = {
    version: 1,
    mode: networkError ? 'existing-ranked-fallback' : 'batched-wikipedia-depth',
    subject,
    sourceCount: ranked.length,
    excerptCharacters: combinedLength,
    selected: ranked.map((item) => ({title: item.title, score: item.researchScore})),
    failClosed: true,
    networkDegraded: Boolean(networkError),
  };
  manifest.researchCount = ranked.length;
  manifest.researchDepthSubject = subject;
  manifest.researchDepthCharacters = combinedLength;
  if (changed && manifest.aiPlan === true) {
    manifest.aiPlan = false;
    manifest.aiPlanInvalidatedByResearchDepth = true;
  }
  await writeState(planPath, manifestPath, plan, manifest);
  console.log(`Research depth repaired: subject="${subject}", sources=${ranked.map((item) => item.title).join(' | ')}, excerptChars=${combinedLength}`);
  return {changed, plan, manifest};
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
  const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
  await repairResearchDepth({planPath, manifestPath});
}
