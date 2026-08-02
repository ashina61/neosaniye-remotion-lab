import React from 'react';
import {Composition} from 'remotion';
import {HormuzCrisisShort} from './HormuzCrisisShort';
import {HORMUZ_TOTAL_FRAMES} from './data';

export const HormuzRoot: React.FC = () => (
  <Composition
    id="HormuzCrisisV8"
    component={HormuzCrisisShort}
    durationInFrames={HORMUZ_TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
