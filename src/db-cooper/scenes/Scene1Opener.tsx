import React from 'react';
import {AbsoluteFill, interpolate, useVideoConfig} from 'remotion';
import {FilmLook, LayerImage, PaperCaption, easeOutCubic, progress, useSteppedFrame} from '../engine';

export const Scene1Opener: React.FC = () => {
  const frame = useSteppedFrame(12);
  const {fps} = useVideoConfig();
  const wallScale = frame < 46
    ? interpolate(frame, [0, 46], [1, 1.16])
    : interpolate(easeOutCubic(progress(frame, 46, 76)), [0, 1], [1.16, 6.8]);
  const weldedScale = 0.369 * wallScale;
  const detached = progress(frame, 62, 76);
  const photoScale = frame <= 62 ? weldedScale : interpolate(detached, [0, 1], [0.75, 1]);
  const frameScale = frame <= 62 ? weldedScale : interpolate(easeOutCubic(detached), [0, 1], [weldedScale, 7.2]);
  const burstBlur = interpolate(frame, [54, 61, 72], [0, 9, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wallFade = interpolate(frame, [52, 72], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cloudTravel = frame / Math.max(1, fps * 3.4);
  const caption1 = interpolate(frame, [66, 73], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const caption2 = interpolate(frame, [77, 86], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <FilmLook>
      <AbsoluteFill style={{backgroundColor: '#cbbd9f'}}>
        <AbsoluteFill style={{opacity: wallFade, filter: `blur(${interpolate(frame, [52, 72], [0, 8], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px)`, transform: `scale(${wallScale})`}}>
          <LayerImage src="db-cooper/scene-01/wall.svg" />
          <PaperCaption dark style={{left: 390, top: 1270, fontSize: 50}}>24 Kasım 1971</PaperCaption>
        </AbsoluteFill>

        <AbsoluteFill style={{filter: `blur(${burstBlur}px)`}}>
          <AbsoluteFill style={{transform: `translateX(${-525 * cloudTravel}px)`}}>
            <LayerImage src="db-cooper/scene-01/cloud-1.svg" />
          </AbsoluteFill>
          <AbsoluteFill style={{transform: `translateX(${-315 * cloudTravel}px)`}}>
            <LayerImage src="db-cooper/scene-01/cloud-2.svg" />
          </AbsoluteFill>
          <AbsoluteFill style={{transform: `scale(${photoScale})`, opacity: interpolate(frame, [62, 76], [0.45, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            <LayerImage src="db-cooper/scene-01/airport-photo.svg" />
            <LayerImage src="db-cooper/scene-01/cooper-portrait.svg" style={{transform: `scale(${1 + Math.sin(frame * 0.045) * 0.005}) rotate(${Math.sin(frame * 0.045) * 0.5}deg)`}} />
          </AbsoluteFill>
          <AbsoluteFill style={{transform: `scale(${frameScale})`}}>
            <LayerImage src="db-cooper/scene-01/gold-frame.svg" />
          </AbsoluteFill>
        </AbsoluteFill>

        <PaperCaption style={{left: 120, top: 1310, fontSize: 62, opacity: caption1}}>takım elbiseli bir adam</PaperCaption>
        <PaperCaption dark style={{right: 90, top: 1420, fontSize: 78, opacity: caption2}}>DAN COOPER</PaperCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};
