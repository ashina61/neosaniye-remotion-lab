import React from 'react';
import {AbsoluteFill, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import storyboardData from '../public/storyboard.json';
import {StoryboardSchema, type Shot} from './storyboard';

const storyboard = StoryboardSchema.parse(storyboardData);

const transformFor = (shot: Shot, progress: number) => {
  const zoomIn = interpolate(progress, [0, 1], [1.04, 1.15]);
  const zoomOut = interpolate(progress, [0, 1], [1.15, 1.04]);
  const pan = interpolate(progress, [0, 1], [-4, 4]);
  switch (shot.movement) {
    case 'zoom-in':
    case 'push-in': return `scale(${zoomIn})`;
    case 'zoom-out':
    case 'pull-out': return `scale(${zoomOut})`;
    case 'pan-left': return `scale(1.1) translateX(${-pan}%)`;
    case 'pan-right': return `scale(1.1) translateX(${pan}%)`;
    default: return 'scale(1.08)';
  }
};

const ShotView: React.FC<{shot: Shot}> = ({shot}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frames = Math.max(1, Math.round(shot.duration * fps));
  const progress = Math.min(1, frame / frames);
  const opacity = interpolate(frame, [0, 4, frames - 4, frames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return <AbsoluteFill style={{backgroundColor: '#080706', overflow: 'hidden', opacity}}>
    <Img src={staticFile(shot.asset)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: transformFor(shot, progress)}} />
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(0,0,0,.12), rgba(0,0,0,.05) 55%, rgba(0,0,0,.78))'}} />
    <div style={{position: 'absolute', left: 70, right: 70, bottom: 190, color: 'white', fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 62, lineHeight: 1.08, textAlign: 'center', textShadow: '0 4px 14px rgba(0,0,0,.9)'}}>
      {shot.narration}
    </div>
  </AbsoluteFill>;
};

export const Video: React.FC = () => <AbsoluteFill style={{backgroundColor: '#080706'}}>
  {storyboard.shots.map((shot) => <Sequence key={shot.id} from={Math.round(shot.start * storyboard.fps)} durationInFrames={Math.round(shot.duration * storyboard.fps)}>
    <ShotView shot={shot} />
  </Sequence>)}
</AbsoluteFill>;
