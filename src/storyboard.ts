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
  asset: z.string()
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

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();

export function buildStoryboard(topic: string, script: string, targetDuration = 30): Storyboard {
  const sentences = clean(script).split(/(?<=[.!?])\s+/).filter(Boolean);
  const wantedShots = Math.max(24, Math.min(40, Math.round(targetDuration / 0.9)));
  const beatDuration = targetDuration / wantedShots;

  const shots = Array.from({length: wantedShots}, (_, index): Shot => {
    const narration = sentences[index % Math.max(sentences.length, 1)] ?? topic;
    const camera = cameras[index % cameras.length];
    const movement = movements[(index * 3) % movements.length];
    const focusModes = ['environment','main subject','critical detail','human reaction','mechanism','evidence','consequence','final reveal'];
    const focus = focusModes[index % focusModes.length];
    const visual = `${topic}: ${focus}; shot ${index + 1}, visually distinct composition`;

    return {
      id: index + 1,
      start: Number((index * beatDuration).toFixed(3)),
      duration: Number(beatDuration.toFixed(3)),
      narration,
      visual,
      camera,
      movement,
      mood: index < 4 ? 'urgent mystery' : index > wantedShots - 4 ? 'powerful resolution' : 'cinematic documentary',
      imagePrompt: `Create one vertical 9:16 cinematic documentary illustration about ${topic}. Focus on ${focus}. Camera: ${camera}. Movement intention: ${movement}. Composition must be unique and clearly different from adjacent shots. Historically or scientifically believable when relevant. Strong foreground, middle ground and background separation. No readable text, captions, logos or watermark.`,
      asset: `shots/${String(index + 1).padStart(2, '0')}.jpg`
    };
  });

  return StoryboardSchema.parse({
    topic,
    title: topic,
    duration: targetDuration,
    fps: 30,
    shots
  });
}
