import {readFile, writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
const trustedSources = new Set(['curated-topic-script', 'ranked-complete-research']);
const rawWords = (value) => String(value || '').match(/[0-9A-Za-zÇĞİÖŞÜçğıöşü'-]+/g) || [];
const STOP = new Set('a an the and or but if then than to of in on at by for from with without into onto over under through during before after is are was were be been being it its this that these those how why what when where who which can could may might will would should do does did done have has had as about around across their his her our your one two three first last new old same other another people thing things way ways bir bu şu ve veya ama fakat çünkü için ile de da ki mi mı mu mü nasıl neden ne zaman nerede kim hangi olan olarak daha en çok az sonra önce ise kadar gibi her bazı diğer aynı yeni eski ilk son'.split(' '));
const GENERIC = new Set('topic subject scene system process mechanism result detail information data thing things explains explanation main supporting konu sahne sistem süreç mekanizma sonuç bilgi'.split(' '));
const SYNONYMS = [
  ['undersea', 'submarine', 'subsea', 'seabed', 'seafloor'],
  ['cable', 'cables', 'fiber', 'fibre', 'wire', 'wires'],
  ['internet', 'network', 'communications', 'communication', 'telecommunication', 'traffic'],
  ['carry', 'carries', 'carried', 'transmit', 'transmits', 'transmitted', 'send', 'sends', 'sent'],
  ['protect', 'protects', 'protected', 'armor', 'armour', 'shield', 'shields'],
  ['bacteria', 'bacterium', 'microbe', 'microbes', 'microbial'],
  ['resistant', 'resistance', 'resist'],
  ['route', 'routes', 'path', 'paths', 'corridor', 'corridors'],
];
const stem = (raw) => {
  let token = String(raw || '').toLowerCase().replace(/[^a-z0-9çğıöşü'-]+/giu, '');
  if (token.endsWith('ies') && token.length > 4) token = `${token.slice(0, -3)}y`;
  else if (token.endsWith('ing') && token.length > 6) token = token.slice(0, -3);
  else if (token.endsWith('ed') && token.length > 5) token = token.slice(0, -2);
  else if (token.endsWith('es') && token.length > 5) token = token.slice(0, -2);
  else if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) token = token.slice(0, -1);
  return token;
};
const synonymMap = new Map();
for (const group of SYNONYMS) {
  const canonical = stem(group[0]);
  for (const token of group) synonymMap.set(stem(token), canonical);
}
const contentTokens = (value) => rawWords(value)
  .map(stem)
  .map((token) => synonymMap.get(token) || token)
  .filter((token) => token.length >= 3 && !STOP.has(token) && !GENERIC.has(token));
const completeLine = (value) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  const count = rawWords(text).length;
  if (count < 7 || count > 20) return false;
  if (!/[.!?]$/.test(text)) return false;
  if (/^(and|but|because|which|while|although|however|ve|ama|çünkü)\b/i.test(text)) return false;
  if (/\b(a|an|the|of|to|and|or|but|with|from|into|by|for|as|that|which|is|are|was|were|ve|ile|için|bir|bu|şu)\.$/i.test(text)) return false;
  return true;
};

const researchCorpus = new Set(contentTokens((plan.research || []).map((item) => `${item.title || ''} ${item.excerpt || item.snippet || ''}`).join(' ')));
const topicTokens = new Set(contentTokens(plan.topic));
const researchSupportFor = (line) => {
  const tokens = [...new Set(contentTokens(line).filter((token) => !topicTokens.has(token)))];
  if (!tokens.length) return {passed: false, matches: 0, total: 0, ratio: 0};
  const matches = tokens.filter((token) => researchCorpus.has(token)).length;
  const ratio = matches / tokens.length;
  return {
    passed: matches >= Math.min(3, tokens.length) && ratio >= 0.42,
    matches,
    total: tokens.length,
    ratio: Number(ratio.toFixed(3)),
  };
};

const supportRows = scenes.map((scene) => ({id: scene.id, ...researchSupportFor(scene.voiceLine)}));
const researchBacked = supportRows.length === scenes.length && supportRows.every((row) => row.passed);
const researchDepth = plan.researchDepth || {};
const trustedSceneCount = scenes.filter((scene) => trustedSources.has(scene.contentRepairSource)).length;
const curated = scenes.length >= 10 && scenes.every((scene) => scene.contentRepairSource === 'curated-topic-script');
const extractedAndSupported = (
  scenes.length >= 10
  && scenes.every((scene) => scene.contentRepairSource === 'ranked-complete-research')
  && researchDepth.failClosed === true
  && Number(researchDepth.sourceCount || 0) >= 3
  && Number(researchDepth.excerptCharacters || 0) >= 4200
  && researchBacked
);
const hasGroundedSceneSet = (
  scenes.length >= 10
  && trustedSceneCount === scenes.length
  && scenes.every((scene) => completeLine(scene.voiceLine))
  && (curated || extractedAndSupported)
);

if (hasGroundedSceneSet) {
  plan.storyRepair = {
    version: 3,
    mode: curated ? 'preserve-curated-story' : 'preserve-research-supported-story',
    failClosed: true,
    selectedFactCount: scenes.length,
    minimumFactCount: 10,
    contentSources: [...new Set(scenes.map((scene) => scene.contentRepairSource))],
    researchSourceCount: Number(researchDepth.sourceCount || (plan.research || []).length),
    researchExcerptCharacters: Number(researchDepth.excerptCharacters || 0),
    researchSupport: supportRows,
    reason: curated
      ? 'Curated topic script is authoritative for this specialized topic.'
      : 'Every existing scene is a complete sentence directly supported by the selected research corpus.',
  };
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(`Fallback story V8 preserved grounded plan: scenes=${scenes.length}, mode=${plan.storyRepair.mode}`);
  process.exit(0);
}

if (!curated && scenes.length >= 10 && !researchBacked) {
  const failed = supportRows.filter((row) => !row.passed).map((row) => `scene-${row.id}:${row.matches}/${row.total}`).join(',');
  console.warn(`Fallback story V8 rejected stale narration against repaired research: ${failed}`);
}

const run = spawnSync(process.execPath, ['scripts/auto-factory/repair-fallback-story.mjs'], {
  cwd: process.cwd(),
  env: {...process.env, PLAN_PATH: planPath, MANIFEST_PATH: manifestPath},
  encoding: 'utf8',
  stdio: 'pipe',
});
if (run.stdout) process.stdout.write(run.stdout);
if (run.stderr) process.stderr.write(run.stderr);
if (run.status !== 0) process.exit(run.status || 1);

const repaired = JSON.parse(await readFile(planPath, 'utf8'));
if (!Array.isArray(repaired.scenes) || repaired.scenes.length < 10) {
  throw new Error(`Fallback story V8 rejected undersized repaired plan: scenes=${repaired.scenes?.length || 0}, required=10.`);
}
const repairedResearch = new Set(contentTokens((repaired.research || []).map((item) => `${item.title || ''} ${item.excerpt || item.snippet || ''}`).join(' ')));
const repairedTopic = new Set(contentTokens(repaired.topic));
const repairedFailures = repaired.scenes.map((scene) => {
  const tokens = [...new Set(contentTokens(scene.voiceLine).filter((token) => !repairedTopic.has(token)))];
  const matches = tokens.filter((token) => repairedResearch.has(token)).length;
  const ratio = matches / Math.max(1, tokens.length);
  return {id: scene.id, passed: matches >= Math.min(3, tokens.length) && ratio >= 0.42, matches, total: tokens.length};
}).filter((row) => !row.passed);
if (repairedFailures.length) {
  throw new Error(`Fallback story V8 rejected unsupported repaired facts: ${repairedFailures.map((row) => `scene-${row.id}:${row.matches}/${row.total}`).join(', ')}`);
}
repaired.storyRepair = {
  ...(repaired.storyRepair || {}),
  version: 3,
  mode: 'research-supported-extractive-repair',
  researchSupportValidated: true,
  minimumFactCount: 10,
};
await writeFile(planPath, `${JSON.stringify(repaired, null, 2)}\n`, 'utf8');
console.log(`Fallback story V8 accepted research-supported extractive repair: scenes=${repaired.scenes.length}`);
