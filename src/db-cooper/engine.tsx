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

const SceneTimeScaleContext = React.createContext(1);

export const SceneTimeProvider: React.FC<
  React.PropsWithChildren<{sourceFrames: number; targetFrames: number}>
> = ({sourceFrames, targetFrames, children}) => (
  <SceneTimeScaleContext.Provider value={sourceFrames / Math.max(1, targetFrames)}>
    {children}
  </SceneTimeScaleContext.Provider>
);

export const posterizeFrame = (frame: number, fps: number, targetFps = 12) => {
  const step = fps / targetFps;
  return Math.floor(frame / step) * step;
};

export const useSceneFrame = () => {
  const frame = useCurrentFrame();
  const timeScale = React.useContext(SceneTimeScaleContext);
  return frame * timeScale;
};

export const useSteppedFrame = (targetFps = 12) => {
  const frame = useSceneFrame();
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
      background: dark ? 'rgba(226,210,174,.94)' : 'rgba(18,15,12,.76)',
      fontFamily: 'Georgia, Times New Roman, serif',
      fontStyle: 'italic',
      fontWeight: 700,
      lineHeight: 1.02,
      letterSpacing: -1.2,
      boxShadow: '0 18px 45px rgba(0,0,0,.32)',
      textShadow: dark ? 'none' : '0 3px 12px rgba(0,0,0,.7)',
      transform: 'rotate(-1.2deg)',
      ...style,
    }}
  >
    {children}
  </div>
);

const AnimatedDust: React.FC = () => {
  const frame = useSteppedFrame(12);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden', mixBlendMode: 'screen', opacity: 0.22}}>
      {Array.from({length: 20}, (_, index) => {
        const seed = (index * 73 + 29) % 997;
        const left = (seed * 37) % 1080;
        const baseY = (seed * 61) % 2100;
        const speed = 0.28 + (index % 5) * 0.11;
        const y = ((baseY - frame * speed + 2100) % 2100) - 90;
        const size = 2 + (index % 4) * 1.4;
        const drift = Math.sin(frame * 0.025 + index) * (8 + (index % 3) * 5);
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: left + drift,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: index % 3 === 0 ? '#f4e5bd' : '#fff7df',
              filter: `blur(${index % 2 ? 1.2 : 0.4}px)`,
              opacity: 0.35 + (index % 5) * 0.08,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

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
  saturate = 0.88,
  contrast = 1.09,
  sepia = 0.14,
  brightness = 0.97,
  scanLines = true,
  texture = true,
  vignette = true,
  gateWeave = true,
}) => {
  const frame = useSteppedFrame(12);
  const jitterX = gateWeave ? Math.sin(frame * 0.91) * 1.8 : 0;
  const jitterY = gateWeave ? Math.cos(frame * 0.67) * 1.8 : 0;
  const flicker = Math.sin(frame * 1.37) * 0.008 + Math.cos(frame * 0.43) * 0.004;
  const grainX = Math.sin(frame * 2.17) * 13;
  const grainY = Math.cos(frame * 1.61) * 11;

  return (
    <AbsoluteFill style={{backgroundColor: '#0a0806', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${jitterX}px, ${jitterY}px) scale(${gateWeave ? 1.009 : 1})`,
          filter: `saturate(${saturate}) contrast(${contrast}) sepia(${sepia}) brightness(${brightness + flicker})`,
        }}
      >
        {children}
      </AbsoluteFill>

      {texture ? (
        <>
          <LayerImage
            src="db-cooper/textures/grain.svg"
            style={{
              mixBlendMode: 'multiply',
              opacity: 0.34 + Math.sin(frame * 0.77) * 0.035,
              filter: 'invert(1) brightness(1.36) contrast(1.04)',
              transform: `translate(${grainX}px, ${grainY}px) scale(1.045) rotate(${Math.sin(frame * 0.31) * 0.25}deg)`,
            }}
          />
          <LayerImage
            src="db-cooper/textures/grunge.svg"
            style={{mixBlendMode: 'color-burn', opacity: 0.105, transform: `scale(1.02) translate(${-grainX * 0.18}px, ${grainY * 0.15}px)`}}
          />
          <AnimatedDust />
        </>
      ) : null}

      {scanLines ? (
        <AbsoluteFill
          style={{
            background: 'repeating-linear-gradient(0deg, rgba(0,0,0,.07) 0 1px, transparent 1px 6px)',
            opacity: 0.62,
            filter: 'blur(.35px)',
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      {vignette ? (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(ellipse 94% 86% at 50% 47%, transparent 0 57%, rgba(0,0,0,.46) 100%)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const fadeIn = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
