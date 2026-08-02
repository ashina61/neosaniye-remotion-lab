import React from 'react';
import {Composition} from 'remotion';
import {DBCooperShort} from './DBCooperShort';
import {DB_COOPER_TOTAL_FRAMES} from './data';

export const DBCooperRoot: React.FC = () => (
  <Composition
    id="DBCooperShort"
    component={DBCooperShort}
    durationInFrames={DB_COOPER_TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
