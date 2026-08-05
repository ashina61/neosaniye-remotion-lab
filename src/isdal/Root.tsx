import React from 'react';
import {Composition} from 'remotion';
import {IsdalWoman} from './IsdalWoman';

export const IsdalRoot: React.FC = () => (
  <Composition id="IsdalWoman" component={IsdalWoman} durationInFrames={1200} fps={30} width={1080} height={1920} />
);
