import {registerRoot} from 'remotion';
import React from 'react';
import {Composition} from 'remotion';
import {LayeredStoryDemo} from './LayeredStoryDemo';

const LayeredStoryRoot: React.FC = () => (
  <Composition
    id="LayeredStoryDemo"
    component={LayeredStoryDemo}
    durationInFrames={630}
    fps={30}
    width={1080}
    height={1920}
  />
);

registerRoot(LayeredStoryRoot);
