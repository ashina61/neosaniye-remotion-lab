import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {HORMUZ_SCENES} from './data';
import {
  Scene1ClosureAlertV8,
  Scene2GeographyV8,
  Scene3EnergyArteryV8,
  Scene4ShipsStoppedV8,
  Scene5MarketShockV8,
  Scene6DiplomacyV8,
} from './scenesV8';

const sceneComponents = [
  Scene1ClosureAlertV8,
  Scene2GeographyV8,
  Scene3EnergyArteryV8,
  Scene4ShipsStoppedV8,
  Scene5MarketShockV8,
  Scene6DiplomacyV8,
];

const OVERLAP = 8;

const SceneEnvelope: React.FC<
  React.PropsWithChildren<{
    duration: number;
    fadeIn: boolean;
    fadeOut: boolean;
  }>
> = ({duration, fadeIn, fadeOut, children}) => {
  const frame = useCurrentFrame();
  const intro = fadeIn
    ? interpolate(frame, [0, OVERLAP], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;
  const outro = fadeOut
    ? interpolate(frame, [duration - OVERLAP, duration], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 1;

  return <AbsoluteFill style={{opacity: Math.min(intro, outro)}}>{children}</AbsoluteFill>;
};

export const HormuzCrisisShort: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#0b1517'}}>
      <Audio
        src={staticFile('hormuz-crisis/audio/score-v8.wav')}
        volume={0.18}
      />
      <Audio
        src={staticFile('hormuz-crisis/audio/narration-master-v8.wav')}
        volume={1}
      />

      <Sequence from={18} durationInFrames={60}>
        <Audio
          src={staticFile('hormuz-crisis/sfx/radio-alert.wav')}
          volume={0.24}
        />
      </Sequence>
      <Sequence from={475} durationInFrames={100}>
        <Audio
          src={staticFile('hormuz-crisis/sfx/ship-horn.wav')}
          volume={0.13}
        />
      </Sequence>
      <Sequence from={773} durationInFrames={60}>
        <Audio
          src={staticFile('hormuz-crisis/sfx/gate-lock.wav')}
          volume={0.24}
        />
      </Sequence>

      {HORMUZ_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const isFirst = index === 0;
        const isLast = index === HORMUZ_SCENES.length - 1;
        const from = cursor - (isFirst ? 0 : OVERLAP);
        const sequenceDuration = scene.duration + (isFirst ? 0 : OVERLAP);
        cursor += scene.duration;

        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={sequenceDuration}
            name={`Hormuz V8 Scene ${scene.id}`}
          >
            <SceneEnvelope
              duration={sequenceDuration}
              fadeIn={!isFirst}
              fadeOut={!isLast}
            >
              <Component />
            </SceneEnvelope>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
