import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {COVID_SCENES, COVID_TOTAL_FRAMES} from './data';
import {Cutout, FadeToBlack, Label, PaperStage} from './engine';
import {LegacyPanels} from './illustrations';
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

const FINAL_HOLD_FRAMES = 180;

const ExtendedFinalHold: React.FC = () => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, FINAL_HOLD_FRAMES], [1.015, 1.055], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const settle = interpolate(frame, [0, 28], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <PaperStage tone="dark">
      <AbsoluteFill
        style={{
          transform: `scale(${zoom}) translateY(${settle}px)`,
          transformOrigin: '50% 48%',
        }}
      >
        <Cutout style={{left: 66, top: 305, transform: 'rotate(.5deg)'}}>
          <LegacyPanels />
        </Cutout>
        <Label big style={{left: 80, top: 105, transform: 'rotate(-2deg)'}}>
          PANDEMİNİN MİRASI
        </Label>
        <Label color="teal" style={{left: 101, top: 221, transform: 'rotate(2deg)'}}>
          BİLİM · HAZIRLIK · DAYANIŞMA
        </Label>
      </AbsoluteFill>
      <FadeToBlack from={135} to={180} />
    </PaperStage>
  );
};

export const CovidPandemicShort: React.FC = () => {
  let cursor = 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#10191a'}}>
      <style>{`
        div[style*="bottom: 122px"][style*="border-radius: 16px"] {
          display: none !important;
        }
      `}</style>
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
            name={`Covid V3 Scene ${scene.id}`}
          >
            <Component />
          </Sequence>
        );
      })}
      <Sequence
        from={COVID_TOTAL_FRAMES - FINAL_HOLD_FRAMES}
        durationInFrames={FINAL_HOLD_FRAMES}
        name="Covid V3 resolved ending"
      >
        <ExtendedFinalHold />
      </Sequence>
    </AbsoluteFill>
  );
};
