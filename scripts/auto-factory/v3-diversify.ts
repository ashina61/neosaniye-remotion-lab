import {readFile, writeFile} from 'node:fs/promises';
import {FactoryPlanSchema, type VisualKind} from '../../src/auto-factory/schema.js';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = FactoryPlanSchema.parse(JSON.parse(await readFile(planPath, 'utf8')));

const normalize = (value: string) => value
  .toLocaleLowerCase('tr-TR')
  .replace(/ı/g, 'i')
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ş/g, 's')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c');

const chooseAlternative = (kind: VisualKind, text: string): VisualKind => {
  const value = normalize(text);
  if (kind === 'selection-process') {
    return /hayatta|direncli|kalan/.test(value) ? 'microbe-field' : 'cause-effect';
  }
  if (kind === 'gene-transfer') {
    return /turler|yayil|farkli/.test(value) ? 'map-evolution' : 'object-exploded';
  }
  if (kind === 'microbe-field' || kind === 'biology') return 'cause-effect';
  if (kind === 'before-after' || kind === 'comparison') return 'evidence-board';
  if (kind === 'process-flow') return 'object-exploded';
  if (kind === 'timeline') return 'process-flow';
  if (kind === 'document' || kind === 'evidence-board') return 'before-after';
  return 'process-flow';
};

for (let index = 1; index < plan.scenes.length; index += 1) {
  const previous = plan.scenes[index - 1];
  const current = plan.scenes[index];
  if (current.visualKind !== previous.visualKind) continue;

  const original = current.visualKind;
  current.visualKind = chooseAlternative(original, `${current.voiceLine} ${current.sceneGoal} ${current.heroVisual}`);
  current.visualSignature = `${current.visualSignature}:diversified:${current.visualKind}`;
  current.layout = current.visualKind === 'map-evolution'
    ? 'cinematic-wide'
    : current.visualKind === 'microbe-field'
      ? 'macro'
      : current.visualKind === 'object-exploded'
        ? 'diagonal'
        : 'comparison';
  current.shotType = current.visualKind === 'map-evolution'
    ? 'wide'
    : current.visualKind === 'microbe-field'
      ? 'macro'
      : current.visualKind === 'object-exploded'
        ? 'diagram'
        : 'comparison';
  console.log(`V3 diversify scene-${current.id}: ${original} -> ${current.visualKind}`);
}

const consecutive = plan.scenes.filter((scene, index) => index > 0 && scene.visualKind === plan.scenes[index - 1].visualKind);
if (consecutive.length) {
  throw new Error(`V3 diversification failed: ${consecutive.map((scene) => scene.id).join(', ')}`);
}

await writeFile(planPath, JSON.stringify(plan, null, 2), 'utf8');
console.log(`V3 görsel çeşitlendirme tamamlandı: ${new Set(plan.scenes.map((scene) => scene.visualKind)).size} çizim ailesi.`);
