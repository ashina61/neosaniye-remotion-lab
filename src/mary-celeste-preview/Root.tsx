import React from 'react';
import {Composition} from 'remotion';
import {MaryCelesteShort} from '../mary-celeste/MaryCelesteShort';

export const MaryCelestePreviewRoot: React.FC = () => (
  <Composition
    id="MaryCelestePreview"
    component={MaryCelesteShort}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
  />
);
