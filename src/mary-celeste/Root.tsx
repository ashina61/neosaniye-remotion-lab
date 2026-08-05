import React from 'react';
import {Composition} from 'remotion';
import {MaryCelesteShort} from './MaryCelesteShort';
import {FPS, MARY_CELESTE_TOTAL_FRAMES} from './data';

export const MaryCelesteRoot: React.FC = () => (
  <Composition
    id="MaryCelesteShort"
    component={MaryCelesteShort}
    durationInFrames={MARY_CELESTE_TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
