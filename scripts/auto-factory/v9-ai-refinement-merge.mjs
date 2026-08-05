const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const sanitizeAiText = (value) => clean(value)
  .replace(/generic floating cards/gi, 'dashboard-style card layouts')
  .replace(/decorative geometry as (?:the )?hero/gi, 'abstract decoration as the central subject')
  .replace(/single icon explains?/gi, 'one-symbol shorthand')
  .replace(/random circles and lines/gi, 'arbitrary geometric marks');
const unique = (values) => [...new Set((values || []).map(sanitizeAiText).filter(Boolean))];

export const mergeV9ArtDirection = ({scene, candidate, provider, model}) => {
  const current = scene.v9Blueprint || {};
  const lockedFamily = clean(current.sceneFamily);
  const lockedArchetype = clean(current.sceneArchetype);
  if (!lockedFamily || !lockedArchetype) {
    throw new Error(`Scene ${scene.id} is missing a locked V9 family/archetype.`);
  }
  if (!candidate) {
    return {
      ...current,
      sceneId: Number(scene.id),
      sceneFamily: lockedFamily,
      sceneArchetype: lockedArchetype,
    };
  }

  const foreground = unique(candidate.foreground || candidate.layerPlan?.foreground);
  const midground = unique(candidate.midground || candidate.layerPlan?.midground);
  const background = unique(candidate.background || candidate.layerPlan?.background);
  const worldEntities = unique([
    ...(current.worldEntities || []),
    ...(candidate.worldEntities || candidate.visibleEntities || candidate.subjects || []),
  ]).slice(0, 10);
  const rawPrompt = sanitizeAiText(candidate.imagePrompt || candidate.prompt || candidate.assetPlan?.prompt);
  const basePrompt = rawPrompt.length >= 40 ? rawPrompt : clean(current.assetPlan?.prompt);
  const lockSuffix = `Locked scene family: ${lockedFamily}. Locked scene archetype: ${lockedArchetype}.`;
  const prompt = `${basePrompt} ${lockSuffix} Avoid dashboard layouts and abstract decorative marks. No readable text, captions, logos or watermarks.`;

  return {
    ...current,
    sceneId: Number(scene.id),
    sceneFamily: lockedFamily,
    sceneArchetype: lockedArchetype,
    familyDecisionSource: current.familyDecisionSource,
    visualStatement: sanitizeAiText(candidate.visualStatement || candidate.sceneDescription) || current.visualStatement,
    worldEntities: worldEntities.length >= 2 ? worldEntities : current.worldEntities,
    spatialRelations: [
      foreground.length ? `foreground: ${foreground.join(', ')}` : current.spatialRelations?.[0],
      midground.length ? `midground: ${midground.join(', ')}` : current.spatialRelations?.[1],
      background.length ? `background: ${background.join(', ')}` : current.spatialRelations?.[2],
    ].filter(Boolean),
    layerPlan: {
      foreground: foreground.length ? foreground : current.layerPlan?.foreground,
      midground: midground.length ? midground : current.layerPlan?.midground,
      background: background.length ? background : current.layerPlan?.background,
    },
    motionIntent: {
      ...(current.motionIntent || {}),
      camera: sanitizeAiText(candidate.camera || candidate.motionIntent?.camera) || current.motionIntent?.camera,
      heroAction: sanitizeAiText(candidate.heroAction || candidate.motionIntent?.heroAction) || current.motionIntent?.heroAction,
      transitionObject: sanitizeAiText(candidate.transitionObject || candidate.motionIntent?.transitionObject) || current.motionIntent?.transitionObject,
    },
    assetPlan: {
      ...(current.assetPlan || {}),
      prompt,
    },
    aiArtDirection: {
      provider,
      model,
      refined: true,
    },
  };
};
