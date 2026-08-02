import React from 'react';
import {AbsoluteFill, interpolate, spring, useVideoConfig} from 'remotion';
import {FilmLook, LayerImage, PaperCaption, boil, fadeIn, hold, progress, useSteppedFrame} from '../engine';

export const Scene2Threat: React.FC = () => {
  const frame = useSteppedFrame(12);
  const {fps} = useVideoConfig();
  const noteIn = spring({frame: frame - 17, fps, config: {damping: 15, stiffness: 95}});
  const caseIn = spring({frame: frame - 47, fps, config: {damping: 15, stiffness: 95}});
  const bossIn = spring({frame: frame - 84, fps, config: {damping: 13, stiffness: 105}});
  const bossPunch = interpolate(frame, [96, 116], [1, 1.09], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wobble = boil(frame, 3);
  const negative = hold(frame, [[165, 167], [171, 173]]);
  const eyeBurn = progress(frame, 174, 180);

  return (
    <FilmLook>
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 42%, #a01218 0%, #7c0d12 48%, #58080c 100%)',
          filter: negative ? 'invert(1) hue-rotate(165deg)' : undefined,
        }}
      >
        <AbsoluteFill style={{opacity: 0.14, background: 'repeating-conic-gradient(from 0deg at 50% 48%, rgba(255,210,120,.32) 0 7deg, transparent 7deg 15deg)'}} />
        <LayerImage src="db-cooper/scene-02/cabin.svg" style={{opacity: 0.38}} />

        <AbsoluteFill style={{transform: `translateY(${240 * (1 - bossIn)}px) scale(${bossPunch}) rotate(${Math.sin(frame * 0.04) * 1.2}deg)`}}>
          <LayerImage src="db-cooper/scene-02/cooper-seated.svg" />
          <LayerImage src="db-cooper/scene-02/smoke.svg" style={{mixBlendMode: 'screen', opacity: fadeIn(frame, 88, 105), transform: `translate(${wobble.x}px, ${wobble.y}px)`}} />
        </AbsoluteFill>

        <AbsoluteFill style={{transform: `translateX(${interpolate(noteIn, [0, 1], [-760, 0])}px) rotate(${wobble.rotate}deg)`}}>
          <LayerImage src="db-cooper/scene-02/hand-note.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translateX(${interpolate(caseIn, [0, 1], [780, 0])}px) rotate(${-wobble.rotate}deg)`}}>
          <LayerImage src="db-cooper/scene-02/briefcase.svg" />
        </AbsoluteFill>

        <PaperCaption dark style={{left: 155, top: 220, fontSize: 72, opacity: fadeIn(frame, 72, 82)}}>ÇANTAMDA</PaperCaption>
        <PaperCaption style={{left: 260, top: 335, fontSize: 112, opacity: fadeIn(frame, 82, 92)}}>BOMBA VAR</PaperCaption>
        <PaperCaption dark style={{right: 80, top: 1420, fontSize: 64, opacity: fadeIn(frame, 130, 145)}}>hostese bir not verdi</PaperCaption>

        {eyeBurn > 0 ? (
          <>
            <div style={{position: 'absolute', left: 450, top: 675, width: 18, height: 18, borderRadius: '50%', background: '#ff2018', boxShadow: `0 0 ${80 * eyeBurn}px ${26 * eyeBurn}px #ff2018`}} />
            <div style={{position: 'absolute', left: 565, top: 675, width: 18, height: 18, borderRadius: '50%', background: '#ff2018', boxShadow: `0 0 ${80 * eyeBurn}px ${26 * eyeBurn}px #ff2018`}} />
          </>
        ) : null}
      </AbsoluteFill>
    </FilmLook>
  );
};
