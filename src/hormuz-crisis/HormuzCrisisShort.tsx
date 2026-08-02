import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {HORMUZ_SCENES} from './data';
import {
  Scene1ClosureAlert,
  Scene2Geography,
  Scene3EnergyArtery,
  Scene4ShipsStopped,
  Scene5MarketShock,
  Scene6Diplomacy,
} from './scenes';

const sceneComponents = [
  Scene1ClosureAlert,
  Scene2Geography,
  Scene3EnergyArtery,
  Scene4ShipsStopped,
  Scene5MarketShock,
  Scene6Diplomacy,
];

export const HormuzCrisisShort: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#0b1517'}}>
      <Audio src={staticFile('hormuz-crisis/audio/score.wav')} volume={0.24} />
      {HORMUZ_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence
            key={scene.id}
            from={from}
            durationInFrames={scene.duration}
            name={`Hormuz V5 Scene ${scene.id}`}
          >
            <Component />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
