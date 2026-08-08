import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {AUDIO, SCENES} from './data';
import {Scene1, Scene2, Scene3, Scene4, Scene5, Scene6} from './scenes';

const SceneComponents = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];

export const HormuzCrisisMasterV9: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#030709'}}>
    {AUDIO.enabled ? (
      <>
        <Audio src={staticFile(AUDIO.score)} volume={0.18} />
        <Audio src={staticFile(AUDIO.narration)} volume={1} />
      </>
    ) : null}

    {SCENES.map((scene, index) => {
      const Component = SceneComponents[index];
      return (
        <Sequence
          key={scene.id}
          from={scene.from}
          durationInFrames={scene.duration}
          name={`Hormuz Master V9 / Scene ${scene.id}`}
        >
          <Component />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
