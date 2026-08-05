import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import process from 'node:process';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const outputDir = process.env.V9_ASSET_DIR || 'public/auto-factory/assets/v9';
const maximum = Math.max(0, Number(process.env.V9_MAX_AI_IMAGES || plan.v9?.maxAiImagesPerVideo || 4));
const providerMode = String(process.env.V9_IMAGE_PROVIDER || 'auto').trim().toLowerCase();

const clean = (value) => String(value ?? '').trim();
const available = {
  cloudflare: Boolean(clean(process.env.CLOUDFLARE_ACCOUNT_ID) && clean(process.env.CLOUDFLARE_API_TOKEN)),
  pollinations: Boolean(clean(process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY)),
};

const chooseProvider = () => {
  if (providerMode !== 'auto') return available[providerMode] ? providerMode : 'none';
  if (available.cloudflare) return 'cloudflare';
  if (available.pollinations) return 'pollinations';
  return 'none';
};

const provider = chooseProvider();
const manifest = {
  version: 1,
  provider,
  maximum,
  generated: [],
  skipped: [],
  errors: [],
};

const timeoutSignal = (milliseconds = 90_000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('V9 image request timed out.')), milliseconds);
  return {signal: controller.signal, clear: () => clearTimeout(timer)};
};

const generateCloudflare = async (prompt, seed) => {
  const accountId = clean(process.env.CLOUDFLARE_ACCOUNT_ID);
  const token = clean(process.env.CLOUDFLARE_API_TOKEN);
  const model = clean(process.env.V9_CLOUDFLARE_IMAGE_MODEL) || '@cf/black-forest-labs/flux-1-schnell';
  const {signal, clear} = timeoutSignal();
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`,
      {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          seed,
          steps: Math.max(4, Math.min(8, Number(process.env.V9_IMAGE_STEPS || 6))),
        }),
      },
    );
    const payload = await response.json();
    if (!response.ok || payload?.success === false) {
      throw new Error(payload?.errors?.[0]?.message || `Cloudflare image HTTP ${response.status}`);
    }
    const image = payload?.result?.image || payload?.image;
    if (!image) throw new Error('Cloudflare image response has no base64 image.');
    return {bytes: Buffer.from(image, 'base64'), extension: '.jpg', model};
  } finally {
    clear();
  }
};

const generatePollinations = async (prompt) => {
  const token = clean(process.env.POLLINATIONS_API_KEY || process.env.POLLINATIONS_KEY);
  const model = clean(process.env.V9_POLLINATIONS_IMAGE_MODEL || process.env.POLLINATIONS_IMAGE_MODEL) || 'zimage';
  const {signal, clear} = timeoutSignal();
  try {
    const response = await fetch('https://gen.pollinations.ai/v1/images/generations', {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model,
        n: 1,
        size: '1024x1792',
        quality: 'medium',
        response_format: 'b64_json',
        safe: true,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error?.message || `Pollinations image HTTP ${response.status}`);
    }
    const image = payload?.data?.[0]?.b64_json;
    if (!image) throw new Error('Pollinations image response has no base64 image.');
    return {bytes: Buffer.from(image, 'base64'), extension: '.jpg', model};
  } finally {
    clear();
  }
};

const generators = {
  cloudflare: generateCloudflare,
  pollinations: generatePollinations,
};

const candidates = (plan.scenes || [])
  .filter((scene) => scene?.v9Blueprint?.assetPlan?.aiImageRecommended)
  .sort((left, right) => (
    Number(right.v9Blueprint.assetPlan.aiImagePriority || 0)
    - Number(left.v9Blueprint.assetPlan.aiImagePriority || 0)
  ))
  .slice(0, maximum);

await mkdir(outputDir, {recursive: true});

for (const scene of plan.scenes || []) {
  if (!candidates.includes(scene)) {
    manifest.skipped.push({sceneId: scene.id, reason: 'not-selected-or-budget'});
  }
}

if (provider === 'none') {
  manifest.errors.push({
    sceneId: null,
    provider: 'none',
    error: 'No free image provider credentials configured; representational renderer fallback remains active.',
  });
} else {
  for (const scene of candidates) {
    try {
      const prompt = clean(scene.v9Blueprint.assetPlan.prompt);
      const seed = Number(plan.seed || 1) + Number(scene.id || 0) * 997;
      const result = await generators[provider](prompt, seed);
      const relativePath = join(outputDir, `scene-${String(scene.id).padStart(2, '0')}${result.extension}`);
      await mkdir(dirname(relativePath), {recursive: true});
      await writeFile(relativePath, result.bytes);
      scene.asset = {
        type: 'image',
        src: relativePath.replace(/^public\//, ''),
        provider,
        model: result.model,
        semanticV9: true,
      };
      manifest.generated.push({
        sceneId: scene.id,
        path: relativePath,
        provider,
        model: result.model,
        bytes: result.bytes.length,
      });
    } catch (error) {
      manifest.errors.push({
        sceneId: scene.id,
        provider,
        error: clean(error?.message || error).slice(0, 300),
      });
    }
  }
}

plan.v9 = {
  ...(plan.v9 || {}),
  assetProvider: provider,
  assetManifest: `${outputDir}/manifest.json`,
  generatedAiImageCount: manifest.generated.length,
};
await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
await writeFile(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(
  `V9 AI assets ready: provider=${provider}, generated=${manifest.generated.length}, `
  + `errors=${manifest.errors.length}, budget=${maximum}`,
);
