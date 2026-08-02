import {z} from 'zod';

export const VisualKindSchema = z.enum([
  'world-network',
  'currency',
  'timeline',
  'map-route',
  'factory',
  'document',
  'treaty-table',
  'commodity',
  'institution',
  'link-break',
  'mechanism',
  'crowd'
]);

export const LayoutSchema = z.enum([
  'hero',
  'split-left',
  'split-right',
  'diagonal',
  'overhead',
  'stacked'
]);

export const TransitionSchema = z.enum(['paper-swipe', 'flash-cut', 'zoom-through', 'ink-wipe']);
export const MotionSchema = z.enum(['push', 'orbit', 'drift', 'stamp', 'draw', 'cascade']);
export const SfxSchema = z.enum(['impact', 'paper', 'stamp', 'click', 'crack', 'pulse', 'whoosh', 'none']);

export const ScenePlanSchema = z.object({
  id: z.number().int().positive(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  title: z.string().min(1).max(60),
  kicker: z.string().max(80),
  visualKind: VisualKindSchema,
  layout: LayoutSchema,
  transition: TransitionSchema,
  motion: MotionSchema,
  sfx: SfxSchema,
  accent: z.enum(['red', 'teal', 'gold', 'blue']),
  props: z.array(z.string().min(1).max(28)).min(2).max(6),
  imagePrompt: z.string().min(20),
  asset: z.string().optional()
});

export const FactoryPlanSchema = z.object({
  version: z.literal(1),
  topic: z.string().min(2),
  slug: z.string().min(2),
  title: z.string().min(2),
  hook: z.string().min(5),
  category: z.string().min(2),
  language: z.enum(['tr', 'en']),
  duration: z.number().min(38).max(55),
  fps: z.literal(30),
  seed: z.number().int().nonnegative(),
  narration: z.string().min(120),
  palette: z.object({
    paper: z.string(),
    ink: z.string(),
    red: z.string(),
    teal: z.string(),
    gold: z.string(),
    blue: z.string()
  }),
  research: z.array(z.object({title: z.string(), url: z.string().url(), excerpt: z.string()})).max(8),
  scenes: z.array(ScenePlanSchema).min(12).max(20)
});

export type FactoryPlan = z.infer<typeof FactoryPlanSchema>;
export type ScenePlan = z.infer<typeof ScenePlanSchema>;
export type VisualKind = z.infer<typeof VisualKindSchema>;
