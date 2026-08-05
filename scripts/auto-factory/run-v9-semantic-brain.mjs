import process from 'node:process';

const originalProvider = process.env.V9_AI_PROVIDER;

const run = async (name) => {
  const url = new URL(`./${name}`, import.meta.url);
  url.searchParams.set('run', `${Date.now()}-${Math.random()}`);
  await import(url.href);
};

try {
  // Build and normalize a deterministic contract first. This must never spend AI quota.
  process.env.V9_AI_PROVIDER = 'disabled';
  await run('build-semantic-visual-blueprint-v9.mjs');
  await run('repair-v9-semantic-families.mjs');
  await run('finalize-v9-semantic-contracts.mjs');

  // This is the final semantic authority. No legacy family mutator may run after it.
  await run('lock-v9-spoken-families.mjs');

  // AI may enrich only mise-en-scene, layers, camera and image prompt.
  process.env.V9_AI_PROVIDER = originalProvider || 'auto';
  await run('refine-v9-blueprints-with-ai.mjs');
} finally {
  if (originalProvider === undefined) {
    delete process.env.V9_AI_PROVIDER;
  } else {
    process.env.V9_AI_PROVIDER = originalProvider;
  }
}

console.log('V9 semantic brain orchestration complete: deterministic contracts -> final semantic lock -> optional AI art direction.');
