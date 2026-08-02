import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {DB_COOPER_SCENES} from './data';
import {SceneTimeProvider} from './engine';
import {Scene1Opener} from './scenes/Scene1Opener';
import {Scene2Threat} from './scenes/Scene2Threat';
import {Scene3Demands} from './scenes/Scene3Demands';
import {Scene4Jump} from './scenes/Scene4Jump';
import {Scene5Investigation} from './scenes/Scene5Investigation';
import {Scene6Finale} from './scenes/Scene6Finale';

const sceneComponents = [Scene1Opener, Scene2Threat, Scene3Demands, Scene4Jump, Scene5Investigation, Scene6Finale];

const SceneEnvelope: React.FC<React.PropsWithChildren<{duration: number}>> = ({duration, children}) => {
  const frame = useCurrentFrame();
  const fadeFrames = Math.min(7, Math.max(3, Math.floor(duration / 18)));
  const opacity = interpolate(
    frame,
    [0, fadeFrames, duration - fadeFrames, duration - 1],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

export const DBCooperShort: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#090705'}}>
      <Audio src={staticFile('db-cooper/audio/ambience.wav')} volume={0.16} />

      {DB_COOPER_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration} name={`DB Cooper ${scene.id}`}>
            <SceneEnvelope duration={scene.duration}>
              <SceneTimeProvider sourceFrames={scene.sourceDuration} targetFrames={scene.duration}>
                <Component />
              </SceneTimeProvider>
            </SceneEnvelope>
            <Audio src={staticFile(scene.audio)} volume={1} />
          </Sequence>
        );
      })}

      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(0,0,0,.08), transparent 18%, transparent 76%, rgba(0,0,0,.2))',
        }}
      />
    </AbsoluteFill>
  );
};
