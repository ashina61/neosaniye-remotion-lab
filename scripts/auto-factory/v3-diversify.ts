import {readFile, writeFile} from 'node:fs/promises';
import {FactoryPlanSchema, type VisualKind} from '../../src/auto-factory/schema.js';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = FactoryPlanSchema.parse(JSON.parse(await readFile(planPath, 'utf8')));
const locale = plan.language === 'en' ? 'en-US' : 'tr-TR';

const normalize = (value: string) => value
  .toLocaleLowerCase(locale)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9çğıöşü]+/gi, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const compact = (value: string, maxWords = 7) => value.replace(/\s+/g, ' ').trim().split(' ').slice(0, maxWords).join(' ');

const chooseAlternative = (kind: VisualKind, text: string): VisualKind => {
  const value = normalize(text);
  if (kind === 'selection-process') return /surviv|resistan|hayatta|direncli|kalan/.test(value) ? 'microbe-field' : 'cause-effect';
  if (kind === 'gene-transfer') return /species|spread|different|turler|yayil|farkli/.test(value) ? 'map-evolution' : 'object-exploded';
  if (kind === 'microbe-field' || kind === 'biology') return 'cause-effect';
  if (kind === 'before-after' || kind === 'comparison') return 'evidence-board';
  if (kind === 'process-flow') return 'object-exploded';
  if (kind === 'timeline') return 'process-flow';
  if (kind === 'document' || kind === 'evidence-board') return 'before-after';
  if (kind === 'object-exploded') return 'mechanism';
  return 'process-flow';
};

for (let index = 1; index < plan.scenes.length; index += 1) {
  const previous = plan.scenes[index - 1];
  const current = plan.scenes[index];
  if (current.visualKind !== previous.visualKind) continue;
  const original = current.visualKind;
  current.visualKind = chooseAlternative(original, `${current.voiceLine} ${current.sceneGoal} ${current.heroVisual}`);
  current.visualSignature = `${current.visualSignature}:kind:${current.visualKind}`;
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
  console.log(`V3 visual-kind diversify scene-${current.id}: ${original} -> ${current.visualKind}`);
}

const antibioticHeroPool = plan.language === 'en'
  ? [
      'antibiotic entering a petri dish',
      'susceptible bacteria collapsing',
      'single resistant survivor',
      'resistant colony multiplying',
      'mutation inside bacterial DNA',
      'plasmid crossing between bacteria',
      'gene transfer across species',
      'wrong drug creating selection pressure',
      'regrowth after incomplete treatment',
      'hospital resistance filter',
      'resistance routes through people and water',
      'ineffective drug beside infection',
      'correct antibiotic protocol',
      'selection producing a resistant colony',
    ]
  : [
      'petri kabına inen antibiyotik',
      'çöken hassas bakteriler',
      'tek dirençli hayatta kalan',
      'çoğalan dirençli koloni',
      'bakteri DNA mutasyonu',
      'bakteriler arası plazmid',
      'türler arası gen aktarımı',
      'seçilim baskısı oluşturan yanlış ilaç',
      'yarım tedavi sonrası yeniden çoğalma',
      'hastane direnç filtresi',
      'insan ve su arasındaki direnç rotaları',
      'enfeksiyon yanında etkisiz ilaç',
      'doğru antibiyotik protokolü',
      'dirençli koloni oluşturan seçilim',
    ];

const usedHeroes = new Set<string>();
for (let index = 0; index < plan.scenes.length; index += 1) {
  const scene = plan.scenes[index];
  let candidate = compact(scene.heroVisual, 8);
  const key = normalize(candidate);
  if (!usedHeroes.has(key)) {
    usedHeroes.add(key);
    scene.heroVisual = candidate;
    continue;
  }

  const profileCandidate = plan.v3?.profile === 'antibiotic-resistance' ? antibioticHeroPool[index] : undefined;
  const supportCandidate = compact(`${candidate} ${scene.supportVisuals[index % scene.supportVisuals.length] || scene.title}`, 8);
  const candidates = [profileCandidate, supportCandidate, compact(`${scene.title} ${candidate}`, 8), `${candidate} ${index + 1}`].filter(Boolean) as string[];
  const replacement = candidates.find((value) => !usedHeroes.has(normalize(value)));
  if (!replacement) throw new Error(`V3 could not diversify hero visual for scene-${scene.id}`);

  scene.heroVisual = replacement;
  scene.visualSignature = `${scene.visualSignature}:hero:${normalize(replacement)}`;
  scene.beats[0].label = compact(replacement, 7);
  scene.sceneGoal = plan.language === 'en'
    ? `Show ${replacement} while the narration explains: ${scene.voiceLine}`
    : `${scene.voiceLine} anlatılırken ${replacement} görselini göster`;
  usedHeroes.add(normalize(replacement));
  console.log(`V3 hero diversify scene-${scene.id}: ${candidate} -> ${replacement}`);
}

const consecutiveKinds = plan.scenes.filter((scene, index) => index > 0 && scene.visualKind === plan.scenes[index - 1].visualKind);
if (consecutiveKinds.length) throw new Error(`V3 diversification failed for visual kinds: ${consecutiveKinds.map((scene) => scene.id).join(', ')}`);

const duplicateHeroes = plan.scenes.filter((scene, index) => plan.scenes.findIndex((other) => normalize(other.heroVisual) === normalize(scene.heroVisual)) !== index);
if (duplicateHeroes.length) throw new Error(`V3 duplicate hero visuals after diversify: ${duplicateHeroes.map((scene) => scene.heroVisual).join(', ')}`);

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V3 diversification complete: ${new Set(plan.scenes.map((scene) => scene.visualKind)).size} visual families, ${usedHeroes.size} unique heroes.`);
