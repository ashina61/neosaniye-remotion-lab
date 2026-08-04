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
type MotifKind =
  | 'hero-object'
  | 'orbital'
  | 'organism'
  | 'map-route'
  | 'cross-section'
  | 'mechanism'
  | 'document'
  | 'portrait'
  | 'environment'
  | 'data'
  | 'force-field'
  | 'network'
  | 'timeline';

type AdaptivePalette = {
  bg: string;
  surface: string;
  ink: string;
  primary: string;
  secondary: string;
  highlight: string;
  muted: string;
};

type VisualMotif = {
  label: string;
  kind: MotifKind;
  importance: 'hero' | 'support' | 'detail';
  depth: number;
};

type AdaptiveStyle = {
  family: string;
  palette: AdaptivePalette;
  typography: string;
  texture: string;
  lighting: string;
  shapeLanguage: string;
  motion: string;
  transition: string;
  effects: string[];
  density: 'light' | 'medium' | 'dense';
  fingerprint: string;
};

type VisualContractV7 = {
  version: 7;
  baseVersion: 6;
  mode: VisualMode;
  subject: string;
  labels: string[];
  relation: string;
  layoutVariant: number;
  groundingTokens: string[];
  source: string;
  motifs: VisualMotif[];
  style: AdaptiveStyle;
  direction: {
    hero: string;
    staging: string;
    assetStrategy: 'asset-collage' | 'procedural-illustration';
    avoid: string[];
  };
};

type AdaptiveScene = ScenePlan & {asset?: string; visualContract?: VisualContractV7};
type AdaptivePlan = Omit<FactoryPlan, 'scenes'> & {scenes: AdaptiveScene[]; v7?: {version?: number}};

const plan = planJson as unknown as AdaptivePlan;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const reveal = (progress: number, at: number, span = 0.2) => {
  const value = clamp((progress - at) / span);
  return value * value * (3 - 2 * value);
};
const shorten = (value: string, max = 36) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const words = text.split(' ');
  let result = '';
  for (const word of words) {
    const next = result ? `${result} ${word}` : word;
    if (next.length > max) break;
    result = next;
  }
  return result || text.slice(0, max);
};
const fontFamily = (style: AdaptiveStyle) => {
  if (/serif/.test(style.typography)) return 'Georgia, Times New Roman, serif';
  if (/mono|blueprint|data/.test(style.typography)) return 'Courier New, monospace';
  if (/condensed|industrial|evidence/.test(style.typography)) return 'Arial Narrow, Arial, sans-serif';
  return 'Arial, Helvetica, sans-serif';
};
const titleFamily = (style: AdaptiveStyle) => (/serif|mythic|archive/.test(`${style.typography} ${style.family}`)
  ? 'Georgia, Times New Roman, serif'
  : 'Arial Black, Arial, sans-serif');

const TextureLayer: React.FC<{style: AdaptiveStyle; progress: number}> = ({style, progress}) => {
  const {palette, texture} = style;
  let backgroundImage = `radial-gradient(circle, ${palette.ink}15 0 1px, transparent 1.8px)`;
  let backgroundSize = '24px 24px';
  if (/grid|blueprint|matrix/.test(texture)) {
    backgroundImage = `linear-gradient(${palette.primary}20 1px, transparent 1px), linear-gradient(90deg, ${palette.primary}20 1px, transparent 1px)`;
    backgroundSize = '42px 42px';
  } else if (/star/.test(texture)) {
    backgroundImage = `radial-gradient(circle at 20% 20%, ${palette.ink}AA 0 1px, transparent 2px), radial-gradient(circle at 70% 45%, ${palette.highlight}99 0 1.5px, transparent 2.5px), radial-gradient(circle at 40% 80%, ${palette.ink}88 0 1px, transparent 2px)`;
    backgroundSize = '130px 130px, 190px 190px, 160px 160px';
  } else if (/organic|cell/.test(texture)) {
    backgroundImage = `radial-gradient(ellipse at center, transparent 48%, ${palette.primary}16 50%, transparent 54%)`;
    backgroundSize = '110px 78px';
  } else if (/paper|print|stone/.test(texture)) {
    backgroundImage = `linear-gradient(15deg, ${palette.ink}0B 25%, transparent 25% 75%, ${palette.ink}0B 75%), radial-gradient(circle, ${palette.ink}18 0 1px, transparent 1.5px)`;
    backgroundSize = '18px 18px, 27px 27px';
  } else if (/metal/.test(texture)) {
    backgroundImage = `repeating-linear-gradient(100deg, transparent 0 6px, ${palette.ink}0A 7px 8px)`;
    backgroundSize = '100% 100%';
  }
  return (
    <AbsoluteFill
      style={{
        backgroundImage,
        backgroundSize,
        opacity: 0.28 + Math.sin(progress * Math.PI) * 0.08,
        transform: `translate3d(${progress * -12}px, ${progress * 8}px, 0) scale(1.03)`,
      }}
    />
  );
};

