import React from 'react';
import {Composition} from 'remotion';
import {ConquestShort} from './ConquestShort';
import {FPS, TOTAL_FRAMES} from './data';

export const IstanbulConquestRoot: React.FC = () => (
  <Composition
    id="IstanbulConquestShort"
    component={ConquestShort}
    durationInFrames={TOTAL_FRAMES}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
