import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const posterizeFrame = (frame: number, fps: number, targetFps = 12) => {
  const step = fps / targetFps;
  return Math.floor(frame / step) * step;
};

export const useSteppedFrame = (targetFps = 12) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return posterizeFrame(frame, fps, targetFps);
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const progress = (frame: number, from: number, to: number) => clamp01((frame - from) / Math.max(1, to - from));
export const easeOutCubic = (value: number) => 1 - Math.pow(1 - clamp01(value), 3);
export const easeInOutCubic = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const springEntrance = (frame: number, fps: number, delay = 0, damping = 14, stiffness = 105) =>
  spring({frame: frame - delay, fps, config: {damping, stiffness, mass: 1.05}});

export const boil = (frame: number, amount = 3) => ({
  x: Math.sin(frame * 1.73) * amount,
  y: Math.cos(frame * 1.21) * amount,
  rotate: Math.sin(frame * 0.91) * amount * 0.08,
});

export const pingPong = (frame: number, speed = 0.05) => Math.sin(frame * speed);
export const hold = (frame: number, ranges: Array<[number, number]>) => ranges.some(([start, end]) => frame >= start && frame <= end);

export const LayerImage: React.FC<{
  src: string;
  style?: React.CSSProperties;
  opacity?: number;
  fit?: React.CSSProperties['objectFit'];
}> = ({src, style, opacity = 1, fit = 'cover'}) => (
  <Img
    src={staticFile(src)}
    style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, opacity, ...style}}
  />
);

export const PaperCaption: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
}> = ({children, style, dark = false}) => (
  <div
    style={{
      position: 'absolute',
      padding: '16px 26px 18px',
      color: dark ? '#1b1813' : '#f4eddd',
      background: dark ? 'rgba(226,210,174,.94)' : 'rgba(18,15,12,.72)',
      fontFamily: 'Georgia, Times New Roman, serif',
      fontStyle: 'italic',
      fontWeight: 700,
      lineHeight: 1.02,
      letterSpacing: -1.2,
      boxShadow: '0 18px 45px rgba(0,0,0,.28)',
      transform: 'rotate(-1.2deg)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const FilmLook: React.FC<
  React.PropsWithChildren<{
    saturate?: number;
    contrast?: number;
    sepia?: number;
    brightness?: number;
    scanLines?: boolean;
    texture?: boolean;
    vignette?: boolean;
    gateWeave?: boolean;
  }>
> = ({
  children,
  saturate = 0.86,
  contrast = 1.08,
  sepia = 0.16,
  brightness = 0.95,
  scanLines = true,
  texture = true,
  vignette = true,
  gateWeave = true,
}) => {
  const frame = useSteppedFrame(12);
  const jitterX = gateWeave ? Math.sin(frame * 0.91) * 2.5 : 0;
  const jitterY = gateWeave ? Math.cos(frame * 0.67) * 2.5 : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0806', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${jitterX}px, ${jitterY}px) scale(${gateWeave ? 1.012 : 1})`,
          filter: `saturate(${saturate}) contrast(${contrast}) sepia(${sepia}) brightness(${brightness})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {texture ? (
        <>
          <LayerImage
            src="db-cooper/textures/grain.svg"
            style={{mixBlendMode: 'multiply', opacity: 0.55, filter: 'invert(1) brightness(1.35) contrast(1.02)'}}
          />
          <LayerImage src="db-cooper/textures/grunge.svg" style={{mixBlendMode: 'color-burn', opacity: 0.16}} />
        </>
      ) : null}

      {scanLines ? (
        <AbsoluteFill
          style={{
            background: 'repeating-linear-gradient(90deg, rgba(0,0,0,.16) 0 1.6px, transparent 1.6px 8px)',
            filter: 'blur(.7px)',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {vignette ? (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse 92% 82% at 50% 48%, transparent 0 55%, rgba(0,0,0,.5) 100%)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const fadeIn = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
