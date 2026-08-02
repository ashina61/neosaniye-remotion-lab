import React from 'react';
import {Composition} from 'remotion';
import {AutoShort, AUTO_FACTORY_FRAMES} from './AutoShort';

export const AutoFactoryRoot: React.FC = () => (
  <Composition
    id="NeoSaniyeAuto"
    component={AutoShort}
    durationInFrames={AUTO_FACTORY_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
