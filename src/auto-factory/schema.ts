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
  label: z.string().min(1).max(100),
  action: z.enum(['reveal','connect','focus','stamp','swap','highlight','eliminate','multiply','transfer'])
});

export const SemanticActionSchema = z.enum([
  'reveal','transform','compare','connect','spread','filter','assemble','trace','multiply','collapse'
]);

export const SceneGrammarSchema = z.enum([
  'hero-poster','macro-field','selection-field','mechanism-cutaway','cause-chain',
  'exploded-object','timeline-strip','comparison-scale','map-route','spread-network','evidence-board'
]);

export const CameraMoveSchema = z.enum([
  'push-in','pull-out','pan-left','pan-right','orbit','drift-up','drift-down','snap-zoom'
]);

export const TextModeSchema = z.enum(['headline','integrated','stamp','minimal']);
export const CompositionBiasSchema = z.enum(['left','right','center','diagonal','full-frame']);

export const ArtDirectionSchema = z.object({
  world: z.string().min(3).max(48),
  palette: z.object({
    paper: z.string(),
    ink: z.string(),
    primary: z.string(),
    secondary: z.string(),
    highlight: z.string()
  }),
  textures: z.array(z.string().min(2).max(48)).min(1).max(6),
  density: z.enum(['light','medium','dense'])
});

export const TopicProfileSchema = z.object({
  visualWorld: z.string().min(3).max(48),
  primaryMotifs: z.array(z.string().min(2).max(72)).min(4).max(14),
  secondaryMotifs: z.array(z.string().min(2).max(72)).min(2).max(14),
  forbiddenMotifs: z.array(z.string().min(2).max(72)).max(14).default([]),
  paletteMood: z.string().min(2).max(48).default('editorial-documentary'),
  preferredVisualKinds: z.array(VisualKindSchema).min(4).max(14),
  groundingVersion: z.number().int().min(1).default(1)
});

export const ScenePlanSchema = z.object({
  id: z.number().int().positive(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  title: z.string().min(1).max(60),
  kicker: z.string().max(80),
  voiceLine: z.string().max(320).default(''),
  voiceStart: z.number().min(0).max(1.2).default(0.08),
  voiceEndPadding: z.number().min(0.02).max(0.8).default(0.12),
  voiceRate: z.string().regex(/^[+-]\d+%$/).default('+0%'),
  voicePitch: z.string().regex(/^[+-]\d+Hz$/).default('-2Hz'),
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
  sceneGoal: z.string().min(3).max(360).default('Explain the spoken line visually'),
  heroVisual: z.string().min(2).max(90).default('main subject'),
  supportVisuals: z.array(z.string().min(1).max(72)).min(1).max(6).default(['supporting detail']),
  visualSignature: z.string().min(3).max(180).default('unique-scene'),
  conceptTags: z.array(z.string().min(1).max(36)).max(14).default([]),
  forbiddenTags: z.array(z.string().min(1).max(36)).max(14).default([]),
  alignmentScore: z.number().min(0).max(1).default(0),
  continuityGroup: z.string().min(1).max(36).default('main'),
  shotType: z.enum([
    'macro','wide','overhead','profile','diagram','dossier','comparison',
    'hero','process','cinematic-wide'
  ]).default('diagram'),
  visualWorld: z.string().min(3).max(48).default('general-explainer'),
  primaryMotif: z.string().min(2).max(72).default('main subject'),
  secondaryMotif: z.string().min(2).max(72).default('supporting detail'),
  mustShow: z.array(z.string().min(2).max(90)).min(2).max(7).default(['main subject','supporting detail']),
  avoid: z.array(z.string().min(2).max(90)).max(8).default([]),
  subjectTokens: z.array(z.string().min(2).max(36)).min(2).max(14).default(['main','subject']),
  semanticAction: SemanticActionSchema.default('reveal'),
  sceneGrammar: SceneGrammarSchema.default('hero-poster'),
  cameraMove: CameraMoveSchema.optional(),
  textMode: TextModeSchema.optional(),
  compositionBias: CompositionBiasSchema.optional(),
  layerCount: z.number().int().min(5).max(16).optional(),
  matchCutToken: z.string().min(2).max(100).optional(),
  artDirection: ArtDirectionSchema.optional()
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
  topicProfile: TopicProfileSchema.optional(),
  v3: z.object({
    planner: z.literal('topic-locked'),
    audioMode: z.literal('continuous-word-timed'),
    maxSilenceGap: z.number().max(0.35),
    repetitionThreshold: z.number().min(0).max(1),
    profile: z.string()
  }).passthrough().optional(),
  v4: z.object({
    renderer: z.literal('scene-grammar-v4'),
    version: z.literal(4),
    grammarVersion: z.number().int().min(1),
    artDirectionVersion: z.number().int().min(1),
    visualWorld: z.string().min(3),
    fixedBottomCaption: z.literal(false),
    matchCutContinuity: z.boolean(),
    minimumGrammarDiversity: z.number().int().min(4),
    grammarCount: z.number().int().min(4),
    cameraCount: z.number().int().min(3),
    grammarSequence: z.array(SceneGrammarSchema),
    cameraSequence: z.array(CameraMoveSchema),
    artDirection: ArtDirectionSchema
  }).passthrough().optional()
});

export type FactoryPlan = z.infer<typeof FactoryPlanSchema>;
export type ScenePlan = z.infer<typeof ScenePlanSchema>;
export type VisualKind = z.infer<typeof VisualKindSchema>;
export type VisualBeat = z.infer<typeof VisualBeatSchema>;
export type TopicProfile = z.infer<typeof TopicProfileSchema>;
export type SceneGrammar = z.infer<typeof SceneGrammarSchema>;
export type CameraMove = z.infer<typeof CameraMoveSchema>;
export type ArtDirection = z.infer<typeof ArtDirectionSchema>;
