import {z} from 'zod';

export const VisualKindSchema = z.enum([
  'world-network','currency','timeline','map-route','factory','document','treaty-table',
  'commodity','institution','link-break','mechanism','crowd','biology','portrait-dossier',
  'object-exploded','archive-wall','microbe-field','selection-process','gene-transfer',
  'before-after','cause-effect','process-flow','evidence-board','map-evolution','comparison'
]);

export const LayoutSchema = z.enum([
  'hero','split-left','split-right','diagonal','overhead','stacked','dossier','macro',
  'comparison','process','evidence','cinematic-wide'
]);

export const TransitionSchema = z.enum([
  'paper-tear','dossier-slide','film-burn','split-shutter','match-zoom','ink-wipe',
  'paper-swipe','flash-cut','zoom-through','object-match','diagram-morph','camera-whip'
]);

export const MotionSchema = z.enum([
  'push','orbit','drift','stamp','draw','cascade','parallax','rack-focus',
  'multiply','eliminate','transfer','trace','compare'
]);

export const SfxSchema = z.enum(['impact','paper','stamp','click','crack','pulse','whoosh','none']);

export const VisualBeatSchema = z.object({
  at: z.number().min(0).max(1),
  label: z.string().min(1).max(54),
  action: z.enum(['reveal','connect','focus','stamp','swap','highlight','eliminate','multiply','transfer'])
});

export const ScenePlanSchema = z.object({
  id: z.number().int().positive(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  title: z.string().min(1).max(60),
  kicker: z.string().max(80),
  voiceLine: z.string().max(260).default(''),
  voiceStart: z.number().min(0).max(1.2).default(0.08),
  voiceEndPadding: z.number().min(0.02).max(0.8).default(0.12),
  visualKind: VisualKindSchema,
  layout: LayoutSchema,
  transition: TransitionSchema,
  motion: MotionSchema,
  sfx: SfxSchema,
  accent: z.enum(['red','teal','gold','blue']),
  props: z.array(z.string().min(1).max(42)).min(2).max(7),
  beats: z.array(VisualBeatSchema).min(2).max(6).default([]),
  detailLevel: z.number().int().min(1).max(3).default(2),
  imagePrompt: z.string().min(20),
  sourceNote: z.string().max(160).optional(),
  asset: z.string().optional(),
  sceneGoal: z.string().min(3).max(180).default('Explain the spoken line visually'),
  heroVisual: z.string().min(2).max(90).default('main subject'),
  supportVisuals: z.array(z.string().min(1).max(72)).min(1).max(5).default(['supporting detail']),
  visualSignature: z.string().min(3).max(120).default('unique-scene'),
  conceptTags: z.array(z.string().min(1).max(36)).max(10).default([]),
  forbiddenTags: z.array(z.string().min(1).max(36)).max(10).default([]),
  alignmentScore: z.number().min(0).max(1).default(0),
  continuityGroup: z.string().min(1).max(36).default('main'),
  shotType: z.enum(['macro','wide','overhead','profile','diagram','dossier','comparison']).default('diagram')
});

export const FactoryPlanSchema = z.object({
  version: z.union([z.literal(1),z.literal(2),z.literal(3)]),
  topic: z.string().min(2),
  slug: z.string().min(2),
  title: z.string().min(2),
  hook: z.string().min(5),
  category: z.string().min(2),
  language: z.enum(['tr','en']),
  duration: z.number().min(38).max(55),
  fps: z.literal(30),
  seed: z.number().int().nonnegative(),
  narration: z.string().min(80),
  musicMode: z.enum(['off','soft-documentary']).default('off'),
  palette: z.object({paper:z.string(),ink:z.string(),red:z.string(),teal:z.string(),gold:z.string(),blue:z.string()}),
  research: z.array(z.object({title:z.string(),url:z.string().url(),excerpt:z.string()})).max(8),
  scenes: z.array(ScenePlanSchema).min(10).max(20),
  v3: z.object({
    planner: z.literal('topic-locked'),
    audioMode: z.literal('continuous-word-timed'),
    maxSilenceGap: z.number().max(0.35),
    repetitionThreshold: z.number().min(0).max(1),
    profile: z.string()
  }).optional()
});

export type FactoryPlan = z.infer<typeof FactoryPlanSchema>;
export type ScenePlan = z.infer<typeof ScenePlanSchema>;
export type VisualKind = z.infer<typeof VisualKindSchema>;
export type VisualBeat = z.infer<typeof VisualBeatSchema>;
