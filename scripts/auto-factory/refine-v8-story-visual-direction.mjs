import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];

const lower = (value) => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
const countBy = (values) => values.reduce((result, value) => {
  result[value] = (result[value] || 0) + 1;
  return result;
}, {});

const modeForKind = (scene, direction) => {
  const domain = String(direction.domain || '');
  const kind = String(scene.storyDirectorKind || '');
  const text = lower(`${scene.title} ${scene.kicker} ${scene.voiceLine} ${direction.subject}`);

  if (domain === 'technology-systems') {
    if (kind === 'cross-section') return 'technical-cutaway';
    if (kind === 'network') return 'system-map';
    if (kind === 'mechanism' && /repeater|amplif|restore|signal station/.test(text)) return 'realistic-object';
    if (kind === 'mechanism') return 'technical-cutaway';
    if (kind === 'comparison' && /anchor|fishing|shore|coast|armor|armour/.test(text)) return 'realistic-object';
    if (kind === 'evidence' && /repair|ship|raise|splice|replace|fault/.test(text)) return 'realistic-object';
    if (['realistic-object', 'environment', 'comparison', 'evidence'].includes(kind)) return 'realistic-object';
  }
  if (/history/.test(domain)) {
    if (kind === 'network') return 'cartographic';
    if (kind === 'evidence') return 'archival-evidence';
    return 'historical-reconstruction';
  }
  if (domain === 'biological-micro') {
    if (kind === 'network') return 'data-evidence';
    if (kind === 'comparison') return 'comparison-lab';
    if (kind === 'cross-section' || kind === 'mechanism') return 'process-cutaway';
    return 'scientific-macro';
  }
  if (domain === 'nature-field') {
    if (kind === 'network') return 'ecological-map';
    if (kind === 'cross-section' || kind === 'mechanism') return 'scientific-macro';
    if (kind === 'comparison') return 'behavior-closeup';
    return 'environmental-realism';
  }
  if (domain === 'space-cosmic') {
    if (kind === 'network') return 'orbital-diagram';
    if (kind === 'comparison') return 'scale-comparison';
    return 'cosmic-reconstruction';
  }
  return direction.sceneMode;
};

const compositionFor = (scene, mode, index) => {
  const text = lower(`${scene.title} ${scene.voiceLine}`);
  if (mode === 'realistic-object') {
    if (/ship|lay|survey|route/.test(text)) return 'cable-ship-operation';
    if (/landing|shore|station|terrestrial|data center/.test(text)) return 'shore-landing-station';
    if (/anchor|fishing|coast|armor|armour/.test(text)) return 'anchor-hazard';
    if (/repair|raise|splice|replace|fault/.test(text)) return 'repair-ship-operation';
    if (/repeater|restore|amplif/.test(text)) return 'repeater-line';
    return ['foreground-hero', 'wide-establishing', 'depth-corridor'][index % 3];
  }
  if (/cutaway/.test(mode)) {
    if (/light|laser|pulse|reflection|glass core/.test(text)) return 'signal-through-core';
    if (/layer|armor|armour|insulation|conductor/.test(text)) return 'exploded-axis';
    return ['transparent-shell', 'layer-peel', 'signal-through-core'][index % 3];
  }
  if (/map|cartographic/.test(mode)) {
    if (/redundan|alternate|multiple route/.test(text)) return 'redundant-route-map';
    return ['route-diagonal', 'network-radial', 'map-zoom'][index % 3];
  }
  return direction.composition;
};

const heroTypeFor = (mode) => {
  if (/map|cartographic/.test(mode)) return 'map';
  if (/cutaway|diagram/.test(mode)) return 'cutaway';
  if (/archive|evidence/.test(mode)) return 'document';
  if (/macro/.test(mode)) return 'micro';
  if (/environment|reconstruction/.test(mode)) return 'environment';
  return 'object';
};

const presentationFor = (mode) => {
  if (/realistic-object|reconstruction|environment|cosmic|scientific-macro|behavior/.test(mode)) return 'realistic';
  if (/archive|portrait/.test(mode)) return 'archival';
  return 'diagram';
};

