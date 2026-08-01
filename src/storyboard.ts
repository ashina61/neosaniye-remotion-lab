import {z} from 'zod';

export const ShotSchema = z.object({
  id: z.number().int().positive(),
  start: z.number().nonnegative(),
  duration: z.number().positive(),
  narration: z.string(),
  visual: z.string(),
  camera: z.enum(['wide','medium','close','macro','overhead','pov','low-angle','high-angle']),
  movement: z.enum(['zoom-in','zoom-out','pan-left','pan-right','push-in','pull-out','static']),
  mood: z.string(),
  imagePrompt: z.string(),
  asset: z.string(),
  cropX: z.number().min(0).max(100),
  cropY: z.number().min(0).max(100)
});

export const StoryboardSchema = z.object({
  topic: z.string(),
  title: z.string(),
  duration: z.number().positive(),
  fps: z.number().int().positive(),
  shots: z.array(ShotSchema).min(1)
});

export type Shot = z.infer<typeof ShotSchema>;
export type Storyboard = z.infer<typeof StoryboardSchema>;

const cameras: Shot['camera'][] = ['wide','macro','pov','close','overhead','medium','low-angle','high-angle'];
const movements: Shot['movement'][] = ['push-in','pan-right','zoom-in','pan-left','pull-out','zoom-out','static'];
const focusModes = ['environment','main subject','critical detail','human reaction','mechanism','evidence','consequence','final reveal'];

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

const captionChunks = (script: string): string[] => {
  const words = clean(script).split(' ').filter(Boolean);
  if (!words.length) return ['Bu konu', 'şaşırtıcı bir', 'gerçek saklıyor'];
  const chunks: string[] = [];
  let cursor = 0;
  const pattern = [3, 4, 3, 5, 4, 3];
  let i = 0;
  while (cursor < words.length) {
    const size = pattern[i % pattern.length];
    chunks.push(words.slice(cursor, cursor + size).join(' '));
    cursor += size;
    i += 1;
  }
  return chunks;
};

export function buildStoryboard(topic: string, script: string, targetDuration = 30): Storyboard {
  const wantedShots = 24;
  const beatDuration = targetDuration / wantedShots;
  const captions = captionChunks(script);

  const shots = Array.from({length: wantedShots}, (_, index): Shot => {
    const camera = cameras[index % cameras.length];
    const movement = movements[(index * 3) % movements.length];
    const focus = focusModes[index % focusModes.length];
    const assetIndex = (index % 3) + 1;

    return {
      id: index + 1,
      start: Number((index * beatDuration).toFixed(3)),
      duration: Number(beatDuration.toFixed(3)),
      narration: captions[index % captions.length],
      visual: `${topic}: ${focus}; visually distinct composition`,
      camera,
      movement,
      mood: index < 4 ? 'urgent mystery' : index > wantedShots - 4 ? 'powerful resolution' : 'cinematic documentary',
      imagePrompt: `Create one vertical 9:16 cinematic documentary illustration about ${topic}. Focus on ${focus}. Camera: ${camera}. Composition must be clearly different from adjacent shots. Historically or scientifically believable when relevant. Strong foreground, middle ground and background separation. No readable text, captions, logos or watermark.`,
      asset: `shots/${String(assetIndex).padStart(2, '0')}.svg`,
      cropX: [50, 35, 65, 45, 58, 42][index % 6],
      cropY: [50, 42, 58, 36, 64, 48][index % 6]
    };
  });

  return StoryboardSchema.parse({topic, title: topic, duration: targetDuration, fps: 30, shots});
}
