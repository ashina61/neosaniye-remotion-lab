import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const manifestPath = process.env.MANIFEST_PATH || 'public/auto-factory/manifest.json';
const plan = JSON.parse(await readFile(planPath, 'utf8')) as any;

const cleanWords = (value: string) => value
  .replace(/\[[^\]]+]/g, ' ')
  .replace(/\([^)]*\)/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .split(/\s+/)
  .filter(Boolean);

const trailingFillers = new Set([
  've', 'veya', 'ile', 'çünkü', 'fakat', 'ama', 'için', 'gibi', 'olarak',
  'olan', 'bu', 'bir', 'da', 'de', 'the', 'and', 'or', 'because', 'with', 'for'
]);

const shortenLine = (value: string, maxWords: number, maxChars: number): string => {
  const original = value.replace(/\s+/g, ' ').trim();
  const clauses = original.split(/(?<=[,;:!?])\s+/).filter(Boolean);
  let source = original;
  const usableClause = clauses.find((clause) => {
    const count = cleanWords(clause).length;
    return count >= 4 && count <= maxWords && clause.length <= maxChars;
  });
  if (usableClause) source = usableClause;

  const selected: string[] = [];
  for (const word of cleanWords(source)) {
    const candidate = [...selected, word].join(' ');
    if (selected.length >= maxWords || candidate.length > maxChars) break;
    selected.push(word);
  }

  while (selected.length > 4 && trailingFillers.has(selected[selected.length - 1].toLocaleLowerCase('tr-TR').replace(/[.,;:!?]+$/g, ''))) {
    selected.pop();
  }

  const fallback = cleanWords(original).slice(0, Math.max(4, maxWords));
  const finalWords = selected.length >= 4 ? selected : fallback;
  return `${finalWords.join(' ').replace(/[.,;:!?]+$/g, '')}.`;
};

const selectEvenly = (scenes: any[], target: number): any[] => {
  if (scenes.length <= target) return scenes;
  const middle = scenes.slice(1, -1);
  const needed = target - 2;
  const selected: any[] = [];
  const used = new Set<number>();

  for (let index = 0; index < needed; index++) {
    const raw = needed === 1 ? 0 : Math.round(index * (middle.length - 1) / (needed - 1));
    let picked = raw;
    while (used.has(picked) && picked + 1 < middle.length) picked += 1;
    while (used.has(picked) && picked - 1 >= 0) picked -= 1;
    used.add(picked);
    selected.push(middle[picked]);
  }

  return [scenes[0], ...selected, scenes[scenes.length - 1]];
};

const duration = Number(plan.duration || 46);
const targetSceneCount = duration <= 43 ? 13 : duration <= 47 ? 14 : 15;
const originalSceneCount = plan.scenes.length;
const scenes = selectEvenly(plan.scenes, targetSceneCount);

const hookDuration = duration <= 43 ? 2.9 : 3.0;
const finalDuration = duration >= 49 ? 4.4 : 4.3;
const middleDuration = (duration - hookDuration - finalDuration) / Math.max(1, scenes.length - 2);

let cursor = 0;
for (let index = 0; index < scenes.length; index++) {
  const isHook = index === 0;
  const isFinal = index === scenes.length - 1;
  const sceneDuration = isHook ? hookDuration : isFinal ? finalDuration : middleDuration;
  const maxWords = isHook ? 6 : isFinal ? 9 : 7;
  const maxChars = isHook ? 52 : isFinal ? 76 : 60;

  scenes[index] = {
    ...scenes[index],
    id: index + 1,
    start: Number(cursor.toFixed(3)),
    duration: Number(sceneDuration.toFixed(3)),
    voiceStart: isHook ? 0.05 : 0.1,
    voiceEndPadding: isFinal ? 0.45 : 0.2,
    voiceLine: shortenLine(String(scenes[index].voiceLine || scenes[index].title || ''), maxWords, maxChars),
  };
  cursor += sceneDuration;
}

scenes[scenes.length - 1].duration = Number((duration - scenes[scenes.length - 1].start).toFixed(3));
plan.scenes = scenes;
plan.narration = scenes.map((scene: any) => scene.voiceLine).join(' ').replace(/\s+/g, ' ').trim();

await writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');

try {
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as any;
  manifest.sceneCount = scenes.length;
  manifest.densityNormalization = {
    originalSceneCount,
    normalizedSceneCount: scenes.length,
    hookMaxWords: 6,
    middleMaxWords: 7,
    finalMaxWords: 9,
    targetDuration: duration,
  };
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
} catch {
  // Manifest is informational; the production plan remains the source of truth.
}

console.log(`Sahne yoğunluğu normalize edildi: ${originalSceneCount} -> ${scenes.length} sahne.`);
for (const scene of scenes) {
  console.log(`scene-${scene.id}: ${scene.duration.toFixed(2)}s | ${cleanWords(scene.voiceLine).length} kelime | ${scene.voiceLine}`);
}
