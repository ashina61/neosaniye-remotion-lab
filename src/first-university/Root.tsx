import React from 'react';
import {Composition} from 'remotion';
import {FirstUniversityShort} from './FirstUniversityShort';
import {FIRST_UNIVERSITY_TOTAL_FRAMES} from './data';

export const FirstUniversityRoot: React.FC = () => (
  <Composition
    id="FirstUniversityShort"
    component={FirstUniversityShort}
    durationInFrames={FIRST_UNIVERSITY_TOTAL_FRAMES}
    fps={30}
    width={1080}
    height={1920}
  />
);
