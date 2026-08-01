import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {StoryboardSchema} from '../src/storyboard.js';

const storyboardPath = process.argv[2] ?? 'public/storyboard.json';
const outputDir = process.argv[3] ?? 'public/shots';
const apiKey = process.env.POLLINATIONS_API_KEY;
const imageModel = process.env.POLLINATIONS_IMAGE_MODEL || 'zimage';
const imageCount = Math.max(6, Math.min(12, Number(process.env.IMAGE_COUNT || 12)));

if (!apiKey) {
  console.warn('POLLINATIONS_API_KEY yok; prosedürel görseller kullanılacak.');
  process.exit(0);
}

const storyboard = StoryboardSchema.parse(JSON.parse(await readFile(storyboardPath, 'utf8')));
await mkdir(outputDir, {recursive: true});

const selected = Array.from({length: imageCount}, (_, index) => {
  const shotIndex = Math.min(storyboard.shots.length - 1, Math.floor(index * storyboard.shots.length / imageCount));
  return storyboard.shots[shotIndex];
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const downloadImage = async (prompt: string, filePath: string, seed: number) => {
  const encoded = encodeURIComponent(`${prompt}. Consistent cinematic editorial documentary style, vertical 9:16, no text, no letters, no logo, no watermark.`);
  const url = `https://gen.pollinations.ai/image/${encoded}?model=${encodeURIComponent(imageModel)}&width=768&height=1344&seed=${seed}`;

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {headers: {authorization: `Bearer ${apiKey}`}});
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const type = response.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error(`Beklenmeyen içerik türü: ${type}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 10_000) throw new Error(`Görsel çok küçük: ${bytes.length} byte`);
      await writeFile(filePath, bytes);
      return;
    } catch (error) {
      lastError = error;
      console.warn(`Görsel denemesi ${attempt}/3 başarısız: ${filePath}`, error);
      await sleep(1500 * attempt);
    }
  }
  throw lastError;
};

for (let index = 0; index < selected.length; index += 1) {
  const fileName = `${String(index + 1).padStart(2, '0')}.jpg`;
  await downloadImage(selected[index].imagePrompt, `${outputDir}/${fileName}`, 6100 + index * 97);
  console.log(`Görsel hazır: ${fileName}`);
  await sleep(700);
}

const shots = storyboard.shots.map((shot, index) => ({
  ...shot,
  asset: `shots/${String((index % imageCount) + 1).padStart(2, '0')}.jpg`
}));

await writeFile(storyboardPath, JSON.stringify({...storyboard, shots}, null, 2), 'utf8');
console.log(`${imageCount} Pollinations görseli üretildi ve storyboard'a bağlandı.`);
