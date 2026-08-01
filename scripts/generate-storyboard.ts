import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {buildStoryboard, StoryboardSchema} from '../src/storyboard.js';

const topic = process.argv[2] ?? process.env.TOPIC ?? 'Dünyanın İlk Trafik Işığı';
const scriptPath = process.argv[3] ?? 'input/script.txt';
const outputPath = process.argv[4] ?? 'public/storyboard.json';
const apiKey = process.env.GEMINI_API_KEY;

const readLocalScript = async (): Promise<string | undefined> => {
  try {
    const value = (await readFile(scriptPath, 'utf8')).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
};

const generateWithGemini = async () => {
  if (!apiKey) return undefined;

  const prompt = `You are a Turkish YouTube Shorts director. Create a factual, punchy 30-second documentary storyboard about: ${topic}.
Return ONLY valid JSON with this exact shape:
{
  "script": "70-95 word Turkish narration",
  "shots": [
    {
      "caption": "3-5 Turkish words",
      "visual": "specific visual description in English",
      "camera": "wide|medium|close|macro|overhead|pov|low-angle|high-angle",
      "movement": "zoom-in|zoom-out|pan-left|pan-right|push-in|pull-out|drift-up|drift-down|static",
      "sceneKind": "landscape|architecture|object|person|crowd|map|mechanism|document|explosion|abstract",
      "mood": "short mood",
      "imagePrompt": "detailed vertical 9:16 image prompt, no text"
    }
  ]
}
Rules: exactly 24 shots; first 3 are rapid hook shots; no generic filler; every shot must depict a distinct subject or framing; captions must preserve meaning and never split names awkwardly; no CTA.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      contents: [{parts: [{text: prompt}]}],
      generationConfig: {responseMimeType: 'application/json', temperature: 0.65}
    })
  });

  if (!response.ok) throw new Error(`Gemini HTTP ${response.status}: ${await response.text()}`);
  const payload = await response.json() as any;
  const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Gemini boş yanıt döndürdü');
  const parsed = JSON.parse(raw);
  const duration = 30;
  const fps = 30;
  const beat = duration / parsed.shots.length;
  return StoryboardSchema.parse({
    version: 3,
    topic,
    title: topic,
    script: parsed.script,
    duration,
    fps,
    shots: parsed.shots.map((shot: any, index: number) => ({
      id: index + 1,
      start: Number((index * beat).toFixed(3)),
      duration: Number(beat.toFixed(3)),
      caption: shot.caption,
      visual: shot.visual,
      camera: shot.camera,
      movement: shot.movement,
      sceneKind: shot.sceneKind,
      mood: shot.mood,
      imagePrompt: shot.imagePrompt,
      cropX: [50,34,66,42,58,27,73,46][index % 8],
      cropY: [50,38,62,28,70,44,56,34][index % 8]
    }))
  });
};

let storyboard;
try {
  storyboard = await generateWithGemini();
  if (storyboard) console.log('Gemini ile konuya özel V3 storyboard üretildi.');
} catch (error) {
  console.warn('Gemini üretimi başarısız; güvenli fallback kullanılacak.', error);
}

if (!storyboard) {
  const localScript = await readLocalScript();
  storyboard = buildStoryboard(topic, localScript, 30);
}

await mkdir(outputPath.split('/').slice(0, -1).join('/') || '.', {recursive: true});
await writeFile(outputPath, JSON.stringify(storyboard, null, 2), 'utf8');
console.log(`V3 storyboard hazır: ${outputPath} (${storyboard.shots.length} plan)`);
