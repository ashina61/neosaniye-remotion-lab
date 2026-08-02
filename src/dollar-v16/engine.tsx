import React, {CSSProperties, PropsWithChildren} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export const colors = {
  paper: '#eadfc2',
  lightPaper: '#f4ecd7',
  ink: '#25211d',
  red: '#9d3c34',
  teal: '#355f63',
  gold: '#aa8136',
  blue: '#3e617f',
  shadow: 'rgba(28, 23, 18, .28)',
};

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const progress = (frame: number, from: number, to: number) =>
  clamp01((frame - from) / Math.max(1, to - from));

export const smooth = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

export const usePop = (delay = 0, damping = 13, mass = 0.72) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({
    fps,
    frame: Math.max(0, frame - delay),
    config: {damping, mass, stiffness: 165},
    durationInFrames: 23,
  });
};

export const useSteppedFrame = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const step = fps / 12;
  return Math.floor(frame / step) * step;
};

export const PaperStage: React.FC<PropsWithChildren<{tone?: 'warm' | 'cool' | 'dark'}>> = ({
  children,
  tone = 'warm',
}) => {
  const frame = useCurrentFrame();
  const stepped = useSteppedFrame();
  const flicker = 0.975 + Math.sin(stepped * 0.83) * 0.012;
  const toneColor = tone === 'cool' ? '#d8ddd1' : tone === 'dark' ? '#c7c0aa' : colors.paper;

  return (
    <AbsoluteFill style={{backgroundColor: toneColor, overflow: 'hidden', filter: `brightness(${flicker})`}}>
      <AbsoluteFill
        style={{
          opacity: 0.48,
          backgroundImage:
            'radial-gradient(circle at 18% 13%, rgba(255,255,255,.3) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 57%, rgba(30,25,20,.2) 0 1px, transparent 1.5px), linear-gradient(97deg, rgba(255,255,255,.12), transparent 35%, rgba(30,25,20,.08))',
          backgroundSize: '19px 17px, 23px 29px, 100% 100%',
          backgroundPosition: `${Math.round(frame * 0.9) % 23}px ${Math.round(frame * 0.55) % 29}px`,
          mixBlendMode: 'multiply',
        }}
      />
      {children}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          boxShadow: 'inset 0 0 165px rgba(34,27,18,.48)',
          background:
            'linear-gradient(90deg, rgba(30,22,16,.08), transparent 14%, transparent 86%, rgba(30,22,16,.08))',
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.1,
          pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 5px, rgba(30,25,20,.35) 6px)',
        }}
      />
    </AbsoluteFill>
  );
};

export const Cutout: React.FC<
  PropsWithChildren<{
    style?: CSSProperties;
    accent?: 'red' | 'teal' | 'gold' | 'none';
    shadow?: boolean;
  }>
