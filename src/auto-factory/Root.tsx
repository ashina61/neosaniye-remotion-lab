import React from 'react';
import {Composition} from 'remotion';
import {AutoShortV2Enhanced, AUTO_FACTORY_V2_ENHANCED_FRAMES} from './FilmEngineV2';

export const AutoFactoryRoot: React.FC = () => (
  <Composition
    id="NeoSaniyeAuto"
    component={AutoShortV2Enhanced}
    durationInFrames={AUTO_FACTORY_V2_ENHANCED_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
