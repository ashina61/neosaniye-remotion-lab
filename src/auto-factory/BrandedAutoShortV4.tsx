import React from 'react';
import {AbsoluteFill} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {AutoShortV4} from './AutoShortV4';
import {AdaptiveDocumentaryAutoShortV7} from './AdaptiveDocumentaryAutoShortV7';
import {BrandWatermark} from './BrandWatermark';
import {RepresentationalAutoShortV8} from './RepresentationalAutoShortV8';
import {RepresentationalAutoShortV9} from './RepresentationalAutoShortV9';
import {SemanticAutoShortV5} from './SemanticAutoShortV5';
import {UniversalSemanticAutoShortV6Safe} from './UniversalSemanticAutoShortV6Safe';

const scenes = ((planJson as unknown as {
  scenes?: Array<{
    semanticLockRule?: unknown;
    v9Blueprint?: {sceneFamily?: unknown};
    visualContract?: {version?: unknown};
    motionContract?: {version?: unknown};
  }>;
}).scenes ?? []);

const useV9SemanticRenderer = scenes.length > 0 && scenes.every(
  (scene) => typeof scene.v9Blueprint?.sceneFamily === 'string',
);
const useV8DirectorRenderer = scenes.length > 0 && scenes.every(
  (scene) => scene.visualContract?.version === 8 && scene.motionContract?.version === 8,
);
const useAdaptiveRenderer = scenes.length > 0 && scenes.every(
  (scene) => scene.visualContract?.version === 7,
);
const useSpecializedRenderer = scenes.length > 0 && scenes.every(
  (scene) => typeof scene.semanticLockRule === 'string',
);
const useUniversalRenderer = scenes.length > 0 && scenes.every(
  (scene) => scene.visualContract?.version === 6,
);

export const BrandedAutoShortV4: React.FC = () => (
  <AbsoluteFill>
    {useV9SemanticRenderer ? (
      <RepresentationalAutoShortV9 />
    ) : useV8DirectorRenderer ? (
      <RepresentationalAutoShortV8 />
    ) : useAdaptiveRenderer ? (
      <AdaptiveDocumentaryAutoShortV7 />
    ) : useSpecializedRenderer ? (
      <SemanticAutoShortV5 />
    ) : useUniversalRenderer ? (
      <UniversalSemanticAutoShortV6Safe />
    ) : (
      <AutoShortV4 />
    )}
    <BrandWatermark />
  </AbsoluteFill>
);
