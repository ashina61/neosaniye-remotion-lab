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
const compact = (value: unknown, max = 48) => {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : clean.slice(0, max).trim();
};

const scenes = (Array.isArray(plan.scenes) ? plan.scenes : []) as Scene[];
if (!scenes.length) throw new Error('V3 voice naturalizer received no scenes');

// Topic grounding uses English canonical motif names so the renderer can select
// deterministic icons. Turkish narration must never speak those internal names.
for (const scene of scenes) {
  let line = sentence(scene.voiceLine || scene.title || '');
  if (language === 'tr' && scene.audioExpansionApplied) {
    line = firstSentence(line);
    scene.audioExpansionApplied = false;
  }
  scene.voiceLine = trimWords(line, 26);
}

const localizedClause = (scene: Scene) => {
  const title = compact(scene.title || scene.heroVisual, 42).toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');
  const kicker = compact(scene.kicker || scene.supportVisuals?.[0] || scene.heroVisual, 46).toLocaleLowerCase(language === 'tr' ? 'tr-TR' : 'en-US');
  if (language === 'tr') return `Bu aşama, ${title} ile ${kicker} arasındaki bağlantıyı gösterir.`;
  return `This stage connects ${title} with ${kicker}.`;
};

const minimumWords = language === 'tr'
  ? Math.max(88, Math.round(Number(plan.duration || 46) * 1.92))
  : Math.max(98, Math.round(Number(plan.duration || 46) * 2.18));
const maximumWords = language === 'tr' ? 138 : 145;
const totalWords = () => scenes.reduce((sum, scene) => sum + wordCount(scene.voiceLine), 0);

let guard = 0;
while (totalWords() < minimumWords && guard < scenes.length * 2) {
  const candidate = scenes
    .map((scene, index) => ({scene, index, count: wordCount(scene.voiceLine)}))
    .filter(({scene, count}) => !scene.voiceNaturalizerExpanded && count < 21)
    .sort((a, b) => a.count - b.count || a.index - b.index)[0];
  if (!candidate) break;
  candidate.scene.voiceLine = `${String(candidate.scene.voiceLine).replace(/[.!?]+$/, '')}. ${localizedClause(candidate.scene)}`;
  candidate.scene.voiceNaturalizerExpanded = true;
  guard += 1;
}

// Oversized provider output is shortened before TTS instead of being rushed by
// atempo. Remove secondary clauses first, then cap only the longest sentence.
guard = 0;
while (totalWords() > maximumWords && guard < scenes.length * 3) {
  const expanded = scenes
    .map((scene, index) => ({scene, index, count: wordCount(scene.voiceLine)}))
    .filter(({scene}) => scene.voiceNaturalizerExpanded || scene.audioExpansionApplied)
    .sort((a, b) => b.count - a.count || a.index - b.index)[0];
  if (expanded) {
    expanded.scene.voiceLine = firstSentence(String(expanded.scene.voiceLine));
    expanded.scene.voiceNaturalizerExpanded = false;
    expanded.scene.audioExpansionApplied = false;
  } else {
    const longest = scenes
      .map((scene, index) => ({scene, index, count: wordCount(scene.voiceLine)}))
      .sort((a, b) => b.count - a.count || a.index - b.index)[0];
    if (!longest || longest.count <= 12) break;
    longest.scene.voiceLine = trimWords(String(longest.scene.voiceLine), longest.count - 2);
  }
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
  voiceNaturalizer: 'topic-safe-scene-pacing',
  voiceNaturalizerVersion: 1,
  narrationWordCount: finalWords,
  narrationWordRange: [minimumWords, maximumWords],
};
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V3 natural narration ready: language=${language}, words=${finalWords}, range=${minimumWords}-${maximumWords}`);
