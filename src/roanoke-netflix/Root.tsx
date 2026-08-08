import React from 'react';
import {Composition} from 'remotion';
import {RoanokeNetflix} from './RoanokeNetflix';
import {ROANOKE_TOTAL_FRAMES} from './data';

export const RoanokeNetflixRoot: React.FC = () => (
  <Composition
    id="RoanokeNetflix"
    component={RoanokeNetflix}
    durationInFrames={ROANOKE_TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
