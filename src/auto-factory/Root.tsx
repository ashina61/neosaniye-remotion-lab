import React from 'react';
import {Composition} from 'remotion';
import {AUTO_FACTORY_V3_FRAMES} from './AutoShortV3';
import {BrandedAutoShortV3} from './BrandedAutoShortV3';

export const AutoFactoryRoot: React.FC = () => (
  <Composition
    id="NeoSaniyeAuto"
    component={BrandedAutoShortV3}
    durationInFrames={AUTO_FACTORY_V3_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