let changed = 0;
for (let index = 0; index < scenes.length; index += 1) {
  const scene = scenes[index];
  const contract = scene.visualContract;
  if (!contract || contract.version !== 8 || !contract.visualDirection) {
    throw new Error(`V8 story visual refinement requires V8 visual direction; scene ${scene.id} is invalid.`);
  }
  if (!scene.storyDirectorKind) continue;
  const direction = contract.visualDirection;
  const mode = modeForKind(scene, direction);
  const composition = compositionFor(scene, mode, index);
  const heroAssetType = heroTypeFor(mode);
  const presentationClass = presentationFor(mode);
  const realismScore = presentationClass === 'realistic' ? 0.88 : presentationClass === 'archival' ? 0.78 : 0.64;
  const environment = composition === 'cable-ship-operation'
    ? 'open-ocean-cable-laying'
    : composition === 'shore-landing-station'
      ? 'coastal-cable-landing-station'
      : composition === 'anchor-hazard'
        ? 'shallow-water-anchor-zone'
        : composition === 'repair-ship-operation'
          ? 'open-ocean-cable-repair'
          : composition === 'repeater-line'
            ? 'deep-ocean-repeater-chain'
            : direction.environment;
  scene.visualContract = {
    ...contract,
    visualDirection: {
      ...direction,
      sceneMode: mode,
      composition,
      heroAssetType,
      presentationClass,
      realismScore,
      environment,
      renderStrategy: presentationClass === 'realistic' ? 'procedural-reconstruction' : 'hybrid-explainer',
      assetPriority: presentationClass === 'realistic' ? 'generate-if-available' : 'optional',
      depthPlan: {
        foreground: composition.includes('ship') ? 'physical vessel, cable equipment and crew-scale machinery' : direction.depthPlan?.foreground,
        midground: environment,
        background: presentationClass === 'realistic' ? 'believable physical environment with atmospheric depth' : direction.depthPlan?.background,
      },
    },
  };
  scene.imagePrompt = `Vertical 9:16 believable premium documentary reconstruction about ${plan.topic}. Scene: ${scene.voiceLine} Show ${scene.visualContract.visualDirection.subject} in ${environment.replace(/-/g, ' ')}. Required physical details: ${(scene.visualConcepts || scene.mustShow || []).join(', ')}. Composition: ${composition.replace(/-/g, ' ')}. Use realistic scale, materials, lighting, depth and environmental context. Avoid generic maps unless the scene is a network scene, avoid floating cards, unrelated geometry, readable captions, logos and watermarks.`;
  scene.visualSignature = `visual-v8-story:${direction.domain}:${mode}:${composition}:${scene.id}`.slice(0, 220);
  changed += 1;
}

if (changed) {
  const modes = scenes.map((scene) => scene.visualContract?.visualDirection?.sceneMode).filter(Boolean);
  const presentations = scenes.map((scene) => scene.visualContract?.visualDirection?.presentationClass).filter(Boolean);
  const compositions = scenes.map((scene) => scene.visualContract?.visualDirection?.composition).filter(Boolean);
  plan.v8 = {
    ...(plan.v8 || {}),
    visualDirector: {
      ...(plan.v8?.visualDirector || {}),
      sceneModes: [...new Set(modes)],
      presentationCounts: countBy(presentations),
      compositionCount: new Set(compositions).size,
      storyKindsApplied: true,
      storyKindSceneCount: changed,
      physicalSceneCount: modes.filter((mode) => mode === 'realistic-object').length,
    },
  };
  if (new Set(modes).size < Math.min(3, scenes.length)) {
    throw new Error(`V8 story visual refinement produced insufficient mode diversity: ${[...new Set(modes)].join(', ')}`);
  }
  if (plan.storyDirector?.id === 'undersea-cable-mechanism-v1') {
    const physical = modes.filter((mode) => mode === 'realistic-object').length;
    const maps = modes.filter((mode) => mode === 'system-map').length;
    const cutaways = modes.filter((mode) => mode === 'technical-cutaway').length;
    if (physical < 5 || maps > 2 || cutaways < 2) {
      throw new Error(`Undersea cable V8 direction must prioritize physical scenes: physical=${physical}, maps=${maps}, cutaways=${cutaways}.`);
    }
  }
}

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V8 story visual direction refined: scenes=${changed}, modes=${[...new Set(scenes.map((scene) => scene.visualContract?.visualDirection?.sceneMode).filter(Boolean))].join(',')}`);
