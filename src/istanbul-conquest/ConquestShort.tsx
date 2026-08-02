import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile} from 'remotion';
import {CONQUEST_SCENES, TOTAL_FRAMES} from './data';
import {
  Scene1Hook,
  Scene2Preparation,
  Scene3Walls,
  Scene4Ships,
  Scene5Assault,
  Scene6Fall,
  Scene7Legacy,
} from './scenes';

const sceneComponents = [
  Scene1Hook,
  Scene2Preparation,
  Scene3Walls,
  Scene4Ships,
  Scene5Assault,
  Scene6Fall,
  Scene7Legacy,
];

export const ConquestShort: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#1d1813'}}>
      <Audio
        src={staticFile('istanbul-conquest/audio/score.wav')}
        volume={(frame) =>
          interpolate(
            frame,
            [0, 35, TOTAL_FRAMES - 105, TOTAL_FRAMES - 1],
            [0, 0.17, 0.17, 0],
            {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
          )
        }
      />
      {CONQUEST_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.duration}
            name={`Istanbul Conquest ${scene.id}`}
          >
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
