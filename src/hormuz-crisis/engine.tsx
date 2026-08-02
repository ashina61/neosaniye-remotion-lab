import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const progress = (frame: number, from: number, to: number) =>
  clamp01((frame - from) / Math.max(1, to - from));

export const smooth = (value: number) => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

export const useCardSpring = (
  delay = 0,
  damping = 18,
  stiffness = 100,
) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({
    frame: frame - delay,
    fps,
    config: {damping, stiffness, mass: 0.9},
  });
};

export const usePaperFrame = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stepped = Math.floor(frame / (fps / 12)) * (fps / 12);
  return {frame, stepped};
};

const toneBackground = {
  sand: '#d9c8a5',
  cool: '#b8c2bd',
  dark: '#273638',
  warning: '#cab49b',
} as const;

export const PaperStage: React.FC<
  React.PropsWithChildren<{tone?: keyof typeof toneBackground}>
> = ({tone = 'sand', children}) => {
  const {stepped} = usePaperFrame();
  const x = Math.sin(stepped * 1.71) * 1.7;
  const y = Math.cos(stepped * 1.19) * 1.4;
  const flicker = 0.965 + Math.sin(stepped * 0.43) * 0.018;

  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        backgroundColor: toneBackground[tone],
        color: '#231f1a',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <AbsoluteFill
        style={{
          transform: `translate(${x}px, ${y}px) scale(1.012)`,
          filter: `saturate(.86) contrast(1.07) sepia(.12) brightness(${flicker})`,
        }}
      >
        {children}
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(22,18,14,.24) 0 1.4px, transparent 1.4px 8px)',
          filter: 'blur(.45px)',
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            'radial-gradient(circle at 20% 18%, rgba(255,255,255,.34), transparent 19%), radial-gradient(circle at 70% 74%, rgba(55,40,24,.24), transparent 24%)',
          mixBlendMode: 'soft-light',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse 94% 84% at 50% 48%, transparent 0 57%, rgba(0,0,0,.48) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const Cutout: React.FC<
  React.PropsWithChildren<{
    style?: React.CSSProperties;
    accent?: 'none' | 'red' | 'teal' | 'gold';
    padding?: number;
  }>
> = ({children, style, accent = 'none', padding = 12}) => {
  const border = {
    none: 'rgba(53,42,29,.45)',
    red: '#9c3e35',
    teal: '#345f63',
    gold: '#a98235',
  }[accent];

  return (
    <div
      style={{
        position: 'absolute',
        padding,
        background: 'rgba(235,226,199,.96)',
        border: `2px solid ${border}`,
        boxShadow: '12px 16px 0 rgba(28,22,16,.16), 0 13px 26px rgba(28,22,16,.22)',
        clipPath:
          'polygon(1% 4%, 97% 0, 100% 95%, 94% 100%, 3% 97%, 0 9%)',
        transformOrigin: '50% 50%',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const labelColors = {
  paper: {background: '#eadfc2', color: '#251f18'},
  red: {background: '#9c3e35', color: '#f6edd8'},
  teal: {background: '#345f63', color: '#f6edd8'},
  dark: {background: '#273638', color: '#f6edd8'},
  gold: {background: '#a98235', color: '#fff6df'},
} as const;

export const Label: React.FC<
  React.PropsWithChildren<{
    style?: React.CSSProperties;
    color?: keyof typeof labelColors;
    big?: boolean;
  }>
> = ({children, style, color = 'paper', big = false}) => {
  const palette = labelColors[color];
  return (
    <div
      style={{
        position: 'absolute',
        display: 'inline-block',
        padding: big ? '16px 25px 13px' : '10px 17px 9px',
        background: palette.background,
        color: palette.color,
        fontFamily: big
          ? 'Georgia, Times New Roman, serif'
          : 'Arial, Helvetica, sans-serif',
        fontSize: big ? 68 : 34,
        fontWeight: 900,
        letterSpacing: big ? -1.5 : 0.2,
        lineHeight: 1,
        textTransform: 'uppercase',
        boxShadow: '8px 10px 0 rgba(27,20,14,.14)',
        clipPath:
          'polygon(1% 5%, 98% 0, 100% 90%, 96% 100%, 2% 95%, 0 13%)',
        whiteSpace: 'nowrap',
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
      width: 150,
      height: 46,
      background:
        'linear-gradient(90deg, rgba(244,235,195,.66), rgba(255,250,218,.43), rgba(238,227,187,.63))',
      boxShadow: '0 3px 5px rgba(34,26,17,.12)',
      mixBlendMode: 'screen',
      ...style,
    }}
  />
);

export const RadarSweep: React.FC<{
  cx: number;
  cy: number;
  radius: number;
  frame: number;
  color?: string;
  opacity?: number;
}> = ({cx, cy, radius, frame, color = '#a73d35', opacity = 0.75}) => {
  const angle = (frame * 2.6) % 360;
  return (
    <svg
      width="1080"
      height="1920"
      viewBox="0 0 1080 1920"
      style={{position: 'absolute', inset: 0, opacity}}
    >
      {[0.33, 0.66, 1].map((scale) => (
        <circle
          key={scale}
          cx={cx}
          cy={cy}
          r={radius * scale}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray="14 12"
          opacity={0.42}
        />
      ))}
      <line
        x1={cx}
        y1={cy}
        x2={cx + Math.cos((angle * Math.PI) / 180) * radius}
        y2={cy + Math.sin((angle * Math.PI) / 180) * radius}
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        opacity={0.72}
      />
    </svg>
  );
};

export const SceneAudio: React.FC<{
  scene: number;
  sfx?: Array<{from: number; src: string; volume?: number}>;
}> = ({scene, sfx = []}) => (
  <>
    <Audio
      src={staticFile(
        `hormuz-crisis/audio/scene-${String(scene).padStart(2, '0')}.wav`,
      )}
      volume={1}
    />
    {sfx.map((effect) => (
      <Sequence
        key={`${effect.src}-${effect.from}`}
        from={effect.from}
        durationInFrames={180}
      >
        <Audio
          src={staticFile(`hormuz-crisis/sfx/${effect.src}`)}
          volume={effect.volume ?? 0.3}
        />
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
  return (
    <AbsoluteFill
      style={{backgroundColor: '#090d0e', opacity, pointerEvents: 'none'}}
    />
  );
};
