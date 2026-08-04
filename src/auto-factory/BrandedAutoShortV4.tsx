import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AutoShortV4} from './AutoShortV4';
import {BrandWatermark} from './BrandWatermark';

export const BrandedAutoShortV4: React.FC = () => (
  <AbsoluteFill>
    <AutoShortV4 />
    <BrandWatermark />
  </AbsoluteFill>
);
