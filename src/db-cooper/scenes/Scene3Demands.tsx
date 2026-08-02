import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {FilmLook, LayerImage, PaperCaption, boil, fadeIn, useSteppedFrame} from '../engine';

const Paper: React.FC<{src: string; start: number; fromX: number; fromY: number; fromRotate: number; x: number; y: number; rotate: number}> = ({src, start, fromX, fromY, fromRotate, x, y, rotate}) => {
  const frame = useSteppedFrame(12);
  const {fps} = useVideoConfig();
  const enter = spring({frame: frame - start, fps, config: {stiffness: 42, damping: 13, mass: 1.1}});
  const wobble = boil(frame + start, 2.1);
  return (
    <div style={{position: 'absolute', width: 760, height: 980, left: interpolate(enter, [0, 1], [fromX, x]) + wobble.x, top: interpolate(enter, [0, 1], [fromY, y]) + wobble.y, transform: `rotate(${interpolate(enter, [0, 1], [fromRotate, rotate]) + wobble.rotate}deg) scale(${interpolate(enter, [0, 1], [1.1, 1])})`, transformOrigin: '50% 50%'}}>
      <LayerImage src={src} fit="contain" />
    </div>
  );
};

export const Scene3Demands: React.FC = () => {
  const frame = useSteppedFrame(12);
  const blur = interpolate(frame, [0, 14], [12, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const push = interpolate(frame, [0, 140], [1.03, 1.12]);

  return (
    <FilmLook>
      <AbsoluteFill style={{filter: `blur(${blur}px)`, transform: `scale(${push})`}}>
        <LayerImage src="db-cooper/scene-03/desk.svg" />
        <Paper src="db-cooper/scene-03/paper-bomb.svg" start={20} fromX={-820} fromY={1080} fromRotate={-26} x={80} y={650} rotate={-7} />
        <Paper src="db-cooper/scene-03/paper-ransom.svg" start={60} fromX={1120} fromY={620} fromRotate={24} x={230} y={610} rotate={6} />
        <Paper src="db-cooper/scene-03/paper-parachutes.svg" start={100} fromX={170} fromY={1980} fromRotate={10} x={150} y={720} rotate={-3} />
        <PaperCaption style={{left: 150, top: 170, fontSize: 74, opacity: fadeIn(frame, 4, 16) * (1 - fadeIn(frame, 42, 48))}}>talepleri netti.</PaperCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};
