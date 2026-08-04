import React from 'react';
import {Composition} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {BrandedAutoShortV4} from './BrandedAutoShortV4';

const durationInFrames = Math.round(Number((planJson as {duration: number}).duration) * 30);

export const AutoFactoryRoot: React.FC = () => (
  <Composition
    id="NeoSaniyeAuto"
    component={BrandedAutoShortV4}
    durationInFrames={durationInFrames}
    fps={30}
    width={1080}
    height={1920}
  />
);
