import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {FIRST_UNIVERSITY_SCENES} from './data';
import {
  Scene1InkHook,
  Scene2MapJourney,
  Scene3Foundation,
  Scene4Founder,
  Scene5Learning,
  Scene6Continuity,
  Scene7Legacy,
} from './scenes';

const components = [
  Scene1InkHook,
  Scene2MapJourney,
  Scene3Foundation,
  Scene4Founder,
  Scene5Learning,
  Scene6Continuity,
  Scene7Legacy,
];

export const FirstUniversityShort: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#100b07'}}>
      <Audio src={staticFile('first-university/audio/ambience.wav')} volume={0.12} />
      {FIRST_UNIVERSITY_SCENES.map((scene, index) => {
        const Component = components[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.duration}
            name={`First University ${scene.id}`}
          >
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
