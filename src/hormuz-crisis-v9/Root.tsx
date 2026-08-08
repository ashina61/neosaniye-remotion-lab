import React from 'react';
import {Composition} from 'remotion';
import {HormuzCrisisMasterV9} from './HormuzCrisisMasterV9';
import {FPS, HEIGHT, TOTAL_FRAMES, WIDTH} from './data';

export const HormuzCrisisV9Root: React.FC = () => (
  <Composition
    id="HormuzCrisisMasterV9"
    component={HormuzCrisisMasterV9}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={WIDTH}
    height={HEIGHT}
  />
);
