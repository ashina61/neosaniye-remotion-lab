import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {buildStoryboard} from '../src/storyboard.js';

const topic = process.argv[2] ?? 'Dünyanın İlk Trafik Işığı';
const scriptPath = process.argv[3] ?? 'input/script.txt';
const outputPath = process.argv[4] ?? 'public/storyboard.json';

let script: string;
try {
  script = await readFile(scriptPath, 'utf8');
} catch {
  script = `${topic}. Bu konu ilk bakışta sıradan görünebilir. Ancak arkasındaki gerçek, beklenmedik ayrıntılar ve sonuçlar onu şaşırtıcı hale getiriyor. Sonunda bugün kullandığımız sistemlerin nasıl ortaya çıktığını görüyoruz.`;
}

const storyboard = buildStoryboard(topic, script, 30);
await mkdir(outputPath.split('/').slice(0, -1).join('/') || '.', {recursive: true});
await writeFile(outputPath, JSON.stringify(storyboard, null, 2), 'utf8');
console.log(`Storyboard hazır: ${outputPath} (${storyboard.shots.length} plan)`);
