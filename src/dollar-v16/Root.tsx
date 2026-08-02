import React from 'react';
import {Composition} from 'remotion';
import {DollarV16, DOLLAR_V16_FRAMES} from './DollarV16';

export const DollarV16Root: React.FC = () => (
  <Composition
    id="DollarV16"
    component={DollarV16}
    durationInFrames={DOLLAR_V16_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
