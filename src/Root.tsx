import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {DBCooperShort} from './db-cooper/DBCooperShort';
import {DB_COOPER_TOTAL_FRAMES} from './db-cooper/data';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="NeoSaniyeShort"
      component={Video}
      durationInFrames={900}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="DBCooperShort"
      component={DBCooperShort}
      durationInFrames={DB_COOPER_TOTAL_FRAMES}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
