import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {FilmLook, LayerImage, PaperCaption, fadeIn, progress, useSteppedFrame} from '../engine';

export const Scene4Jump: React.FC = () => {
  const frame = useSteppedFrame(12);
  const wallScale = interpolate(frame, [8, 80], [1, 1.12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const manScale = interpolate(frame, [0, 58], [0.72, 1.7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shift = interpolate(progress(frame, 60, 78), [0, 1], [0, -235]);
  const motionBlur = interpolate(frame, [60, 68, 78], [0, 13, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fall = interpolate(frame, [0, 160], [-80, 620]);

  return (
    <FilmLook saturate={0.62} contrast={1.12} sepia={0.06} brightness={0.94}>
      <AbsoluteFill>
        <AbsoluteFill style={{transform: `scale(${wallScale})`}}>
          <LayerImage src="db-cooper/scene-04/storm.svg" />
          <LayerImage src="db-cooper/scene-04/forest.svg" style={{transform: `translateY(${interpolate(frame, [0, 160], [45, -35])}px)`}} />
          <LayerImage src="db-cooper/scene-04/plane-rear.svg" style={{transform: `translateX(${interpolate(frame, [0, 160], [80, -90])}px)`}} />
        </AbsoluteFill>

        <AbsoluteFill style={{transform: `translate(${shift}px, ${fall}px) scale(${manScale})`, transformOrigin: '560px 1080px', filter: `blur(${motionBlur}px)`}}>
          <LayerImage src="db-cooper/scene-04/cooper-jump.svg" />
        </AbsoluteFill>

        <PaperCaption style={{left: 70, top: 250, fontSize: 62, opacity: fadeIn(frame, 24, 32)}}>gece / fırtına / karanlık</PaperCaption>
        <PaperCaption dark style={{right: 55, top: 1180, fontSize: 70, opacity: fadeIn(frame, 70, 78)}}>UÇAKTAN ATLADI</PaperCaption>
        <div style={{position: 'absolute', right: 92, top: 1304, width: 540, height: 12, background: '#d8ca27', transform: `scaleX(${progress(frame, 74, 90)}) rotate(-3deg)`, transformOrigin: 'left center'}} />
      </AbsoluteFill>
    </FilmLook>
  );
};
