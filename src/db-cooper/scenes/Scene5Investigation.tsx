import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {FilmLook, LayerImage, PaperCaption, fadeIn, hold, progress, useSteppedFrame} from '../engine';

export const Scene5Investigation: React.FC = () => {
  const frame = useSteppedFrame(12);
  const focusBlur = frame <= 21
    ? interpolate(frame, [0, 21], [12, 0])
    : frame <= 53
      ? interpolate(frame, [43, 53], [0, 7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : interpolate(frame, [53, 63], [7, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const cameraScale = frame <= 21
    ? interpolate(frame, [0, 21], [0.88, 1])
    : interpolate(frame, [21, 150], [1, 1.08]);
  const lightSwing = Math.sin(frame * 0.052) * 3;
  const cashOn = hold(frame, [[23, 28], [32, 61], [64, 71]]);
  const bokeh = 1 + Math.min(1.4, focusBlur / 5);

  return (
    <FilmLook saturate={0.82} contrast={1.06} sepia={0.14} brightness={0.93}>
      <AbsoluteFill style={{transform: `scale(${cameraScale})`, filter: `blur(${focusBlur}px)`}}>
        <LayerImage src="db-cooper/scene-05/office-bg.svg" />
        <AbsoluteFill style={{transform: `rotate(${lightSwing}deg)`, transformOrigin: '590px 0'}}>
          <div style={{position: 'absolute', left: 510, top: 250, width: 160 * bokeh, height: 160 * bokeh, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,252,225,.95) 0 8%, rgba(255,190,85,.58) 24%, rgba(255,170,55,.08) 68%, transparent 72%)', mixBlendMode: 'screen', filter: 'blur(8px)'}} />
          <div style={{position: 'absolute', left: 250, top: 360, width: 650, height: 1000, clipPath: 'polygon(42% 0,58% 0,100% 100%,0 100%)', background: 'linear-gradient(180deg, rgba(255,205,115,.19), rgba(255,185,85,.05) 60%, transparent)', filter: 'blur(28px)', mixBlendMode: 'screen'}} />
          <LayerImage src="db-cooper/scene-05/lamp.svg" />
        </AbsoluteFill>
        <LayerImage src="db-cooper/scene-05/office-char.svg" />
        <LayerImage src="db-cooper/scene-05/office-desk.svg" />
        {cashOn ? <LayerImage src="db-cooper/scene-05/office-cash.svg" style={{filter: 'sepia(1) saturate(5) hue-rotate(18deg)', mixBlendMode: 'screen'}} /> : null}

        <PaperCaption style={{left: 105, top: 225, fontSize: 56, opacity: fadeIn(frame, 9, 20)}}>FBI yıllarca aradı</PaperCaption>
        <PaperCaption dark style={{left: 155, top: 330, fontSize: 94, opacity: fadeIn(frame, 21, 36)}}>200.000 $</PaperCaption>
        <PaperCaption style={{left: 160, top: 455, fontSize: 49, opacity: fadeIn(frame, 42, 54)}}>ama sadece bir kısmı bulundu</PaperCaption>
        <div style={{position: 'absolute', left: 125, top: 305, width: 565, height: 175, border: '8px solid #d8ca27', borderRadius: '50%', transform: `scaleX(${progress(frame, 31, 40)}) rotate(-6deg)`, transformOrigin: 'left center', opacity: 0.9}} />
      </AbsoluteFill>
    </FilmLook>
  );
};
