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
import planJson from '../../public/auto-factory/plan.json';
import type {FactoryPlan, ScenePlan} from './schema';

type VisualMode = 'focus' | 'process' | 'comparison' | 'timeline' | 'network' | 'evidence' | 'exploded';
type VisualContract = {
  version: 6;
  mode: VisualMode;
  subject: string;
  labels: string[];
  relation: string;
  layoutVariant: number;
  groundingTokens: string[];
  source: string;
};
type UniversalScene = ScenePlan & {visualContract?: VisualContract};
type UniversalPlan = Omit<FactoryPlan, 'scenes'> & {scenes: UniversalScene[]};

const plan = planJson as unknown as UniversalPlan;
const palette = {
  paper: plan.palette.paper,
  ink: plan.palette.ink,
  red: plan.palette.red,
  teal: plan.palette.teal,
  gold: plan.palette.gold,
  blue: plan.palette.blue,
};
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const reveal = (progress: number, at: number, span = 0.18) => {
  const value = clamp((progress - at) / span);
  return value * value * (3 - 2 * value);
};
const shorten = (value: string, max = 64) => {
  const text = String(value || '').trim();
  return text.length <= max ? text : `${text.slice(0, max - 1).trim()}…`;
};
const labelFontSize = (value: string, base = 42) => {
  if (value.length > 48) return base - 12;
  if (value.length > 32) return base - 7;
  if (value.length > 20) return base - 3;
  return base;
};
const accentColors = [palette.red, palette.teal, palette.gold, palette.blue];

const PaperCard: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  accent?: string;
  opacity?: number;
  rotate?: number;
  scale?: number;
}> = ({x, y, width, height, label, accent = palette.red, opacity = 1, rotate = 0, scale = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
    <rect
      x={-width / 2}
      y={-height / 2}
      width={width}
      height={height}
      rx="18"
      fill={palette.paper}
      stroke={palette.ink}
      strokeWidth="8"
    />
    <rect x={-width / 2} y={-height / 2} width="18" height={height} fill={accent} />
    <text
      x="8"
      y="3"
      textAnchor="middle"
      dominantBaseline="middle"
      fontFamily="Arial, sans-serif"
      fontWeight="900"
      fontSize={labelFontSize(label)}
      fill={palette.ink}
    >
      {shorten(label, 52)}
    </text>
  </g>
);

const Arrow: React.FC<{
  from: [number, number];
  to: [number, number];
  progress: number;
  color?: string;
}> = ({from, to, progress, color = palette.red}) => {
  const x = from[0] + (to[0] - from[0]) * progress;
  const y = from[1] + (to[1] - from[1]) * progress;
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]) * 180 / Math.PI;
  return (
    <g>
      <line
        x1={from[0]}
        y1={from[1]}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth="11"
        strokeDasharray="20 14"
      />
      <path
        d="M-20 -13 L0 0 L-20 13"
        fill="none"
        stroke={color}
        strokeWidth="10"
        transform={`translate(${x} ${y}) rotate(${angle})`}
      />
    </g>
  );
};

const FocusVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const supports = contract.labels.slice(1, 5);
  const positions: Array<[number, number]> = [[225, 250], [755, 250], [225, 820], [755, 820]];
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      {supports.map((label, index) => {
        const opacity = reveal(progress, 0.18 + index * 0.1);
        const [x, y] = positions[index];
        return (
          <g key={`${label}-${index}`} opacity={opacity}>
            <line x1="490" y1="545" x2={x} y2={y} stroke={accentColors[index]} strokeWidth="10" strokeDasharray="17 13" />
            <PaperCard x={x} y={y} width={300} height={145} label={label} accent={accentColors[index]} />
          </g>
        );
      })}
      <circle cx="490" cy="545" r={190 + reveal(progress, 0.05, 0.35) * 18} fill={`${palette.gold}35`} stroke={palette.ink} strokeWidth="10" />
      <PaperCard
        x={490}
        y={545}
        width={430}
        height={220}
        label={contract.subject}
        accent={palette.red}
        opacity={reveal(progress, 0.02, 0.24)}
      />
    </svg>
  );
};

const ProcessVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const labels = contract.labels.slice(0, 4);
  const xPositions = labels.length >= 4 ? [135, 370, 610, 845] : [170, 490, 810];
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      {labels.map((label, index) => {
        const x = xPositions[index] ?? 490;
        const opacity = reveal(progress, 0.08 + index * 0.18, 0.22);
        return (
          <g key={`${label}-${index}`} opacity={opacity}>
            <circle cx={x} cy="525" r="112" fill={`${accentColors[index % 4]}30`} stroke={palette.ink} strokeWidth="8" />
            <PaperCard x={x} y={525} width={210} height={165} label={label} accent={accentColors[index % 4]} />
            {index < labels.length - 1 ? (
              <Arrow
                from={[x + 110, 525]}
                to={[(xPositions[index + 1] ?? x + 250) - 110, 525]}
                progress={reveal(progress, 0.19 + index * 0.18, 0.2)}
                color={accentColors[(index + 1) % 4]}
              />
            ) : null}
          </g>
        );
      })}
      <path d="M90 795 C280 900 700 900 890 795" fill="none" stroke={palette.ink} strokeWidth="8" opacity={reveal(progress, 0.68, 0.22)} />
    </svg>
  );
};

const ComparisonVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const left = contract.labels[0];
  const right = contract.labels[1] ?? contract.subject;
  const details = contract.labels.slice(2, 5);
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      <line x1="490" y1="170" x2="490" y2="930" stroke={palette.ink} strokeWidth="9" strokeDasharray="24 16" />
      <PaperCard x={265} y={430} width={380} height={250} label={left} accent={palette.teal} opacity={reveal(progress, 0.05, 0.25)} rotate={-2} />
      <PaperCard x={715} y={430} width={380} height={250} label={right} accent={palette.red} opacity={reveal(progress, 0.22, 0.25)} rotate={2} />
      {details.map((label, index) => (
        <PaperCard
          key={`${label}-${index}`}
          x={index % 2 === 0 ? 270 : 710}
          y={735 + Math.floor(index / 2) * 150}
          width={330}
          height={115}
          label={label}
          accent={accentColors[(index + 2) % 4]}
          opacity={reveal(progress, 0.44 + index * 0.1, 0.2)}
        />
      ))}
    </svg>
  );
};

const TimelineVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const labels = contract.labels.slice(0, 5);
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      <line x1="150" y1="560" x2={150 + 680 * reveal(progress, 0.04, 0.7)} y2="560" stroke={palette.ink} strokeWidth="13" />
      {labels.map((label, index) => {
        const x = labels.length === 1 ? 490 : 150 + index * (680 / (labels.length - 1));
        const top = index % 2 === 0;
        return (
          <g key={`${label}-${index}`} opacity={reveal(progress, 0.12 + index * 0.12, 0.22)}>
            <circle cx={x} cy="560" r="28" fill={accentColors[index % 4]} stroke={palette.ink} strokeWidth="8" />
            <line x1={x} y1="560" x2={x} y2={top ? 405 : 715} stroke={palette.ink} strokeWidth="7" />
            <PaperCard x={x} y={top ? 315 : 805} width={285} height={135} label={label} accent={accentColors[index % 4]} />
          </g>
        );
      })}
    </svg>
  );
};

const NetworkVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const supports = contract.labels.slice(1, 5);
  const positions: Array<[number, number]> = [[190, 250], [790, 250], [190, 830], [790, 830]];
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      {supports.map((label, index) => {
        const [x, y] = positions[index];
        const amount = reveal(progress, 0.12 + index * 0.09, 0.3);
        return (
          <g key={`${label}-${index}`}>
            <line x1="490" y1="540" x2={490 + (x - 490) * amount} y2={540 + (y - 540) * amount} stroke={accentColors[index]} strokeWidth="12" strokeDasharray="20 14" />
            <PaperCard x={x} y={y} width={300} height={140} label={label} accent={accentColors[index]} opacity={amount} />
          </g>
        );
      })}
      <PaperCard x={490} y={540} width={400} height={205} label={contract.subject} accent={palette.red} opacity={reveal(progress, 0.02, 0.22)} />
    </svg>
  );
};

const EvidenceVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const labels = contract.labels.slice(0, 5);
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      <rect x="110" y="120" width="760" height="870" rx="22" fill={`${palette.ink}0D`} stroke={palette.ink} strokeWidth="9" />
      {labels.map((label, index) => {
        const x = index % 2 === 0 ? 310 : 670;
        const y = 280 + Math.floor(index / 2) * 260;
        const rotation = index % 2 === 0 ? -3 : 3;
        return (
          <g key={`${label}-${index}`} opacity={reveal(progress, 0.07 + index * 0.12, 0.22)}>
            <PaperCard x={x} y={y} width={350} height={180} label={label} accent={accentColors[index % 4]} rotate={rotation} />
            {index > 0 ? <line x1="490" y1="520" x2={x} y2={y} stroke={palette.red} strokeWidth="7" /> : null}
          </g>
        );
      })}
      <circle cx="490" cy="520" r="36" fill={palette.red} stroke={palette.ink} strokeWidth="7" opacity={reveal(progress, 0.55, 0.2)} />
    </svg>
  );
};

const ExplodedVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => {
  const parts = contract.labels.slice(1, 5);
  const positions: Array<[number, number]> = [[180, 260], [800, 260], [180, 835], [800, 835]];
  return (
    <svg viewBox="0 0 980 1120" width="100%" height="100%">
      <PaperCard x={490} y={545} width={420} height={240} label={contract.subject} accent={palette.gold} opacity={reveal(progress, 0.02, 0.22)} />
      {parts.map((label, index) => {
        const [targetX, targetY] = positions[index];
        const amount = reveal(progress, 0.2 + index * 0.1, 0.28);
        const x = 490 + (targetX - 490) * amount;
        const y = 545 + (targetY - 545) * amount;
        return (
          <g key={`${label}-${index}`} opacity={amount}>
            <line x1="490" y1="545" x2={x} y2={y} stroke={accentColors[index]} strokeWidth="9" strokeDasharray="16 12" />
            <PaperCard x={x} y={y} width={285} height={135} label={label} accent={accentColors[index]} />
          </g>
        );
      })}
    </svg>
  );
};

const ContractVisual: React.FC<{scene: UniversalScene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract;
  if (!contract) return null;
  if (scene.asset) {
    const zoom = 1 + reveal(progress, 0, 1) * 0.06;
    return (
      <AbsoluteFill style={{overflow: 'hidden', border: `8px solid ${palette.ink}`}}>
        <Img
          src={staticFile(scene.asset)}
          style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}}
        />
        <AbsoluteFill style={{background: 'linear-gradient(180deg, transparent 48%, rgba(0,0,0,.76) 100%)'}} />
        <div style={{position: 'absolute', left: 36, right: 36, bottom: 34, fontFamily: 'Arial Black', fontSize: 44, color: '#fff', textTransform: 'uppercase'}}>
          {shorten(contract.subject, 62)}
        </div>
      </AbsoluteFill>
    );
  }
  switch (contract.mode) {
    case 'process': return <ProcessVisual contract={contract} progress={progress} />;
    case 'comparison': return <ComparisonVisual contract={contract} progress={progress} />;
    case 'timeline': return <TimelineVisual contract={contract} progress={progress} />;
    case 'network': return <NetworkVisual contract={contract} progress={progress} />;
    case 'evidence': return <EvidenceVisual contract={contract} progress={progress} />;
    case 'exploded': return <ExplodedVisual contract={contract} progress={progress} />;
    default: return <FocusVisual contract={contract} progress={progress} />;
  }
};

const SceneCard: React.FC<{scene: UniversalScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = clamp(frame / Math.max(1, scene.duration * fps - 1));
  const opacity = interpolate(progress, [0, 0.06, 0.92, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const variant = scene.visualContract?.layoutVariant ?? 0;
  const paperOffset = (variant - 1.5) * 8;
  return (
    <AbsoluteFill style={{background: palette.paper, color: palette.ink, opacity, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, ${palette.ink}16 0 1.5px, transparent 2px)`, backgroundSize: '28px 28px', opacity: 0.42}} />
      <div style={{position: 'absolute', left: 58, right: 58, top: 70, display: 'flex', alignItems: 'center', gap: 18}}>
        <b style={{fontFamily: 'Arial Black', fontSize: 28, border: `4px solid ${palette.ink}`, padding: '8px 13px', background: accentColors[variant % 4]}}>
          #{String(scene.id).padStart(2, '0')}
        </b>
        <span style={{height: 5, background: palette.ink, flex: 1}} />
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 145, fontFamily: 'Arial Black', fontSize: 74, lineHeight: 0.92, letterSpacing: -2, textTransform: 'uppercase'}}>
        {shorten(scene.title, 58)}
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 292, fontFamily: 'Arial', fontWeight: 900, fontSize: 30, lineHeight: 1.08, color: palette.red, textTransform: 'uppercase'}}>
        {shorten(scene.kicker || scene.secondaryMotif, 90)}
      </div>
      <div style={{position: 'absolute', left: 48 + paperOffset, right: 48 - paperOffset, top: 385, bottom: 250}}>
        <ContractVisual scene={scene} progress={progress} />
      </div>
      <div style={{position: 'absolute', left: 66, right: 66, bottom: 70, borderTop: `5px solid ${palette.ink}`, paddingTop: 20, fontFamily: 'Georgia', fontWeight: 700, fontSize: 35, lineHeight: 1.12}}>
        {shorten(scene.voiceLine, 150)}
      </div>
    </AbsoluteFill>
  );
};

export const UniversalSemanticAutoShortV6: React.FC = () => (
  <AbsoluteFill style={{background: palette.paper}}>
    <Audio src={staticFile('auto-factory/audio/final.wav')} />
    {plan.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
        premountFor={15}
      >
        <SceneCard scene={scene} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