const EffectsLayer: React.FC<{style: AdaptiveStyle; progress: number}> = ({style, progress}) => {
  const {palette, effects, lighting} = style;
  const has = (token: string) => effects.some((effect) => effect.includes(token));
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          background: lighting.includes('beam')
            ? `linear-gradient(112deg, transparent 18%, ${palette.highlight}24 42%, transparent 62%)`
            : lighting.includes('glow')
              ? `radial-gradient(circle at 52% 42%, ${palette.primary}38, transparent 48%)`
              : lighting.includes('spotlight')
                ? `radial-gradient(ellipse at 50% 38%, ${palette.ink}18, transparent 58%)`
                : `linear-gradient(140deg, ${palette.primary}16, transparent 42%, ${palette.secondary}12)`,
          opacity: 0.65,
        }}
      />
      {has('scan') ? (
        <AbsoluteFill
          style={{
            backgroundImage: `repeating-linear-gradient(180deg, transparent 0 7px, ${palette.ink}12 8px 9px)`,
            transform: `translateY(${(progress * 40) % 16}px)`,
            opacity: 0.42,
          }}
        />
      ) : null}
      {has('route') || has('technical') ? (
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: 0.22}}>
          <path d="M40 1380 C270 1120 410 1450 620 1170 S900 1020 1040 760" fill="none" stroke={palette.highlight} strokeWidth="5" strokeDasharray="14 18" />
          <path d="M-20 530 C230 420 330 700 570 590 S860 350 1110 440" fill="none" stroke={palette.primary} strokeWidth="3" strokeDasharray="8 15" />
        </svg>
      ) : null}
      {has('dust') || has('embers') || has('particle') || has('star') ? (
        <AbsoluteFill>
          {Array.from({length: style.density === 'dense' ? 34 : 20}).map((_, index) => {
            const left = (index * 83 + 17) % 100;
            const top = (index * 47 + 11) % 100;
            const drift = ((index % 5) - 2) * progress * 18;
            return (
              <span
                key={index}
                style={{
                  position: 'absolute', left: `${left}%`, top: `${top}%`, width: index % 4 === 0 ? 5 : 3, height: index % 4 === 0 ? 5 : 3,
                  borderRadius: 999, background: has('embers') ? palette.highlight : palette.ink,
                  opacity: 0.18 + (index % 3) * 0.12,
                  transform: `translate(${drift}px, ${-progress * (10 + index % 7)}px)`,
                }}
              />
            );
          })}
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{boxShadow: 'inset 0 0 180px rgba(0,0,0,.72)'}} />
    </AbsoluteFill>
  );
};

const Label: React.FC<{text: string; style: AdaptiveStyle; large?: boolean}> = ({text, style, large = false}) => (
  <div
    style={{
      maxWidth: large ? 430 : 300,
      padding: large ? '15px 22px' : '9px 14px',
      background: `${style.palette.bg}D9`,
      border: `2px solid ${style.palette.primary}B8`,
      color: style.palette.ink,
      fontFamily: fontFamily(style),
      fontWeight: 800,
      fontSize: large ? 31 : 23,
      lineHeight: 1.02,
      letterSpacing: large ? -0.4 : 0.2,
      textAlign: 'center',
      textTransform: /archive|dossier|industrial/.test(style.family) ? 'uppercase' : 'none',
      boxShadow: `0 13px 32px ${style.palette.bg}99`,
      overflowWrap: 'anywhere',
    }}
  >
    {shorten(text, large ? 42 : 32)}
  </div>
);

