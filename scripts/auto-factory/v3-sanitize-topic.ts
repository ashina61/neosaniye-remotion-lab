import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';

const plan = JSON.parse(await readFile(planPath, 'utf8')) as Record<string, unknown>;

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const containsNormalizedPhrase = (text: string, phrase: string) => {
  const haystack = normalize(text);
  const needle = normalize(phrase);
  if (!needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
};

const topic = normalize(String(plan.topic ?? ''));
const profile = String(plan.v3Profile ?? plan.v3_profile ?? '');
const isAntibioticResistance =
  profile === 'antibiotic-resistance' ||
  topic.includes('antibiyotik direnci') ||
  topic.includes('antibiotic resistance');

const replacements: Array<[RegExp, string]> = [
  [/bağışıklık\s+hafızası/giu, 'seçilim mekanizması'],
  [/bagisiklik\s+hafizasi/giu, 'seçilim mekanizması'],
  [/hafıza\s+hücresi/giu, 'dirençli bakteri'],
  [/hafiza\s+hucresi/giu, 'dirençli bakteri'],
  [/antikorlar?/giu, 'direnç mekanizması'],
  [/antibod(?:y|ies)/giu, 'resistance mechanism'],
  [/aşılar?/giu, 'antibiyotik'],
  [/vaccine(?:s)?/giu, 'antibiotic'],
  [/antijen/giu, 'bakteri hedefi'],
  [/bağışıklık/giu, 'bakteriyel direnç'],
  [/bagisiklik/giu, 'bakteriyel direnç'],
];

const ruleKeys = new Set([
  'forbidden',
  'forbiddenTags',
  'forbidden_tags',
  'forbiddenConcepts',
  'forbidden_concepts',
  'blockedConcepts',
  'blocked_concepts',
]);

const sanitizeString = (value: string) => {
  let next = value;
  for (const [pattern, replacement] of replacements) next = next.replace(pattern, replacement);
  return next.replace(/\s+/g, ' ').trim();
};

const sanitizeDeep = (value: unknown, key = ''): unknown => {
  if (ruleKeys.has(key)) return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeDeep(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, item]) => [
        childKey,
        sanitizeDeep(item, childKey),
      ]),
    );
  }
  return value;
};

const contentOnly = (value: unknown, key = ''): unknown => {
  if (ruleKeys.has(key)) return undefined;
  if (Array.isArray(value)) return value.map((item) => contentOnly(item)).filter((item) => item !== undefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .map(([childKey, item]) => [childKey, contentOnly(item, childKey)] as const)
        .filter(([, item]) => item !== undefined),
    );
  }
  return value;
};

if (isAntibioticResistance) {
  const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
  plan.scenes = sanitizeDeep(scenes);

  const forbiddenPhrases = [
    'aşı',
    'antikor',
    'bağışıklık hafızası',
    'bagisiklik hafizasi',
    'vaccine',
    'antibody',
  ];
  const leaks: string[] = [];

  for (const [index, scene] of (plan.scenes as unknown[]).entries()) {
    const searchableContent = JSON.stringify(contentOnly(scene));
    for (const term of forbiddenPhrases) {
      if (containsNormalizedPhrase(searchableContent, term)) {
        leaks.push(`scene-${index + 1}: ${term}`);
      }
    }
  }

  if (leaks.length > 0) throw new Error(`V3 topic sanitizer failed: ${leaks.join(', ')}`);

  plan.topicSanitized = true;
  plan.topicSanitizerProfile = 'antibiotic-resistance';
  plan.topicSanitizerVersion = 3;

  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as Record<string, unknown>;
    manifest.topicSanitized = true;
    manifest.topicSanitizerProfile = 'antibiotic-resistance';
    manifest.topicSanitizerVersion = 3;
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  } catch {
    // Manifest is optional during local planning; plan validation remains authoritative.
  }

  console.log(`V3 konu temizleyici tamamlandı: ${scenes.length} sahne, içerik sızıntısı 0.`);
}

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
