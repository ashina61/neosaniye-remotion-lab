import React from 'react';
import {Composition} from 'remotion';
import {AutoShortV2, AUTO_FACTORY_V2_FRAMES} from './AutoShortV2';

export const AutoFactoryRoot: React.FC = () => (
  <Composition
    id="NeoSaniyeAuto"
    component={AutoShortV2}
    durationInFrames={AUTO_FACTORY_V2_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
