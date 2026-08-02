import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const progress = (frame: number, from: number, to: number) =>
  clamp01((frame - from) / Math.max(1, to - from));
export const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
export const easeInOutCubic = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const useSteppedFrame = (targetFps = 12) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const step = fps / targetFps;
  return Math.floor(frame / step) * step;
};

export const fadeIn = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const fadeOut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const boil = (frame: number, amount = 2) => ({
  x: Math.sin(frame * 1.31) * amount,
  y: Math.cos(frame * 1.73) * amount,
  rotate: Math.sin(frame * 0.81) * amount * 0.08,
});

export const LayerImage: React.FC<{
  src: string;
  style?: React.CSSProperties;
  fit?: React.CSSProperties['objectFit'];
}> = ({src, style, fit = 'cover'}) => (
  <Img
    src={staticFile(src)}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, ...style}}
  />
);

export const ManuscriptCaption: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  gold?: boolean;
}> = ({children, style, gold = false}) => (
  <div
    style={{
      position: 'absolute',
      padding: '16px 27px 19px',
      color: gold ? '#2b1c0d' : '#f8efd9',
      background: gold ? 'rgba(215,184,113,.94)' : 'rgba(31,22,15,.78)',
      border: gold ? '2px solid rgba(92,54,20,.38)' : '1px solid rgba(255,236,190,.3)',
      boxShadow: '0 18px 46px rgba(0,0,0,.34)',
      fontFamily: 'Georgia, Times New Roman, serif',
      fontWeight: 700,
      fontStyle: 'italic',
      lineHeight: 1.02,
      letterSpacing: -1.2,
      transform: 'rotate(-1deg)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const FilmLook: React.FC<React.PropsWithChildren<{cool?: boolean}>> = ({children, cool = false}) => {
  const frame = useSteppedFrame(12);
  const jitterX = Math.sin(frame * 0.77) * 1.6;
  const jitterY = Math.cos(frame * 0.53) * 1.4;
  const flicker = 0.985 + Math.sin(frame * 0.29) * 0.012;
  const dustX = (frame * 2.2) % 1080;
  const dustY = (frame * 3.1) % 1920;

  return (
    <AbsoluteFill style={{backgroundColor: '#100b07', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${jitterX}px, ${jitterY}px) scale(1.008)`,
          filter: `${cool ? 'saturate(.78) sepia(.08)' : 'saturate(.84) sepia(.18)'} contrast(1.09) brightness(${flicker})`,
        }}
      >
        {children}
      </AbsoluteFill>
      <LayerImage
        src="first-university/textures/grain.svg"
        style={{mixBlendMode: 'soft-light', opacity: 0.4, transform: `translate(${jitterX * -2}px, ${jitterY * 1.5}px)`}}
      />
      <LayerImage
        src="first-university/textures/grunge.svg"
        style={{mixBlendMode: 'multiply', opacity: 0.16}}
      />
      <LayerImage
        src="first-university/textures/dust.svg"
        style={{mixBlendMode: 'screen', opacity: 0.28, transform: `translate(${dustX - 540}px, ${dustY - 960}px) scale(1.8)`}}
      />
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 1px, transparent 1px 9px)',
          opacity: 0.42,
        }}
      />
      <AbsoluteFill
        style={{
          background: 'radial-gradient(ellipse 88% 82% at 50% 46%, transparent 0 56%, rgba(0,0,0,.48) 100%)',
        }}
      />
    </AbsoluteFill>
  );
};

export const SceneAudio: React.FC<{
  scene: number;
  sfx?: Array<{from: number; src: string; volume?: number}>;
}> = ({scene, sfx = []}) => (
  <>
    <Audio src={staticFile(`first-university/audio/scene-${String(scene).padStart(2, '0')}.mp3`)} volume={1} />
    {sfx.map((item, index) => (
      <Sequence key={`${item.src}-${index}`} from={item.from}>
        <Audio src={staticFile(`first-university/sfx/${item.src}`)} volume={item.volume ?? 0.55} />
      </Sequence>
    ))}
  </>
);
