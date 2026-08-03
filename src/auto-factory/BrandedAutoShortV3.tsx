import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AutoShortV3} from './AutoShortV3';
import {BrandWatermark} from './BrandWatermark';

export const BrandedAutoShortV3: React.FC = () => (
  <AbsoluteFill>
    <AutoShortV3 />
    <BrandWatermark />
  </AbsoluteFill>
);
