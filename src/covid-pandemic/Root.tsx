import React from 'react';
import {Composition} from 'remotion';
import {CovidPandemicShort} from './CovidPandemicShort';
import {COVID_TOTAL_FRAMES} from './data';

export const CovidPandemicRoot: React.FC = () => (
  <Composition
    id="CovidPandemicV2"
    component={CovidPandemicShort}
    durationInFrames={COVID_TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
