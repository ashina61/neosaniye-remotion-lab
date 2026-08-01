import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import storyboardData from '../public/storyboard.json';
import {StoryboardSchema, type Shot} from './storyboard';

const storyboard = StoryboardSchema.parse(storyboardData);

const transformFor = (shot: Shot, progress: number) => {
  const zoomIn = interpolate(progress, [0, 1], [1.05, 1.18]);
  const zoomOut = interpolate(progress, [0, 1], [1.18, 1.05]);
  const pan = interpolate(progress, [0, 1], [-5, 5]);
  switch (shot.movement) {
    case 'zoom-in':
    case 'push-in': return `scale(${zoomIn})`;
    case 'zoom-out':
    case 'pull-out': return `scale(${zoomOut})`;
    case 'pan-left': return `scale(1.14) translateX(${-pan}%)`;
    case 'pan-right': return `scale(1.14) translateX(${pan}%)`;
    default: return 'scale(1.1)';
  }
};

const ShotView: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frames = Math.max(1, Math.round(shot.duration * fps));
  const progress = Math.min(1, frame / Math.max(1, frames - 1));
  const fadeFrames = Math.min(5, Math.max(2, Math.floor(frames / 5)));
  const opacity = interpolate(frame, [0, fadeFrames, frames - fadeFrames, frames - 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });
  const captionScale = interpolate(frame, [0, Math.min(6, frames - 1)], [0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#080706', overflow: 'hidden', opacity}}>
      <Img
        src={staticFile(shot.asset)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: `${shot.cropX}% ${shot.cropY}%`,
          transform: transformFor(shot, progress)
        }}
      />
      <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.08), rgba(0,0,0,.02) 52%, rgba(0,0,0,.82))'}} />
      <div style={{
        position: 'absolute',
        left: 82,
        right: 82,
        bottom: 210,
        color: 'white',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 900,
        fontSize: 68,
        lineHeight: 1.02,
        textAlign: 'center',
        textShadow: '0 5px 18px rgba(0,0,0,.95)',
        transform: `scale(${captionScale})`
      }}>
        {shot.narration}
      </div>
    </AbsoluteFill>
  );
};

export const Video: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#080706'}}>
    {storyboard.shots.map((shot) => (
      <Sequence
        key={shot.id}
        from={Math.round(shot.start * storyboard.fps)}
        durationInFrames={Math.max(1, Math.round(shot.duration * storyboard.fps))}
      >
        <ShotView shot={shot} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