const MotifFrame: React.FC<{motif: VisualMotif; style: AdaptiveStyle; progress: number; large?: boolean}> = ({motif, style, progress, large = false}) => {
  const p = reveal(progress, motif.importance === 'hero' ? 0.02 : 0.18 + motif.depth * 0.08, 0.25);
  const size = large ? 430 : 260;
  const palette = style.palette;
  const common: React.CSSProperties = {
    width: size,
    height: large ? 430 : 250,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: p,
    transform: `translateY(${(1 - p) * 28}px) scale(${0.9 + p * 0.1})`,
    filter: `drop-shadow(0 22px 30px ${palette.bg}AA)`,
  };

  const orbit = (
    <div style={common}>
      {[1, 0.73, 0.47].map((scale, index) => (
        <div key={scale} style={{position: 'absolute', width: size * scale, height: size * (0.42 + index * 0.06), border: `${large ? 5 : 3}px solid ${index === 0 ? palette.primary : index === 1 ? palette.secondary : palette.highlight}`, borderRadius: '50%', transform: `rotate(${index * 42 + progress * 28}deg)`}} />
      ))}
      <div style={{width: large ? 150 : 95, height: large ? 150 : 95, borderRadius: 999, background: `radial-gradient(circle at 35% 30%, ${palette.highlight}, ${palette.primary} 45%, ${palette.bg} 76%)`, boxShadow: `0 0 70px ${palette.primary}88`}} />
    </div>
  );

  const organism = (
    <div style={common}>
      <div style={{width: large ? 300 : 180, height: large ? 270 : 165, borderRadius: '48% 52% 44% 56%', border: `${large ? 9 : 6}px solid ${palette.primary}`, background: `radial-gradient(circle at 38% 42%, ${palette.highlight}CC 0 12%, transparent 13%), radial-gradient(circle at 64% 62%, ${palette.secondary}D0 0 9%, transparent 10%), ${palette.surface}`, transform: `rotate(${Math.sin(progress * Math.PI * 2) * 4}deg)`, boxShadow: `inset 0 0 34px ${palette.primary}77, 0 0 45px ${palette.primary}55`}}>
        {Array.from({length: 7}).map((_, index) => <span key={index} style={{position: 'absolute', width: 13 + index % 3 * 5, height: 13 + index % 3 * 5, borderRadius: 999, left: `${18 + (index * 17) % 68}%`, top: `${15 + (index * 29) % 70}%`, background: index % 2 ? palette.secondary : palette.highlight, opacity: 0.8}} />)}
      </div>
    </div>
  );

  const mapRoute = (
    <div style={common}>
      <svg width={size} height={large ? 390 : 225} viewBox="0 0 430 300">
        <path d="M28 111 C55 40 121 44 139 83 C155 119 120 133 102 163 C80 199 49 187 34 153 Z" fill={palette.surface} stroke={palette.primary} strokeWidth="7" />
        <path d="M260 58 C322 21 399 55 397 111 C395 150 361 160 343 202 C326 240 281 233 267 196 C252 158 230 117 260 58 Z" fill={palette.surface} stroke={palette.secondary} strokeWidth="7" />
        <path d="M91 127 C170 65 251 79 330 136" fill="none" stroke={palette.highlight} strokeWidth="7" strokeDasharray="12 12" />
        <circle cx="91" cy="127" r="12" fill={palette.primary} /><circle cx="330" cy="136" r="12" fill={palette.secondary} />
      </svg>
    </div>
  );

  const crossSection = (
    <div style={common}>
      {[1, 0.78, 0.56, 0.34].map((scale, index) => (
        <div key={scale} style={{position: 'absolute', width: size * scale, height: (large ? 270 : 170) * scale, borderRadius: 999, border: `${large ? 12 : 8}px solid ${[palette.primary, palette.secondary, palette.highlight, palette.ink][index]}`, background: index === 3 ? palette.ink : 'transparent', opacity: 0.92}} />
      ))}
      <div style={{position: 'absolute', right: large ? -12 : -4, top: '48%', width: large ? 120 : 76, height: 3, background: palette.highlight}} />
    </div>
  );

  const mechanism = (
    <div style={common}>
      {[{x: 32, y: 36, s: 145}, {x: 50, y: 54, s: 110}, {x: 25, y: 68, s: 86}].map((gear, index) => (
        <div key={index} style={{position: 'absolute', left: `${gear.x}%`, top: `${gear.y}%`, width: large ? gear.s : gear.s * 0.65, height: large ? gear.s : gear.s * 0.65, borderRadius: 999, border: `${large ? 14 : 9}px dashed ${[palette.primary, palette.secondary, palette.highlight][index]}`, transform: `translate(-50%,-50%) rotate(${(index % 2 ? -1 : 1) * progress * 100}deg)`, background: `${palette.surface}CC`}}>
          <div style={{position: 'absolute', inset: '34%', borderRadius: 999, background: palette.bg}} />
        </div>
      ))}
    </div>
  );

  const document = (
    <div style={common}>
      <div style={{width: large ? 280 : 180, height: large ? 350 : 220, background: palette.surface, border: `${large ? 8 : 5}px solid ${palette.ink}`, transform: `rotate(${-3 + progress * 2}deg)`, padding: large ? 34 : 22, boxShadow: `16px 18px 0 ${palette.primary}55`}}>
        <div style={{height: large ? 24 : 15, width: '62%', background: palette.primary, marginBottom: large ? 30 : 18}} />
        {Array.from({length: 6}).map((_, index) => <div key={index} style={{height: large ? 8 : 5, width: `${92 - (index % 3) * 13}%`, background: palette.ink, opacity: 0.62, marginBottom: large ? 18 : 11}} />)}
        <div style={{position: 'absolute', right: large ? 25 : 16, bottom: large ? 24 : 15, width: large ? 90 : 58, height: large ? 90 : 58, borderRadius: 999, border: `${large ? 8 : 5}px solid ${palette.primary}`, color: palette.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: large ? 22 : 14, fontWeight: 900, transform: 'rotate(-14deg)'}}>FILE</div>
      </div>
    </div>
  );

  const portrait = (
    <div style={common}>
      <div style={{position: 'absolute', top: large ? 45 : 28, width: large ? 150 : 95, height: large ? 170 : 108, borderRadius: '48% 48% 42% 42%', background: `linear-gradient(135deg, ${palette.highlight}, ${palette.primary})`, border: `${large ? 8 : 5}px solid ${palette.ink}`}} />
      <div style={{position: 'absolute', bottom: large ? 32 : 20, width: large ? 300 : 190, height: large ? 170 : 108, borderRadius: '50% 50% 16% 16%', background: palette.surface, border: `${large ? 8 : 5}px solid ${palette.ink}`}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: large ? 25 : 16, height: large ? 22 : 14, background: palette.secondary, transform: 'rotate(-5deg)'}} />
    </div>
  );

  const environment = (
    <div style={common}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: large ? 42 : 28, height: large ? 190 : 120, background: `linear-gradient(150deg, transparent 0 15%, ${palette.secondary} 16% 42%, transparent 43%), linear-gradient(210deg, transparent 0 22%, ${palette.primary} 23% 57%, transparent 58%)`, opacity: 0.92}} />
      <div style={{position: 'absolute', top: large ? 45 : 30, right: large ? 60 : 38, width: large ? 75 : 48, height: large ? 75 : 48, borderRadius: 999, background: palette.highlight, boxShadow: `0 0 45px ${palette.highlight}99`}} />
      <div style={{position: 'absolute', left: 0, right: 0, bottom: large ? 38 : 24, height: large ? 42 : 27, background: palette.bg, borderTop: `4px solid ${palette.ink}`}} />
    </div>
  );

  const data = (
    <div style={{...common, alignItems: 'flex-end', gap: large ? 18 : 11, padding: large ? 55 : 34}}>
      {[0.38, 0.72, 0.54, 0.9, 0.66].map((height, index) => (
        <div key={index} style={{width: large ? 44 : 28, height: (large ? 260 : 160) * height * p, background: [palette.primary, palette.secondary, palette.highlight][index % 3], border: `${large ? 5 : 3}px solid ${palette.ink}`}} />
      ))}
      <div style={{position: 'absolute', left: '10%', right: '8%', bottom: large ? 58 : 36, height: 4, background: palette.ink}} />
    </div>
  );

  const forceField = (
    <div style={common}>
      {[1, 0.73, 0.46].map((scale, index) => (
        <div key={scale} style={{position: 'absolute', width: size * scale, height: size * scale, borderRadius: 999, border: `${large ? 6 : 4}px solid ${[palette.primary, palette.secondary, palette.highlight][index]}`, opacity: 0.75 - index * 0.1, transform: `scale(${0.94 + Math.sin(progress * Math.PI * 2 + index) * 0.04})`}} />
      ))}
      <div style={{width: large ? 86 : 55, height: large ? 86 : 55, borderRadius: 999, background: palette.ink, boxShadow: `0 0 65px ${palette.primary}`}} />
    </div>
  );

  const network = (
    <div style={common}>
      <svg width={size} height={large ? 390 : 225} viewBox="0 0 430 300">
        {[[215,150,64,52],[80,70,30,25],[350,72,31,25],[75,235,28,23],[355,228,29,24]].map((node, index) => (
          <React.Fragment key={index}>
            {index > 0 ? <line x1="215" y1="150" x2={node[0]} y2={node[1]} stroke={index % 2 ? palette.primary : palette.secondary} strokeWidth="6" strokeDasharray="10 10" /> : null}
            <ellipse cx={node[0]} cy={node[1]} rx={node[2]} ry={node[3]} fill={index === 0 ? palette.surface : palette.bg} stroke={[palette.highlight, palette.primary, palette.secondary][index % 3]} strokeWidth="8" />
          </React.Fragment>
        ))}
      </svg>
    </div>
  );

  const timeline = (
    <div style={common}>
      <div style={{position: 'absolute', left: '8%', right: '8%', top: '50%', height: large ? 8 : 5, background: palette.ink}} />
      {[16, 38, 62, 84].map((left, index) => <div key={left} style={{position: 'absolute', left: `${left}%`, top: '50%', width: large ? 45 : 29, height: large ? 45 : 29, borderRadius: 999, background: [palette.primary, palette.secondary, palette.highlight][index % 3], border: `${large ? 6 : 4}px solid ${palette.ink}`, transform: `translate(-50%,-50%) scale(${reveal(progress, 0.08 + index * 0.13)})`}} />)}
    </div>
  );

  const heroObject = (
    <div style={common}>
      <div style={{width: large ? 280 : 180, height: large ? 280 : 180, borderRadius: style.shapeLanguage.includes('angular') ? 28 : 999, background: `linear-gradient(145deg, ${palette.highlight}, ${palette.primary} 50%, ${palette.secondary})`, border: `${large ? 10 : 6}px solid ${palette.ink}`, transform: `rotate(${style.shapeLanguage.includes('angular') ? -5 + progress * 4 : 0}deg)`, boxShadow: `inset 0 0 55px ${palette.bg}88, 0 0 60px ${palette.primary}55`}} />
      <div style={{position: 'absolute', width: large ? 150 : 95, height: large ? 18 : 12, background: palette.ink, transform: 'rotate(-35deg)'}} />
    </div>
  );

  const art = motif.kind === 'orbital' ? orbit
    : motif.kind === 'organism' ? organism
      : motif.kind === 'map-route' ? mapRoute
        : motif.kind === 'cross-section' ? crossSection
          : motif.kind === 'mechanism' ? mechanism
            : motif.kind === 'document' ? document
              : motif.kind === 'portrait' ? portrait
                : motif.kind === 'environment' ? environment
                  : motif.kind === 'data' ? data
                    : motif.kind === 'force-field' ? forceField
                      : motif.kind === 'network' ? network
                        : motif.kind === 'timeline' ? timeline
                          : heroObject;

  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: large ? 14 : 7}}>
      {art}
      <Label text={motif.label} style={style} large={large} />
    </div>
  );
};

