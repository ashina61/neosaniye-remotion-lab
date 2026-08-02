import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {COVID_SCENES} from './data';
import {
  Scene1Outbreak,
  Scene2GlobalSpread,
  Scene3Lockdown,
  Scene4ICU,
  Scene5Vaccines,
  Scene6Legacy,
} from './scenes';

const sceneComponents = [
  Scene1Outbreak,
  Scene2GlobalSpread,
  Scene3Lockdown,
  Scene4ICU,
  Scene5Vaccines,
  Scene6Legacy,
];

export const CovidPandemicShort: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#10191a'}}>
      <Audio src={staticFile('covid-pandemic/audio/score.wav')} volume={0.24} />
      {COVID_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.duration}
            name={`Covid V2 Scene ${scene.id}`}
          >
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
