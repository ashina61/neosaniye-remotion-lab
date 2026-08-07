export type SceneTemplate =
  | 'document-reveal'
  | 'big-number'
  | 'newspaper-stack'
  | 'character-shadow'
  | 'final-verdict';

export type SceneSpec = {
  id: string;
  template: SceneTemplate;
  duration: number;
  headline: string;
  caption: string;
  eyebrow?: string;
  accent?: string;
  background?: string;
  subject?: string;
  objects?: string[];
};

export type ScenePlan = {
  version: 1;
  title: string;
  fps: number;
  width: number;
  height: number;
  scenes: SceneSpec[];
};

const templates = new Set<SceneTemplate>([
  'document-reveal',
  'big-number',
  'newspaper-stack',
  'character-shadow',
  'final-verdict',
]);

export const parseScenePlan = (value: unknown): ScenePlan => {
  if (!value || typeof value !== 'object') throw new Error('scene-plan must be an object');
  const plan = value as Partial<ScenePlan>;
  if (plan.version !== 1) throw new Error('scene-plan version must be 1');
  if (!Array.isArray(plan.scenes) || plan.scenes.length === 0) throw new Error('scene-plan needs scenes');
  for (const [index, scene] of plan.scenes.entries()) {
    if (!scene.id || !scene.headline || !scene.caption) throw new Error(`scene ${index} is incomplete`);
    if (!templates.has(scene.template)) throw new Error(`scene ${index} has unknown template`);
    if (!Number.isFinite(scene.duration) || scene.duration < 30) throw new Error(`scene ${index} duration is invalid`);
  }
  return plan as ScenePlan;
};

export const totalFrames = (plan: ScenePlan) => plan.scenes.reduce((sum, scene) => sum + scene.duration, 0);
