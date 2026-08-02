import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {FilmLook, LayerImage, PaperCaption, fadeIn, progress, useSteppedFrame} from '../engine';

export const Scene6Finale: React.FC = () => {
  const frame = useSteppedFrame(12);
  const wallScale = interpolate(frame, [8, 110], [1, 1.12], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const manScale = interpolate(frame, [0, 58], [0.74, 1.7], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const qIn = progress(frame, 24, 36);
  const t = Math.max(0, frame - 36);
  const wag = 28 * Math.cos(t * 0.52) * Math.exp(-0.042 * t);

  return (
    <FilmLook saturate={0.62} contrast={1.12} sepia={0.06} brightness={0.94}>
      <AbsoluteFill>
        <AbsoluteFill style={{transform: `scale(${wallScale})`}}>
          <LayerImage src="db-cooper/scene-06/fbi-wall.svg" />
        </AbsoluteFill>

        <AbsoluteFill style={{transform: `scale(${manScale})`, transformOrigin: '560px 1690px'}}>
          <LayerImage src="db-cooper/scene-06/cooper-sketch.svg" />
        </AbsoluteFill>

        <PaperCaption style={{left: 65, top: 255, fontSize: 62, opacity: fadeIn(frame, 8, 18)}}>kimliği</PaperCaption>
        <PaperCaption dark style={{left: 65, top: 365, fontSize: 92, opacity: fadeIn(frame, 18, 30)}}>ASLA</PaperCaption>
        <PaperCaption style={{left: 65, top: 500, fontSize: 66, opacity: fadeIn(frame, 40, 48)}}>çözülemedi</PaperCaption>

        <AbsoluteFill style={{transform: `translateY(${interpolate(qIn, [0, 1], [720, 0])}px) scale(${interpolate(qIn, [0, 1], [0.72, 1])}) rotate(${wag}deg)`, transformOrigin: '760px 1450px'}}>
          <LayerImage src="db-cooper/scene-06/red-question.svg" />
        </AbsoluteFill>

        <div style={{position: 'absolute', left: 160, right: 160, bottom: 160, padding: '24px 28px', border: '9px solid #7c1115', color: '#7c1115', background: 'rgba(222,207,176,.9)', fontFamily: 'Arial Black, sans-serif', fontSize: 78, textAlign: 'center', letterSpacing: 8, transform: `rotate(-3deg) scale(${progress(frame, 86, 100)})`}}>UNSOLVED</div>
      </AbsoluteFill>
    </FilmLook>
  );
};
