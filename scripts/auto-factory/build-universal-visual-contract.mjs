import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const language = plan.language === 'tr' ? 'tr' : 'en';

const MODES = new Set(['focus', 'process', 'comparison', 'timeline', 'network', 'evidence', 'exploded']);
const EN_STOP = new Set('a an the and or but if then than to of in on at by for from with without into onto over under through during before after is are was were be been being it its this that these those how why what when where who which can could may might will would should do does did done have has had most more less very just one two three first last new old same other another people thing things way ways'.split(' '));
const TR_STOP = new Set('bir bu şu ve veya ama fakat çünkü için ile de da ki mi mı mu mü nasıl neden ne zaman nerede kim hangi olan olarak daha en çok az sonra önce ise kadar gibi her bazı diğer aynı yeni eski ilk son'.split(' '));
const GENERIC = new Set([
  'main subject', 'supporting detail', 'visual detail', 'topic', 'mechanism', 'system', 'process',
  'scene', 'object', 'thing', 'things', 'concept', 'explain', 'illustrate', 'detail', 'details',
  'ana konu', 'destekleyici detay', 'görsel detay', 'sahne', 'nesne', 'şey', 'kavram',
]);
const TURKISH_LEAK_WORDS = /\b(önce|sonra|yanlış|doğru|ilaç|antibiyotik|bakteri|bakteriler|direnç|dirençli|tedavi|hastane|insanlar|hayvanlar|çevre|seçilim|yayılma|çoğalma|kalanlar|gereksiz|kullanım|çözüm|süre|doz|hücre|sinyal|hafıza|mekanizma|tepki|harita|sınır|anlaşma|rota|güç|arşiv|tarih|belge|kanıt|tanık|soru|canlı|döngü|uyum)\b/iu;

