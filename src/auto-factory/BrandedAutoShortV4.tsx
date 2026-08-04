import React from 'react';
import {AbsoluteFill} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {AutoShortV4} from './AutoShortV4';
import {BrandWatermark} from './BrandWatermark';
import {SemanticAutoShortV5} from './SemanticAutoShortV5';

const scenes = ((planJson as unknown as {scenes?: Array<{semanticLockRule?: unknown}>}).scenes ?? []);
const useSemanticRenderer = scenes.length > 0 && scenes.every((scene) => typeof scene.semanticLockRule === 'string');

export const BrandedAutoShortV4: React.FC = () => (
  <AbsoluteFill>
    {useSemanticRenderer ? <SemanticAutoShortV5 /> : <AutoShortV4 />}
    <BrandWatermark />
  </AbsoluteFill>
);
