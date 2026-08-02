import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {DB_COOPER_SCENES} from './data';
import {Scene1Opener} from './scenes/Scene1Opener';
import {Scene2Threat} from './scenes/Scene2Threat';
import {Scene3Demands} from './scenes/Scene3Demands';
import {Scene4Jump} from './scenes/Scene4Jump';
import {Scene5Investigation} from './scenes/Scene5Investigation';
import {Scene6Finale} from './scenes/Scene6Finale';

const sceneComponents = [Scene1Opener, Scene2Threat, Scene3Demands, Scene4Jump, Scene5Investigation, Scene6Finale];

export const DBCooperShort: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#090705'}}>
      {DB_COOPER_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration} name={`DB Cooper ${scene.id}`}>
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
