import {z} from 'zod';

export const CameraSchema = z.enum(['wide','medium','close','macro','overhead','pov','low-angle','high-angle']);
export const MovementSchema = z.enum(['zoom-in','zoom-out','pan-left','pan-right','push-in','pull-out','drift-up','drift-down','static']);
export const SceneKindSchema = z.enum(['landscape','architecture','object','person','crowd','map','mechanism','document','explosion','abstract']);

export const ShotSchema = z.object({
  id: z.number().int().positive(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  caption: z.string().min(1),
  visual: z.string().min(1),
  camera: CameraSchema,
  movement: MovementSchema,
  sceneKind: SceneKindSchema,
  mood: z.string(),
  imagePrompt: z.string(),
  asset: z.string().optional(),
  cropX: z.number().min(0).max(100).default(50),
  cropY: z.number().min(0).max(100).default(50)
});

export const StoryboardSchema = z.object({
  version: z.literal(3),
  topic: z.string().min(1),
  title: z.string().min(1),
  script: z.string().min(1),
  duration: z.number().positive(),
  fps: z.number().int().positive(),
  shots: z.array(ShotSchema).min(12).max(40)
});

export type Shot = z.infer<typeof ShotSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

const cameras: Shot['camera'][] = ['wide','close','macro','pov','overhead','medium','low-angle','high-angle'];
const movements: Shot['movement'][] = ['push-in','pan-right','zoom-in','pan-left','pull-out','drift-up','zoom-out','drift-down'];
const kinds: Shot['sceneKind'][] = ['landscape','architecture','object','person','crowd','map','mechanism','document','explosion','abstract'];

const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

export const chunkCaption = (text: string, maxWords = 5): string[] => {
  const sentences = clean(text).split(/(?<=[.!?…])\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (const sentence of sentences) {
    const words = sentence.replace(/[.!?…]+$/g, '').split(' ').filter(Boolean);
    let cursor = 0;
    while (cursor < words.length) {
      const remaining = words.length - cursor;
      const size = remaining <= maxWords + 1 ? remaining : maxWords;
      chunks.push(words.slice(cursor, cursor + size).join(' '));
      cursor += size;
    }
  }
  return chunks.filter(Boolean);
};

export const buildFallbackScript = (topic: string): string => {
  return `${topic}, göründüğünden çok daha büyük bir hikâye taşıyor. Her şey kritik bir anda başladı. İnsanlar, koşullar ve beklenmedik bir ayrıntı olayların yönünü değiştirdi. En önemli gelişme gözden kaçan küçük bir detaydı. Sonuçları yalnızca o günü değil, sonrasını da etkiledi. Bugün bu konuyu hatırlamamızın nedeni tam olarak bu kırılma noktası.`;
};

export function buildStoryboard(topic: string, scriptInput?: string, targetDuration = 30): Storyboard {
  const script = clean(scriptInput || buildFallbackScript(topic));
  const captions = chunkCaption(script, 5);
  const wantedShots = Math.max(18, Math.min(30, captions.length || 24));
  const beatDuration = targetDuration / wantedShots;

  const shots = Array.from({length: wantedShots}, (_, index): Shot => {
    const caption = captions[index % captions.length] || topic;
    const camera = cameras[index % cameras.length];
    const movement = movements[(index * 3) % movements.length];
    const sceneKind = kinds[(index * 7) % kinds.length];
    const phase = index < 3 ? 'hook' : index >= wantedShots - 3 ? 'final reveal' : 'development';

    return {
      id: index + 1,
      start: Number((index * beatDuration).toFixed(3)),
      duration: Number(beatDuration.toFixed(3)),
      caption,
      visual: `${topic}; ${caption}; ${phase}`,
      camera,
      movement,
      sceneKind,
      mood: phase === 'hook' ? 'urgent cinematic mystery' : phase === 'final reveal' ? 'powerful resolution' : 'documentary tension',
      imagePrompt: `Vertical 9:16 cinematic documentary illustration about ${topic}. Show: ${caption}. Scene type: ${sceneKind}. Camera: ${camera}. Mood: ${phase}. Unique composition, believable detail, layered depth, no readable text, no captions, no logos, no watermark.`,
      cropX: [50,34,66,42,58,27,73,46][index % 8],
      cropY: [50,38,62,28,70,44,56,34][index % 8]
    };
  });

  return StoryboardSchema.parse({version: 3, topic, title: topic, script, duration: targetDuration, fps: 30, shots});
}
