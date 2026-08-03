import React from 'react';
import {Composition} from 'remotion';
import {AutoShortV3, AUTO_FACTORY_V3_FRAMES} from './AutoShortV3';

export const AutoFactoryRoot:React.FC=()=> (
  <Composition
    id="NeoSaniyeAuto"
    component={AutoShortV3}
    durationInFrames={AUTO_FACTORY_V3_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