const clean = (value) => String(value || '')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[\[\]{}()<>]/g, ' ')
  .replace(/[\n\r\t]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const norm = (value) => clean(value)
  .toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US')
  .replace(/[^a-z0-9çğıöşü]+/giu, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const tokens = (value) => norm(value).split(' ').filter(Boolean);
const stop = language === 'tr' ? TR_STOP : EN_STOP;
const contentTokens = (value) => tokens(value).filter((token) => token.length >= 3 && !stop.has(token));
const isGeneric = (value) => {
  const n = norm(value);
  return !n || GENERIC.has(n) || contentTokens(n).length === 0;
};
const hasWrongLanguage = (value) => language === 'en' && (/[çğıöşüİ]/u.test(String(value || '')) || TURKISH_LEAK_WORDS.test(String(value || '')));
const truncate = (value, max = 56) => {
  const text = clean(value).replace(/[.!?;:]+$/g, '');
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trim()}…`;
};
const unique = (values) => {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    const text = truncate(value);
    const key = norm(text);
    if (!key || seen.has(key) || isGeneric(text) || hasWrongLanguage(text)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
};

const phraseCandidates = (value) => {
  const text = clean(value).replace(/[.!?]+$/g, '');
  if (!text) return [];
  const clauses = text.split(/[,;:—–]|\b(?:and|but|while|because|so|then|ve|ama|fakat|çünkü|sonra)\b/iu)
    .map((part) => clean(part))
    .filter(Boolean);
  const candidates = [];
  for (const clause of clauses) {
    const words = clause.split(/\s+/).filter(Boolean);
    const meaningful = words.filter((word) => contentTokens(word).length > 0);
    if (meaningful.length >= 2) candidates.push(meaningful.slice(0, 5).join(' '));
    if (meaningful.length === 1) candidates.push(meaningful[0]);
  }
  const raw = text.split(/\s+/).filter(Boolean);
  for (let index = 0; index < raw.length - 1; index += 1) {
    const pair = `${raw[index]} ${raw[index + 1]}`;
    if (contentTokens(pair).length >= 2) candidates.push(pair);
  }
  return candidates;
};

const modeFor = (scene) => {
  const kind = String(scene.visualKind || '');
  const grammar = String(scene.sceneGrammar || '');
  const action = String(scene.semanticAction || '');
  if (/timeline/.test(kind) || grammar === 'timeline-strip') return 'timeline';
  if (/comparison|before-after/.test(kind) || grammar === 'comparison-scale' || action === 'compare') return 'comparison';
  if (/map|network|crowd|world-network/.test(kind) || grammar === 'map-route' || grammar === 'spread-network' || action === 'spread' || action === 'connect') return 'network';
  if (/document|archive|evidence|dossier|treaty|institution/.test(kind) || grammar === 'evidence-board') return 'evidence';
  if (/object-exploded|mechanism-cutaway/.test(kind) || grammar === 'exploded-object') return 'exploded';
  if (/process|mechanism|factory|selection|gene-transfer|cause-effect|biology|microbe/.test(kind) || grammar === 'cause-chain' || action === 'transform' || action === 'filter' || action === 'assemble' || action === 'multiply' || action === 'collapse') return 'process';
  return 'focus';
};

const buildLabels = (scene) => {
  const groundedText = [scene.title, scene.voiceLine, plan.topic].filter(Boolean).join(' ');
  const grounded = new Set(contentTokens(groundedText));
  const supplied = [
    scene.title,
    scene.heroVisual,
    scene.primaryMotif,
    scene.secondaryMotif,
    ...(Array.isArray(scene.mustShow) ? scene.mustShow : []),
    ...(Array.isArray(scene.supportVisuals) ? scene.supportVisuals : []),
    ...(Array.isArray(scene.props) ? scene.props : []),
  ];
  const suppliedGrounded = supplied.filter((value) => {
    const own = contentTokens(value);
    return own.length > 0 && own.some((token) => grounded.has(token));
  });
  const derived = [
    ...phraseCandidates(scene.title),
    ...phraseCandidates(scene.voiceLine),
    ...phraseCandidates(plan.topic),
  ];
  const labels = unique([...suppliedGrounded, ...derived]);
  return labels.slice(0, 5);
};

const visibleFields = (scene) => [
  scene.title, scene.kicker, scene.voiceLine, scene.heroVisual, scene.primaryMotif, scene.secondaryMotif,
  ...(scene.props || []), ...(scene.supportVisuals || []), ...(scene.mustShow || []),
  ...(scene.beats || []).map((beat) => beat.label),
];

const errors = [];
const specialized = (plan.scenes || []).length > 0 && (plan.scenes || []).every((scene) => String(scene.semanticLockRule || '').trim());
for (let index = 0; index < (plan.scenes || []).length; index += 1) {
  const scene = plan.scenes[index];
  const labels = buildLabels(scene);
  if (labels.length < 2) {
    errors.push(`scene ${scene.id}: fewer than two grounded visual labels`);
    continue;
  }
  const mode = modeFor(scene);
  const sourceTokens = new Set(contentTokens(`${scene.title} ${scene.voiceLine} ${plan.topic}`));
  const overlap = labels.reduce((sum, label) => sum + contentTokens(label).filter((token) => sourceTokens.has(token)).length, 0);
  if (overlap < 2) errors.push(`scene ${scene.id}: visual labels are not grounded in narration/topic`);

  scene.visualContract = {
    version: 6,
    mode,
    subject: labels[0],
    labels,
    relation: String(scene.semanticAction || 'reveal'),
    layoutVariant: index % 4,
    groundingTokens: [...sourceTokens].slice(0, 14),
    source: specialized ? 'specialized-plus-universal' : 'universal-fallback',
  };

  if (!specialized) {
    scene.heroVisual = labels[0];
    scene.primaryMotif = labels[0];
    scene.secondaryMotif = labels[1];
    scene.props = labels.slice(0, 5);
    scene.supportVisuals = labels.slice(1, 5);
    scene.mustShow = labels.slice(0, 5);
    scene.subjectTokens = [...sourceTokens].slice(0, 14);
    scene.visualSignature = `universal-v6:${mode}:${scene.id}:${labels.map(norm).join('|')}`.slice(0, 180);
    scene.beats = labels.slice(0, 3).map((label, beatIndex) => ({
      at: [0.16, 0.44, 0.7][beatIndex],
      label,
      action: ['reveal', 'connect', 'highlight'][beatIndex],
    }));
    const promptSubject = labels.join(', ');
    scene.imagePrompt = `Vertical 9:16 editorial documentary collage about ${plan.topic}. Show ${promptSubject}. Every object must directly illustrate this scene: ${scene.voiceLine}. No unrelated geometry, no readable text, no logo.`;
  }

  for (const value of visibleFields(scene)) {
    if (hasWrongLanguage(value)) errors.push(`scene ${scene.id}: wrong-language visible text: ${value}`);
  }
}

if (!(plan.scenes || []).length) errors.push('plan has no scenes');
if ((plan.scenes || []).some((scene) => !MODES.has(scene.visualContract?.mode))) errors.push('invalid universal visual mode');
if (errors.length) {
  throw new Error(`Universal visual contract failed:\n${errors.slice(0, 20).join('\n')}`);
}

const modes = (plan.scenes || []).map((scene) => scene.visualContract.mode);
plan.v6 = {
  renderer: 'universal-semantic-v6',
  version: 6,
  contractVersion: 1,
  specializedRendererAvailable: specialized,
  modeCount: new Set(modes).size,
  modes,
  failClosed: true,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`Universal visual contract ready: scenes=${plan.scenes.length}, modes=${new Set(modes).size}, specialized=${specialized}`);
