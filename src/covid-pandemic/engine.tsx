import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const progress = (frame: number, from: number, to: number) =>
  clamp((frame - from) / Math.max(1, to - from));
export const smooth = (value: number) => Easing.inOut(Easing.cubic)(clamp(value));
export const out = (value: number) => Easing.out(Easing.cubic)(clamp(value));

export const usePaperFrame = () => {
  const frame = useCurrentFrame();
  return {
    frame,
    stepped: Math.floor(frame / 2.5) * 2.5,
  };
};

export const useCardSpring = (delay = 0, damping = 17, stiffness = 105) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: {damping, stiffness, mass: 0.9},
    durationInFrames: 46,
  });
};

export const PaperStage: React.FC<{
  children: React.ReactNode;
  tone?: 'warm' | 'cool' | 'dark';
}> = ({children, tone = 'warm'}) => {
  const frame = useCurrentFrame();
  const stepped = Math.floor(frame / 2.5) * 2.5;
  const jitterX = Math.sin(stepped * 0.17) * 0.65;
  const jitterY = Math.cos(stepped * 0.13) * 0.55;
  const base = tone === 'cool' ? '#b8c4c0' : tone === 'dark' ? '#273335' : '#d7c7a4';
  const tint = tone === 'cool' ? '#355f62' : tone === 'dark' ? '#061214' : '#6f4d2c';

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: base,
        transform: `translate(${jitterX}px, ${jitterY}px) scale(1.003)`,
      }}
    >
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="covidPaperNoise" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="51" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values={`0 0 0 0 0.35  0 0 0 0 0.29  0 0 0 0 0.22  0 0 0 .2 0`}
            />
          </filter>
          <radialGradient id="covidPaperLight" cx="47%" cy="42%" r="76%">
            <stop offset="0" stopColor="#fff8e8" stopOpacity=".36" />
            <stop offset=".7" stopColor={tint} stopOpacity=".05" />
            <stop offset="1" stopColor="#11100d" stopOpacity=".31" />
          </radialGradient>
          <linearGradient id="covidFoldV" x1="0" x2="1">
            <stop offset="0" stopColor="#1d1711" stopOpacity="0" />
            <stop offset=".47" stopColor="#1d1711" stopOpacity=".1" />
            <stop offset=".5" stopColor="#fff7dd" stopOpacity=".18" />
            <stop offset=".53" stopColor="#1d1711" stopOpacity=".08" />
            <stop offset="1" stopColor="#1d1711" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#covidPaperLight)" />
        <rect width="1080" height="1920" filter="url(#covidPaperNoise)" opacity=".72" />
        <rect x="486" width="108" height="1920" fill="url(#covidFoldV)" opacity=".75" />
        <path d="M0 126 C230 96 420 158 650 121 S925 104 1080 136" fill="none" stroke="#271a10" strokeOpacity=".08" strokeWidth="4" />
        <path d="M35 1715 C280 1682 735 1776 1040 1714" fill="none" stroke="#fff2ce" strokeOpacity=".13" strokeWidth="6" />
      </svg>
      {children}
      <AbsoluteFill style={{boxShadow: 'inset 0 0 145px rgba(15,13,10,.34)', pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
};

export const Cutout: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: 'none' | 'red' | 'teal';
}> = ({children, style, accent = 'none'}) => {
  const extra =
    accent === 'red'
      ? 'drop-shadow(3px 4px 0 rgba(139,45,39,.9))'
      : accent === 'teal'
        ? 'drop-shadow(3px 4px 0 rgba(49,91,94,.82))'
        : '';
  return (
    <div
      style={{
        position: 'absolute',
        filter: `${extra} drop-shadow(0 14px 21px rgba(35,27,18,.25))`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Tape: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      position: 'absolute',
      width: 165,
      height: 54,
      background: 'linear-gradient(90deg, rgba(238,224,182,.25), rgba(255,247,216,.72), rgba(215,196,151,.3))',
      border: '1px solid rgba(95,74,47,.14)',
      boxShadow: '0 2px 5px rgba(42,31,19,.12)',
      mixBlendMode: 'screen',
      ...style,
    }}
  />
);

export const Label: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  color?: 'paper' | 'red' | 'teal' | 'dark';
  big?: boolean;
}> = ({children, style, color = 'paper', big = false}) => {
  const palette = {
    paper: {bg: '#e8ddbd', fg: '#2e271e'},
    red: {bg: '#91352f', fg: '#f8eed7'},
    teal: {bg: '#345d60', fg: '#f7f0dc'},
    dark: {bg: '#24231f', fg: '#f8eed7'},
  }[color];
  return (
    <div
      style={{
        position: 'absolute',
        padding: big ? '17px 28px 14px' : '12px 22px 10px',
        backgroundColor: palette.bg,
        color: palette.fg,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontSize: big ? 62 : 41,
        fontWeight: 900,
        lineHeight: 1.02,
        letterSpacing: big ? 1.6 : 1.1,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        boxShadow: '0 9px 18px rgba(42,29,17,.22)',
        clipPath: 'polygon(1% 5%, 99% 0, 100% 92%, 2% 100%)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const SceneAudio: React.FC<{
  scene: number;
  sfx?: Array<{from: number; src: string; volume?: number}>;
}> = ({scene, sfx = []}) => (
  <>
    <Audio src={staticFile(`covid-pandemic/audio/scene-${String(scene).padStart(2, '0')}.wav`)} volume={1} />
    {sfx.map((item, index) => (
      <Sequence from={item.from} key={`${item.src}-${index}`}>
        <Audio src={staticFile(`covid-pandemic/sfx/${item.src}`)} volume={item.volume ?? 0.5} />
      </Sequence>
    ))}
  </>
);

export const FadeToBlack: React.FC<{from: number; to: number}> = ({from, to}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{backgroundColor: '#0e1516', opacity, pointerEvents: 'none'}} />;
};