const Arrow: React.FC<{style: AdaptiveStyle; progress: number; vertical?: boolean}> = ({style, progress, vertical = false}) => (
  <div style={{width: vertical ? 8 : 80, height: vertical ? 70 : 8, background: style.palette.highlight, position: 'relative', opacity: progress, transform: vertical ? `scaleY(${progress})` : `scaleX(${progress})`, transformOrigin: 'left top'}}>
    <span style={{position: 'absolute', right: vertical ? -10 : -4, bottom: vertical ? -3 : -10, width: 24, height: 24, borderRight: `8px solid ${style.palette.highlight}`, borderBottom: `8px solid ${style.palette.highlight}`, transform: vertical ? 'rotate(45deg)' : 'rotate(-45deg)'}} />
  </div>
);

const ProceduralStage: React.FC<{contract: VisualContractV7; progress: number}> = ({contract, progress}) => {
  const motifs = contract.motifs.slice(0, 5);
  const hero = motifs[0];
  const supports = motifs.slice(1);
  if (contract.mode === 'process' || contract.mode === 'timeline') {
    return (
      <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12}}>
        {motifs.slice(0, 4).map((motif, index, list) => (
          <React.Fragment key={`${motif.label}-${index}`}>
            <MotifFrame motif={motif} style={contract.style} progress={progress} />
            {index < list.length - 1 ? <Arrow style={contract.style} progress={reveal(progress, 0.18 + index * 0.15)} /> : null}
          </React.Fragment>
        ))}
      </div>
    );
  }
  if (contract.mode === 'comparison') {
    return (
      <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 110px 1fr', alignItems: 'center', gap: 8}}>
        <MotifFrame motif={motifs[0]} style={contract.style} progress={progress} large />
        <div style={{fontFamily: titleFamily(contract.style), fontSize: 62, fontWeight: 900, color: contract.style.palette.highlight, textAlign: 'center'}}>VS</div>
        <MotifFrame motif={motifs[1] || motifs[0]} style={contract.style} progress={progress} large />
      </div>
    );
  }
  if (contract.mode === 'network') {
    return (
      <div style={{height: '100%', position: 'relative'}}>
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}><MotifFrame motif={hero} style={contract.style} progress={progress} large /></div>
        {supports.slice(0, 4).map((motif, index) => {
          const positions = [{left: 0, top: 20}, {right: 0, top: 20}, {left: 0, bottom: 10}, {right: 0, bottom: 10}];
          return <div key={`${motif.label}-${index}`} style={{position: 'absolute', ...positions[index]}}><MotifFrame motif={motif} style={contract.style} progress={progress} /></div>;
        })}
      </div>
    );
  }
  if (contract.mode === 'evidence') {
    return (
      <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', justifyItems: 'center', gap: 8, transform: 'rotate(-1deg)'}}>
        {motifs.slice(0, 4).map((motif, index) => <div key={`${motif.label}-${index}`} style={{transform: `rotate(${index % 2 ? 3 : -3}deg)`}}><MotifFrame motif={{...motif, kind: index === 0 ? motif.kind : 'document'}} style={contract.style} progress={progress} /></div>)}
      </div>
    );
  }
  if (contract.mode === 'exploded') {
    return (
      <div style={{height: '100%', display: 'grid', gridTemplateColumns: '1fr 1.35fr 1fr', alignItems: 'center', justifyItems: 'center'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 25}}>{supports.slice(0, 2).map((motif, index) => <MotifFrame key={`${motif.label}-${index}`} motif={motif} style={contract.style} progress={progress} />)}</div>
        <MotifFrame motif={{...hero, kind: hero.kind === 'hero-object' ? 'cross-section' : hero.kind}} style={contract.style} progress={progress} large />
        <div style={{display: 'flex', flexDirection: 'column', gap: 25}}>{supports.slice(2, 4).map((motif, index) => <MotifFrame key={`${motif.label}-${index}`} motif={motif} style={contract.style} progress={progress} />)}</div>
      </div>
    );
  }
  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18}}>
      <MotifFrame motif={hero} style={contract.style} progress={progress} large />
      <div style={{display: 'flex', gap: 28, alignItems: 'flex-start', justifyContent: 'center'}}>
        {supports.slice(0, 3).map((motif, index) => <MotifFrame key={`${motif.label}-${index}`} motif={motif} style={contract.style} progress={progress} />)}
      </div>
    </div>
  );
};

