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
type UniversalScene = ScenePlan & {asset?: string; visualContract?: VisualContract};
type UniversalPlan = Omit<FactoryPlan, 'scenes'> & {scenes: UniversalScene[]};

const plan = planJson as unknown as UniversalPlan;
const palette = plan.palette;
const accents = [palette.red, palette.teal, palette.gold, palette.blue];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const reveal = (progress: number, at: number, span = 0.18) => {
  const value = clamp((progress - at) / span);
  return value * value * (3 - 2 * value);
};
const shorten = (value: string, max: number) => {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  const words = text.split(/\s+/).filter(Boolean);
  let result = '';
  for (const word of words) {
    const candidate = result ? `${result} ${word}` : word;
    if (candidate.length > max) break;
    result = candidate;
  }
  return result || text.slice(0, max);
};
const labelSize = (label: string, large = false) => {
  const base = large ? 42 : 34;
  if (label.length > 32) return base - 10;
  if (label.length > 24) return base - 6;
  if (label.length > 16) return base - 3;
  return base;
};

const ConceptCard: React.FC<{
  label: string;
  accent: string;
  progress: number;
  large?: boolean;
  rotate?: number;
}> = ({label, accent, progress, large = false, rotate = 0}) => (
  <div
    style={{
      minWidth: large ? 360 : 240,
      maxWidth: large ? 470 : 330,
      minHeight: large ? 170 : 118,
      padding: large ? '28px 30px 26px 42px' : '22px 22px 20px 34px',
      border: `7px solid ${palette.ink}`,
      borderRadius: 20,
      background: palette.paper,
      boxShadow: `12px 14px 0 ${palette.ink}18`,
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 900,
      fontSize: labelSize(label, large),
      lineHeight: 1.02,
      textTransform: 'uppercase',
      overflowWrap: 'anywhere',
      wordBreak: 'normal',
      whiteSpace: 'normal',
      opacity: progress,
      transform: `scale(${0.9 + progress * 0.1}) rotate(${rotate}deg)`,
    }}
  >
    <span
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 18,
        borderRight: `5px solid ${palette.ink}`,
        background: accent,
      }}
    />
    {shorten(label, 42)}
  </div>
);

const Connector: React.FC<{progress: number; direction?: 'right' | 'down'}> = ({progress, direction = 'right'}) => (
  <div
    style={{
      width: direction === 'right' ? 78 : 8,
      height: direction === 'right' ? 8 : 56,
      background: palette.ink,
      position: 'relative',
      opacity: progress,
      transform: direction === 'right' ? `scaleX(${progress})` : `scaleY(${progress})`,
      transformOrigin: 'left top',
      flex: '0 0 auto',
    }}
  >
    <div
      style={{
        position: 'absolute',
        right: direction === 'right' ? -4 : -13,
        bottom: direction === 'down' ? -7 : -13,
        width: 24,
        height: 24,
        borderRight: `8px solid ${palette.red}`,
        borderBottom: `8px solid ${palette.red}`,
        transform: direction === 'right' ? 'rotate(-45deg)' : 'rotate(45deg)',
      }}
    />
  </div>
);

const FocusVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34}}>
    <ConceptCard label={contract.subject} accent={palette.red} progress={reveal(progress, 0.03, 0.24)} large />
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 24, width: '88%'}}>
      {contract.labels.slice(1, 5).map((label, index) => (
        <ConceptCard key={`${label}-${index}`} label={label} accent={accents[(index + 1) % 4]} progress={reveal(progress, 0.22 + index * 0.1)} rotate={index % 2 ? 1.2 : -1.2} />
      ))}
    </div>
  </div>
);

const ProcessVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 18px'}}>
    {contract.labels.slice(0, 4).map((label, index, list) => (
      <React.Fragment key={`${label}-${index}`}>
        <ConceptCard label={label} accent={accents[index % 4]} progress={reveal(progress, 0.06 + index * 0.17)} />
        {index < list.length - 1 ? <Connector progress={reveal(progress, 0.18 + index * 0.17)} /> : null}
      </React.Fragment>
    ))}
  </div>
);

const ComparisonVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 90px 1fr', alignItems: 'center', gap: 14, padding: '0 30px'}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center'}}>
      <ConceptCard label={contract.labels[0]} accent={palette.teal} progress={reveal(progress, 0.05)} large />
      {contract.labels[2] ? <ConceptCard label={contract.labels[2]} accent={palette.gold} progress={reveal(progress, 0.42)} /> : null}
    </div>
    <div style={{fontFamily: 'Arial Black', fontSize: 62, textAlign: 'center', color: palette.red, opacity: reveal(progress, 0.28)}}>VS</div>
    <div style={{display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center'}}>
      <ConceptCard label={contract.labels[1] || contract.subject} accent={palette.red} progress={reveal(progress, 0.2)} large />
      {contract.labels[3] ? <ConceptCard label={contract.labels[3]} accent={palette.blue} progress={reveal(progress, 0.55)} /> : null}
    </div>
  </div>
);

const TimelineVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '0 20px'}}>
    {contract.labels.slice(0, 4).map((label, index, list) => (
      <React.Fragment key={`${label}-${index}`}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18}}>
          <div style={{width: 46, height: 46, borderRadius: 999, background: accents[index % 4], border: `7px solid ${palette.ink}`, opacity: reveal(progress, 0.08 + index * 0.15)}} />
          <ConceptCard label={label} accent={accents[index % 4]} progress={reveal(progress, 0.12 + index * 0.15)} />
        </div>
        {index < list.length - 1 ? <Connector progress={reveal(progress, 0.2 + index * 0.15)} /> : null}
      </React.Fragment>
    ))}
  </div>
);

const NetworkVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', position: 'relative'}}>
    <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <ConceptCard label={contract.subject} accent={palette.red} progress={reveal(progress, 0.03)} large />
    </div>
    {contract.labels.slice(1, 5).map((label, index) => {
      const positions = [
        {left: 28, top: 64},
        {right: 28, top: 64},
        {left: 28, bottom: 64},
        {right: 28, bottom: 64},
      ];
      return (
        <div key={`${label}-${index}`} style={{position: 'absolute', ...positions[index]}}>
          <ConceptCard label={label} accent={accents[(index + 1) % 4]} progress={reveal(progress, 0.2 + index * 0.1)} />
        </div>
      );
    })}
  </div>
);

const EvidenceVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', margin: '0 40px', border: `8px solid ${palette.ink}`, borderRadius: 24, padding: 42, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, background: `${palette.ink}0A`}}>
    {contract.labels.slice(0, 4).map((label, index) => (
      <ConceptCard key={`${label}-${index}`} label={label} accent={accents[index % 4]} progress={reveal(progress, 0.08 + index * 0.14)} rotate={index % 2 ? 2 : -2} />
    ))}
  </div>
);

const ExplodedVisual: React.FC<{contract: VisualContract; progress: number}> = ({contract, progress}) => (
  <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.3fr 1fr', alignItems: 'center', gap: 24, padding: '0 18px'}}>
    <div style={{display: 'flex', flexDirection: 'column', gap: 34}}>
      {contract.labels.slice(1, 3).map((label, index) => (
        <ConceptCard key={`${label}-${index}`} label={label} accent={accents[(index + 1) % 4]} progress={reveal(progress, 0.24 + index * 0.13)} />
      ))}
    </div>
    <ConceptCard label={contract.subject} accent={palette.gold} progress={reveal(progress, 0.03)} large />
    <div style={{display: 'flex', flexDirection: 'column', gap: 34}}>
      {contract.labels.slice(3, 5).map((label, index) => (
        <ConceptCard key={`${label}-${index}`} label={label} accent={accents[(index + 3) % 4]} progress={reveal(progress, 0.5 + index * 0.13)} />
      ))}
    </div>
  </div>
);

const ModeVisual: React.FC<{scene: UniversalScene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract;
  if (!contract) return null;
  if (scene.asset) {
    return (
      <div style={{width: '100%', height: '100%', position: 'relative', overflow: 'hidden', border: `8px solid ${palette.ink}`}}>
        <Img src={staticFile(scene.asset)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + progress * 0.05})`}} />
        <div style={{position: 'absolute', inset: '48% 0 0', background: 'linear-gradient(transparent, rgba(0,0,0,.78))'}} />
        <div style={{position: 'absolute', left: 36, right: 36, bottom: 34, fontFamily: 'Arial Black', fontSize: 42, lineHeight: 1.02, color: '#fff', textTransform: 'uppercase', overflowWrap: 'anywhere'}}>
          {contract.subject}
        </div>
      </div>
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

const SceneView: React.FC<{scene: UniversalScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const progress = clamp(frame / Math.max(1, scene.duration * fps - 1));
  const opacity = interpolate(progress, [0, 0.05, 0.93, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleSize = scene.title.length > 42 ? 56 : scene.title.length > 28 ? 64 : 72;
  return (
    <AbsoluteFill style={{background: palette.paper, color: palette.ink, opacity, overflow: 'hidden'}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, ${palette.ink}16 0 1.5px, transparent 2px)`, backgroundSize: '28px 28px', opacity: 0.42}} />
      <div style={{position: 'absolute', left: 58, right: 58, top: 62, display: 'flex', alignItems: 'center', gap: 18}}>
        <b style={{fontFamily: 'Arial Black', fontSize: 27, border: `4px solid ${palette.ink}`, padding: '8px 13px', background: accents[(scene.id - 1) % 4]}}>
          #{String(scene.id).padStart(2, '0')}
        </b>
        <span style={{height: 5, background: palette.ink, flex: 1}} />
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 140, fontFamily: 'Arial Black', fontSize: titleSize, lineHeight: 0.92, letterSpacing: -2, textTransform: 'uppercase', overflowWrap: 'anywhere'}}>
        {shorten(scene.title, 58)}
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, top: 285, fontFamily: 'Arial', fontWeight: 900, fontSize: 28, lineHeight: 1.08, color: palette.red, textTransform: 'uppercase', overflowWrap: 'anywhere'}}>
        {shorten(scene.kicker || scene.secondaryMotif, 74)}
      </div>
      <div style={{position: 'absolute', left: 44, right: 44, top: 380, bottom: 255}}>
        <ModeVisual scene={scene} progress={progress} />
      </div>
      <div style={{position: 'absolute', left: 66, right: 66, bottom: 64, borderTop: `5px solid ${palette.ink}`, paddingTop: 18, fontFamily: 'Georgia', fontWeight: 700, fontSize: 33, lineHeight: 1.12}}>
        {scene.voiceLine}
      </div>
    </AbsoluteFill>
  );
};

export const UniversalSemanticAutoShortV6Safe: React.FC = () => (
  <AbsoluteFill style={{background: palette.paper}}>
    <Audio src={staticFile('auto-factory/audio/final.wav')} />
    {plan.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
        premountFor={15}
      >
        <SceneView scene={scene} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
