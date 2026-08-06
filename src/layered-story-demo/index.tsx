import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {
  LayeredStoryDemo,
  LAYERED_STORY_TOTAL_FRAMES,
} from './LayeredStoryDemo';

const LayeredStoryRoot: React.FC = () => (
  <Composition
    id="LayeredStoryDemo"
    component={LayeredStoryDemo}
    durationInFrames={LAYERED_STORY_TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);

registerRoot(LayeredStoryRoot);