const AssetStage: React.FC<{scene: AdaptiveScene; contract: VisualContractV7; progress: number}> = ({scene, contract, progress}) => (
  <div style={{height: '100%', position: 'relative', overflow: 'hidden', border: `3px solid ${contract.style.palette.primary}88`}}>
    <Img src={staticFile(scene.asset || '')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.06 + progress * 0.06}) translateY(${progress * -10}px)`, filter: `contrast(1.12) saturate(.9)`}} />
    <AbsoluteFill style={{background: `linear-gradient(120deg, ${contract.style.palette.bg}66, transparent 45%, ${contract.style.palette.primary}22), linear-gradient(0deg, ${contract.style.palette.bg}E8, transparent 62%)`}} />
    <div style={{position: 'absolute', left: 34, right: 34, bottom: 34}}><Label text={contract.direction.hero} style={contract.style} large /></div>
  </div>
);

const SceneView: React.FC<{scene: AdaptiveScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contract = scene.visualContract;
  if (!contract || contract.version !== 7) return null;
  const progress = clamp(frame / Math.max(1, scene.duration * fps - 1));
  const opacity = interpolate(progress, [0, 0.045, 0.94, 1], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const style = contract.style;
  const zoom = 1 + progress * (/push|zoom|orbit/.test(style.motion) ? 0.045 : 0.018);
  const driftX = /drift|parallax|handheld/.test(style.motion) ? Math.sin(progress * Math.PI * 2) * 8 : 0;
  const titleSize = scene.title.length > 44 ? 52 : scene.title.length > 30 ? 61 : 70;
  return (
    <AbsoluteFill style={{background: style.palette.bg, color: style.palette.ink, opacity, overflow: 'hidden'}}>
      <TextureLayer style={style} progress={progress} />
      <div style={{position: 'absolute', inset: -30, transform: `translateX(${driftX}px) scale(${zoom})`}}>
        <EffectsLayer style={style} progress={progress} />
      </div>
      <div style={{position: 'absolute', left: 54, right: 54, top: 52, display: 'flex', alignItems: 'center', gap: 16}}>
        <b style={{fontFamily: fontFamily(style), fontSize: 22, letterSpacing: 2, color: style.palette.highlight, border: `2px solid ${style.palette.primary}`, padding: '8px 12px', background: `${style.palette.bg}CC`}}>
          {String(scene.id).padStart(2, '0')}
        </b>
        <span style={{height: 3, flex: 1, background: `linear-gradient(90deg, ${style.palette.primary}, transparent)`}} />
        <span style={{fontFamily: fontFamily(style), fontSize: 18, letterSpacing: 1.6, color: style.palette.muted, textTransform: 'uppercase'}}>{style.family.replace(/-/g, ' ')}</span>
      </div>
      <div style={{position: 'absolute', left: 58, right: 58, top: 118, fontFamily: titleFamily(style), fontSize: titleSize, fontWeight: 900, lineHeight: 0.95, letterSpacing: -1.8, textTransform: /archive|dossier|industrial|data/.test(style.family) ? 'uppercase' : 'none', textShadow: `0 12px 34px ${style.palette.bg}`}}>
        {shorten(scene.title, 58)}
      </div>
      <div style={{position: 'absolute', left: 60, right: 60, top: 274, fontFamily: fontFamily(style), fontSize: 24, lineHeight: 1.08, fontWeight: 800, color: style.palette.primary, letterSpacing: 0.7}}>
        {shorten(scene.kicker || scene.secondaryMotif, 72)}
      </div>
      <div style={{position: 'absolute', left: 38, right: 38, top: 350, bottom: 245}}>
        {scene.asset ? <AssetStage scene={scene} contract={contract} progress={progress} /> : <ProceduralStage contract={contract} progress={progress} />}
      </div>
      <div style={{position: 'absolute', left: 62, right: 62, bottom: 58, borderTop: `2px solid ${style.palette.primary}99`, paddingTop: 15, fontFamily: fontFamily(style), fontSize: 30, lineHeight: 1.13, fontWeight: 700, color: style.palette.ink, textShadow: `0 6px 18px ${style.palette.bg}`}}>
        {scene.voiceLine}
      </div>
    </AbsoluteFill>
  );
};

export const AdaptiveDocumentaryAutoShortV7: React.FC = () => (
  <AbsoluteFill style={{background: '#050608'}}>
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
