import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8')) as Record<string, any>;
type Scene = Record<string, any>;
const language: 'tr' | 'en' = plan.language === 'tr' ? 'tr' : 'en';

const tokenPattern = /[0-9A-Za-zÇĞİÖŞÜçğıöşü']+/g;
const wordCount = (value: unknown) => String(value || '').match(tokenPattern)?.length || 0;
const sentence = (value: unknown) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return clean;
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
};
const trimWords = (value: string, maximum: number) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ').filter(Boolean);
  if (words.length <= maximum) return sentence(clean);
  return sentence(words.slice(0, maximum).join(' ').replace(/[,:;\-]+$/, ''));
};
const firstSentence = (value: string) => {
  const match = value.trim().match(/^.*?[.!?](?:\s|$)/);
  return sentence(match ? match[0].trim() : value);
};
const compact = (value: unknown, max = 34) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const words = clean.split(' ');
  let result = '';
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > max) break;
    result = candidate;
  }
  return result || clean.slice(0, max).trim();
};

const scenes = (Array.isArray(plan.scenes) ? plan.scenes : []) as Scene[];
if (!scenes.length) throw new Error('V3 voice naturalizer received no scenes');

// Topic grounding may have appended a second filler sentence to reach a global
// word budget. Edge TTS can pause for more than a second at that full stop, so
// every scene is reduced to one complete spoken sentence before pacing.
for (const scene of scenes) {
  const source = sentence(scene.voiceLine || scene.title || '');
  scene.voiceLine = trimWords(firstSentence(source), 18);
  scene.audioExpansionApplied = false;
  scene.voiceNaturalizerExpanded = false;
}

const localizedClause = (scene: Scene) => {
  const locale = language === 'tr' ? 'tr-TR' : 'en-US';
  const focus = compact(scene.title || scene.kicker || scene.heroVisual, 32).toLocaleLowerCase(locale);
  if (language === 'tr') return `, böylece ${focus} etkisi görünür olur`;
  return `, exposing the role of ${focus}`;
};

const minimumWords = language === 'tr'
  ? Math.max(88, Math.round(Number(plan.duration || 46) * 1.92))
  : Math.max(95, Math.round(Number(plan.duration || 46) * 2.06));
const maximumWords = language === 'tr' ? 132 : 138;
const totalWords = () => scenes.reduce((sum, scene) => sum + wordCount(scene.voiceLine), 0);

// Add a short dependent clause to the shortest scenes. Do not add another full
// sentence: one scene must remain one continuous TTS phrase with no long pause.
let guard = 0;
while (totalWords() < minimumWords && guard < scenes.length) {
  const candidate = scenes
    .map((scene, index) => ({scene, index, count: wordCount(scene.voiceLine)}))
    .filter(({scene, count}) => !scene.voiceNaturalizerExpanded && count < 14)
    .sort((a, b) => a.count - b.count || a.index - b.index)[0];
  if (!candidate) break;
  const base = String(candidate.scene.voiceLine).replace(/[.!?]+$/, '');
  candidate.scene.voiceLine = trimWords(`${base}${localizedClause(candidate.scene)}`, 18);
  candidate.scene.voiceNaturalizerExpanded = true;
  guard += 1;
}

// If provider output is still dense, shorten only the longest lines. This is
// safer and more natural than forcing the whole master through extreme atempo.
guard = 0;
while (totalWords() > maximumWords && guard < scenes.length * 3) {
  const longest = scenes
    .map((scene, index) => ({scene, index, count: wordCount(scene.voiceLine)}))
    .sort((a, b) => b.count - a.count || a.index - b.index)[0];
  if (!longest || longest.count <= 11) break;
  longest.scene.voiceLine = trimWords(String(longest.scene.voiceLine), longest.count - 2);
  guard += 1;
}

for (const scene of scenes) {
  scene.voiceLine = sentence(scene.voiceLine);
  scene.sceneGoal = `Illustrate only this spoken claim: ${scene.voiceLine}`;
}

const finalWords = totalWords();
if (finalWords < minimumWords || finalWords > maximumWords) {
  throw new Error(
    `V3 natural narration budget failed: ${finalWords} words; expected ${minimumWords}-${maximumWords}`,
  );
}

plan.narration = scenes.map((scene) => scene.voiceLine).join(' ');
plan.v3 = {
  ...(plan.v3 || {}),
  voiceNaturalizer: 'single-sentence-topic-safe-pacing',
  voiceNaturalizerVersion: 2,
  narrationWordCount: finalWords,
  narrationWordRange: [minimumWords, maximumWords],
  maximumWordsPerScene: 18,
};
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(
  `V3 natural narration ready: language=${language}, words=${finalWords}, ` +
  `range=${minimumWords}-${maximumWords}, singleSentence=true`,
);
