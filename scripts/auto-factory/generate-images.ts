import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {FactoryPlanSchema} from '../../src/auto-factory/schema.js';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const outputDir = process.env.IMAGE_OUTPUT_DIR || 'public/auto-factory/images';
const mode = process.env.VISUAL_MODE || 'hybrid';
const apiKey = process.env.POLLINATIONS_API_KEY;
const imageModel = process.env.POLLINATIONS_IMAGE_MODEL || 'zimage';
const plan = FactoryPlanSchema.parse(JSON.parse(await readFile(planPath,'utf8')));
const requestedCount = mode === 'procedural' ? 0 : mode === 'ai-heavy' ? 8 : 4;
const imageCount = Math.min(requestedCount,plan.scenes.length);

if (!imageCount) {
  console.log('Prosedürel mod: AI görsel üretilmeyecek.');
  process.exit(0);
}
if (!apiKey) {
  console.warn('POLLINATIONS_API_KEY yok; hibrit çizim motoru yalnızca prosedürel SVG ile devam edecek.');
  process.exit(0);
}

await mkdir(outputDir,{recursive:true});
const selectedIndexes = Array.from({length:imageCount},(_,index)=>Math.min(plan.scenes.length-1,Math.floor((index+.45)*plan.scenes.length/imageCount)));
const sleep = (ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

const download = async (prompt:string,path:string,seed:number) => {
  const fullPrompt = `${prompt}. Premium Netflix-style editorial documentary collage, hand-cut paper layers, believable detail, foreground middle ground background separation, muted cream black dark red mustard teal palette, vertical 9:16, no readable text, no letters, no captions, no logo, no watermark.`;
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(fullPrompt)}?model=${encodeURIComponent(imageModel)}&width=768&height=1344&seed=${seed}`;
  let lastError:unknown;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response = await fetch(url,{headers:{authorization:`Bearer ${apiKey}`}});
      if(!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      const contentType=response.headers.get('content-type')||'';
      if(!contentType.startsWith('image/')) throw new Error(`Beklenmeyen içerik türü: ${contentType}`);
      const bytes=Buffer.from(await response.arrayBuffer());
      if(bytes.length<15000) throw new Error(`Görsel çok küçük: ${bytes.length}`);
      await writeFile(path,bytes);
      return;
    }catch(error){lastError=error;console.warn(`${path} deneme ${attempt}/3 başarısız`,error);await sleep(1200*attempt);}
  }
  throw lastError;
};

for(let index=0;index<selectedIndexes.length;index++){
  const sceneIndex=selectedIndexes[index];
  const scene=plan.scenes[sceneIndex];
  const name=`scene-${String(scene.id).padStart(2,'0')}.jpg`;
  try{
    await download(scene.imagePrompt,`${outputDir}/${name}`,plan.seed+scene.id*997);
    scene.asset=`auto-factory/images/${name}`;
    console.log(`AI katmanı hazır: ${name}`);
  }catch(error){
    console.warn(`Sahne ${scene.id} prosedürel çizimle devam edecek.`,error);
  }
  await sleep(500);
}

await writeFile(planPath,JSON.stringify(plan,null,2),'utf8');
console.log(`${plan.scenes.filter(scene=>scene.asset).length} AI görseli plana bağlandı.`);
