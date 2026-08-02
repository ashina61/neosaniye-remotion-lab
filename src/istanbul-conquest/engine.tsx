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

export const smooth = (value: number) =>
  Easing.inOut(Easing.cubic)(clamp(value));

export const fade = (
  frame: number,
  fadeInStart = 0,
  fadeInEnd = 14,
  fadeOutStart?: number,
  fadeOutEnd?: number,
) => {
  const incoming = interpolate(frame, [fadeInStart, fadeInEnd], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (fadeOutStart === undefined || fadeOutEnd === undefined) return incoming;
  const outgoing = interpolate(frame, [fadeOutStart, fadeOutEnd], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return incoming * outgoing;
};

export const usePaperSpring = (delay = 0, damping = 15, stiffness = 95) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: {damping, stiffness, mass: 0.9},
    durationInFrames: 42,
  });
};

export const Cutout: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  redEdge?: boolean;
}> = ({children, style, redEdge = false}) => (
  <div
    style={{
      position: 'absolute',
      filter: redEdge
        ? 'drop-shadow(2px 3px 0 rgba(130,26,20,.92)) drop-shadow(0 12px 18px rgba(42,26,15,.25))'
        : 'drop-shadow(0 12px 18px rgba(42,26,15,.28))',
      ...style,
    }}
  >
    {children}
  </div>
);

export const PaperLabel: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  dark?: boolean;
  red?: boolean;
}> = ({children, style, dark = false, red = false}) => {
  const textLength = typeof children === 'string' ? children.length : 0;
  const squeeze = textLength > 27 ? 0.68 : textLength > 22 ? 0.77 : textLength > 18 ? 0.88 : 1;

  return (
    <div
      style={{
        position: 'absolute',
        display: 'inline-block',
        maxWidth: 920,
        overflow: 'hidden',
        padding: '12px 22px 10px',
        background: dark ? '#27221c' : red ? '#8d2921' : '#e9ddbe',
        color: dark || red ? '#f4ecd7' : '#2b241b',
        fontFamily: 'Georgia, Times New Roman, serif',
        fontWeight: 800,
        fontSize: 42,
        lineHeight: 1,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        boxShadow: '0 8px 16px rgba(38,25,15,.22)',
        clipPath: 'polygon(1% 5%, 99% 0, 100% 92%, 2% 100%)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        style={{
          display: 'block',
          transform: `scaleX(${squeeze})`,
          transformOrigin: 'center center',
        }}
      >
        {children}
      </span>
    </div>
  );
};

export const Tape: React.FC<{style?: React.CSSProperties}> = ({style}) => (
  <div
    style={{
      position: 'absolute',
      width: 150,
      height: 54,
      background:
        'linear-gradient(90deg, rgba(245,231,188,.2), rgba(255,247,216,.7), rgba(223,205,159,.35))',
      border: '1px solid rgba(110,87,55,.16)',
      boxShadow: '0 2px 5px rgba(50,35,20,.12)',
      mixBlendMode: 'screen',
      ...style,
    }}
  />
);

export const PaperWorld: React.FC<{
  children: React.ReactNode;
  tone?: 'warm' | 'night' | 'red';
}> = ({children, tone = 'warm'}) => {
  const frame = useCurrentFrame();
  const jitterX = Math.sin(frame * 0.19) * 0.8;
  const jitterY = Math.cos(frame * 0.17) * 0.7;
  const base =
    tone === 'night' ? '#2f3334' : tone === 'red' ? '#8d3a2d' : '#cdbb95';

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: base,
        transform: `translate(${jitterX}px, ${jitterY}px) scale(1.003)`,
      }}
    >
      <svg
        width="1080"
        height="1920"
        viewBox="0 0 1080 1920"
        style={{position: 'absolute', inset: 0}}
      >
        <defs>
          <filter id="paperNoise" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.72"
              numOctaves="3"
              seed="23"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 .22 0"
            />
          </filter>
          <radialGradient id="paperLight" cx="48%" cy="44%" r="74%">
            <stop offset="0" stopColor="#fff7df" stopOpacity=".32" />
            <stop offset=".66" stopColor="#6d5030" stopOpacity=".05" />
            <stop offset="1" stopColor="#24150d" stopOpacity=".28" />
          </radialGradient>
          <linearGradient id="foldV" x1="0" x2="1">
            <stop offset="0" stopColor="#20150e" stopOpacity="0" />
            <stop offset=".48" stopColor="#20150e" stopOpacity=".12" />
            <stop offset=".5" stopColor="#fff7da" stopOpacity=".2" />
            <stop offset=".52" stopColor="#20150e" stopOpacity=".08" />
            <stop offset="1" stopColor="#20150e" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="foldH" y1="0" y2="1">
            <stop offset="0" stopColor="#20150e" stopOpacity="0" />
            <stop offset=".48" stopColor="#20150e" stopOpacity=".11" />
            <stop offset=".5" stopColor="#fff7da" stopOpacity=".18" />
            <stop offset=".52" stopColor="#20150e" stopOpacity=".08" />
            <stop offset="1" stopColor="#20150e" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1080" height="1920" fill="url(#paperLight)" />
        <rect width="1080" height="1920" filter="url(#paperNoise)" opacity=".75" />
        <rect x="475" width="130" height="1920" fill="url(#foldV)" />
        <rect y="890" width="1080" height="140" fill="url(#foldH)" />
        <path
          d="M0 123 C180 108 290 147 445 121 S780 93 1080 126"
          fill="none"
          stroke="#4c3928"
          strokeOpacity=".08"
          strokeWidth="3"
        />
        <path
          d="M80 1760 C340 1710 702 1818 1040 1744"
          fill="none"
          stroke="#fff0c7"
          strokeOpacity=".12"
          strokeWidth="6"
        />
      </svg>
      {children}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 130px rgba(18,11,7,.34)',
        }}
      />
    </AbsoluteFill>
  );
};

export const SceneSound: React.FC<{
  scene: number;
  sfx?: Array<{from: number; src: string; volume?: number}>;
}> = ({scene, sfx = []}) => (
  <>
    <Audio
      src={staticFile(
        `istanbul-conquest/audio/scene-${String(scene).padStart(2, '0')}.wav`,
      )}
      volume={1}
    />
    {sfx.map((item, index) => (
      <Sequence key={`${item.src}-${index}`} from={item.from}>
        <Audio
          src={staticFile(`istanbul-conquest/sfx/${item.src}`)}
          volume={item.volume ?? 0.55}
        />
      </Sequence>
    ))}
  </>
);

export const RedPencilPath: React.FC<{
  d: string;
  progressValue: number;
  style?: React.CSSProperties;
  width?: number;
}> = ({d, progressValue, style, width = 8}) => (
  <svg
    width="1080"
    height="1920"
    viewBox="0 0 1080 1920"
    style={{position: 'absolute', inset: 0, ...style}}
  >
    <path
      d={d}
      fill="none"
      stroke="#9b3028"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - clamp(progressValue)}
      opacity=".94"
    />
  </svg>
);
