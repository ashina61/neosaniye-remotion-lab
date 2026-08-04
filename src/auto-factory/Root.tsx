import React from 'react';
import {Composition} from 'remotion';
import {AUTO_FACTORY_V4_FRAMES} from './AutoShortV4';
import {BrandedAutoShortV4} from './BrandedAutoShortV4';

export const AutoFactoryRoot: React.FC = () => (
  <Composition
    id="NeoSaniyeAuto"
    component={BrandedAutoShortV4}
    durationInFrames={AUTO_FACTORY_V4_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