> = ({children, style, accent = 'none', shadow = true}) => {
  const border = accent === 'none' ? 'transparent' : colors[accent];
  return (
    <div
      style={{
        position: 'absolute',
        filter: shadow ? `drop-shadow(12px 14px 8px ${colors.shadow})` : undefined,
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          border: accent === 'none' ? undefined : `5px solid ${border}`,
          background: accent === 'none' ? undefined : colors.lightPaper,
          padding: accent === 'none' ? 0 : 12,
          clipPath: accent === 'none' ? undefined : 'polygon(2% 4%, 98% 0, 100% 96%, 3% 100%, 0 11%)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const Label: React.FC<
  PropsWithChildren<{
    style?: CSSProperties;
    color?: 'paper' | 'red' | 'teal' | 'gold';
    large?: boolean;
  }>
> = ({children, style, color = 'paper', large = false}) => {
  const background = color === 'paper' ? colors.lightPaper : colors[color];
  const textColor = color === 'paper' ? colors.ink : '#f8efd9';
  return (
    <div
      style={{
        position: 'absolute',
        padding: large ? '18px 28px 20px' : '12px 20px 14px',
        border: `3px solid ${colors.ink}`,
        borderRadius: 6,
        background,
        color: textColor,
        fontFamily: 'Georgia, Times New Roman, serif',
        fontWeight: 900,
        fontSize: large ? 66 : 34,
        lineHeight: 1,
        letterSpacing: -1.3,
        textTransform: 'uppercase',
        boxShadow: `10px 12px 0 ${colors.shadow}`,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const Tape: React.FC<{style?: CSSProperties; width?: number}> = ({style, width = 150}) => (
  <div
    style={{
      position: 'absolute',
      width,
      height: 42,
      background: 'rgba(244, 232, 190, .62)',
      border: '1px solid rgba(112,94,55,.28)',
      filter: 'drop-shadow(2px 3px 2px rgba(40,30,18,.16))',
      clipPath: 'polygon(3% 8%, 97% 0, 100% 88%, 1% 100%)',
      ...style,
    }}
  />
);

export const Pop: React.FC<
  PropsWithChildren<{
    delay?: number;
    from?: 'left' | 'right' | 'top' | 'bottom' | 'scale';
    distance?: number;
    rotate?: number;
    style?: CSSProperties;
  }>
> = ({children, delay = 0, from = 'scale', distance = 260, rotate = 0, style}) => {
  const value = usePop(delay);
  const offsetX = from === 'left' ? -distance * (1 - value) : from === 'right' ? distance * (1 - value) : 0;
  const offsetY = from === 'top' ? -distance * (1 - value) : from === 'bottom' ? distance * (1 - value) : 0;
  const scale = from === 'scale' ? interpolate(value, [0, 1], [0.25, 1]) : interpolate(value, [0, 1], [0.88, 1]);
  return (
    <div
      style={{
        position: 'absolute',
        opacity: value,
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotate * (1 - value)}deg) scale(${scale})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export const DrawLine: React.FC<{
  path: string;
  from?: number;
  to?: number;
  color?: string;
  width?: number;
  style?: CSSProperties;
  dash?: string;
}> = ({path, from = 0, to = 24, color = colors.red, width = 8, style, dash}) => {
  const frame = useCurrentFrame();
  const p = smooth(progress(frame, from, to));
  return (
    <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, ...style}}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={dash ?? '1'}
        strokeDashoffset={dash ? undefined : 1 - p}
        opacity={p}
      />
    </svg>
  );
};

export const SceneShell: React.FC<
  PropsWithChildren<{
    duration: number;
    tone?: 'warm' | 'cool' | 'dark';
    transition?: 'paper' | 'flash' | 'zoom';
  }>
> = ({children, duration, tone = 'warm', transition = 'paper'}) => {
  const frame = useCurrentFrame();
  const inP = smooth(progress(frame, 0, 8));
  const outP = smooth(progress(frame, duration - 9, duration));
  const translate = transition === 'paper' ? interpolate(inP, [0, 1], [85, 0]) : 0;
  const scale = transition === 'zoom' ? interpolate(inP, [0, 1], [1.13, 1]) : 1;
  const flash = transition === 'flash' ? Math.max(0, 1 - inP * 1.5) : 0;
  return (
    <PaperStage tone={tone}>
      <AbsoluteFill
        style={{
          opacity: Math.min(inP * 1.35, 1) * (1 - outP),
          transform: `translateX(${translate}px) scale(${scale})`,
          transformOrigin: '50% 52%',
        }}
      >
        {children}
      </AbsoluteFill>
      {transition === 'paper' ? (
        <AbsoluteFill
          style={{
            background: colors.lightPaper,
            transform: `translateX(${interpolate(inP, [0, 1], [0, 1120], {easing: Easing.inOut(Easing.cubic)})}px) rotate(-2deg)`,
            boxShadow: '-28px 0 30px rgba(30,22,15,.3)',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      {flash > 0 ? <AbsoluteFill style={{background: '#fff9e8', opacity: flash, mixBlendMode: 'screen'}} /> : null}
    </PaperStage>
  );
};

export const Headline: React.FC<{
  title: string;
  subtitle?: string;
  titleSize?: number;
  color?: 'red' | 'teal' | 'gold';
}> = ({title, subtitle, titleSize = 62, color = 'red'}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <Tape style={{left: 58, top: 74, transform: 'rotate(-10deg)'}} width={170} />
    <Label large style={{left: 74, top: 112, fontSize: titleSize, transform: 'rotate(-1.2deg)', maxWidth: 920}}>
      {title}
    </Label>
    {subtitle ? (
      <Label color={color} style={{left: 96, top: 224, fontSize: 30, transform: 'rotate(1.3deg)'}}>
        {subtitle}
      </Label>
    ) : null}
  </AbsoluteFill>
);
