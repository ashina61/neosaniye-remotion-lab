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

type Palette = {bg: string; surface: string; ink: string; primary: string; secondary: string; highlight: string; muted: string};
type Motif = {label: string; kind: string; importance: string; depth: number};
type Style = {family: string; palette: Palette; typography: string; texture: string; lighting: string; effects: string[]; density: string};
type VisualDirection = {
  domain: string;
  sceneRole: string;
  sceneMode: string;
  presentationClass: string;
  realismScore: number;
  heroAssetType: string;
  environment: string;
  composition: string;
  renderStrategy: string;
  subject: string;
  supportingSubjects: string[];
  depthPlan: {foreground: string; midground: string; background: string};
};
type VisualContract = {version: 8; motifs: Motif[]; style: Style; visualDirection: VisualDirection};
type LayerCue = {layerId: string; animation: string; start: number; end: number};
type MotionContract = {
  version: 8;
  sceneRole: string;
  motionMode: string;
  cameraMove: string;
  transitionIn: string;
  transitionOut: string;
  heroPath: {from: string; to: string; curve: string};
  phaseTiming: {entranceEnd: number; explanationEnd: number; exitStart: number};
  choreography: LayerCue[];
  emphasisMoments: Array<{at: number; effect: string; target: string; strength: number}>;
  fxBudget: {intensity: number; grain: boolean; glow: boolean; particles: boolean; vignette: boolean; motionBlurHint: boolean; maxConcurrentEffects: number};
};
type V8Scene = ScenePlan & {asset?: string; visualContract?: VisualContract; motionContract?: MotionContract};
type V8Plan = Omit<FactoryPlan, 'scenes'> & {scenes: V8Scene[]; v8?: {version?: number}};

const plan = planJson as unknown as V8Plan;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const v = clamp(value);
  return v * v * (3 - 2 * v);
};
const phase = (progress: number, start: number, end: number) => smooth((progress - start) / Math.max(0.001, end - start));
const short = (value: string, max = 48) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= max) return text;
  const words = text.split(' ');
  let output = '';
  for (const word of words) {
    const next = output ? `${output} ${word}` : word;
    if (next.length > max) break;
    output = next;
  }
  return output || text.slice(0, max);
};
const seedNumber = (value: string) => [...String(value)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);
const font = (style: Style, title = false) => {
  if (/serif|archive|mythic|field/.test(`${style.typography} ${style.family}`)) return title ? 'Georgia, Times New Roman, serif' : 'Georgia, serif';
  if (/mono|blueprint|data/.test(style.typography)) return 'Courier New, monospace';
  return title ? 'Arial Black, Arial, sans-serif' : 'Arial, Helvetica, sans-serif';
};

const cueProgress = (motion: MotionContract, id: string, progress: number) => {
  const cue = motion.choreography.find((item) => item.layerId === id);
  return cue ? phase(progress, cue.start, cue.end) : phase(progress, 0.08, 0.42);
};

const cameraTransform = (move: string, progress: number) => {
  const p = smooth(progress);
  if (/pull-out/.test(move)) return `scale(${1.12 - p * 0.12})`;
  if (/push|dolly|document-push|portrait-push/.test(move)) return `scale(${1 + p * 0.075}) translateY(${-p * 10}px)`;
  if (/track-right|pan-right|route-follow|cross-section-track|graph-track/.test(move)) return `scale(1.045) translateX(${-32 + p * 58}px)`;
  if (/track-left|pan-left/.test(move)) return `scale(1.045) translateX(${32 - p * 58}px)`;
  if (/tilt-up|aerial-descent/.test(move)) return `scale(1.05) translateY(${26 - p * 48}px)`;
  if (/tilt-down/.test(move)) return `scale(1.05) translateY(${-24 + p * 44}px)`;
  if (/orbit/.test(move)) return `scale(${1.03 + p * 0.035}) rotate(${Math.sin(p * Math.PI) * 1.4}deg)`;
  if (/map-zoom/.test(move)) return `scale(${1 + p * 0.11}) translate(${p * -18}px, ${p * -14}px)`;
  if (/handheld|parallax|desk/.test(move)) return `scale(1.04) translate(${Math.sin(p * Math.PI * 2) * 8}px, ${Math.cos(p * Math.PI * 1.5) * 5}px)`;
  if (/rack-focus|focus-shift/.test(move)) return `scale(${1.02 + p * 0.025})`;
  return `scale(${1 + p * 0.035})`;
};

const heroTransform = (path: MotionContract['heroPath'], progress: number) => {
  const p = smooth(progress);
  const positions: Record<string, [number, number, number]> = {
    left: [-150, 0, 0.88], right: [150, 0, 0.88], top: [0, -120, 0.9], bottom: [0, 130, 0.9],
    'deep-background': [0, 30, 0.72], center: [0, 0, 1], foreground: [0, -10, 1.08],
  };
  const from = positions[path.from] || positions['deep-background'];
  const to = positions[path.to] || positions.center;
  const arc = path.curve === 'arc-up' ? -Math.sin(p * Math.PI) * 42 : path.curve === 'arc-down' ? Math.sin(p * Math.PI) * 42 : 0;
  const float = path.curve === 'float' ? Math.sin(p * Math.PI * 2) * 7 : 0;
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p + arc + float;
  const scale = from[2] + (to[2] - from[2]) * p;
  return `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
};

const Grain: React.FC<{palette: Palette; opacity: number}> = ({palette, opacity}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity}}>
    <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, ${palette.ink}22 0 1px, transparent 1.6px)`, backgroundSize: '11px 11px', mixBlendMode: 'overlay'}} />
    <AbsoluteFill style={{backgroundImage: `repeating-linear-gradient(112deg, transparent 0 8px, ${palette.ink}09 9px 10px)`, mixBlendMode: 'multiply'}} />
  </AbsoluteFill>
);

const AtmosphericFx: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const pulse = Math.max(...motion.emphasisMoments.map((moment) => clamp(1 - Math.abs(progress - moment.at) / 0.075)), 0);
  const particleCount = motion.fxBudget.particles ? 26 : 10;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: motion.fxBudget.glow
        ? `radial-gradient(circle at 52% 44%, ${palette.primary}${Math.round((0.15 + pulse * 0.2) * 255).toString(16).padStart(2, '0')}, transparent 48%)`
        : `linear-gradient(130deg, ${palette.primary}14, transparent 45%, ${palette.secondary}10)`}} />
      {Array.from({length: particleCount}).map((_, index) => {
        const base = seedNumber(`${scene.id}-${index}`);
        const left = base % 100;
        const top = (base * 17) % 100;
        const drift = ((index % 5) - 2) * progress * 16;
        return <span key={index} style={{position: 'absolute', left: `${left}%`, top: `${top}%`, width: index % 4 === 0 ? 5 : 3, height: index % 4 === 0 ? 5 : 3, borderRadius: 99, background: index % 3 ? palette.ink : palette.highlight, opacity: 0.08 + (index % 4) * 0.045, transform: `translate(${drift}px, ${-progress * (8 + index % 9)}px)`}} />;
      })}
      {pulse > 0 ? <AbsoluteFill style={{background: `radial-gradient(circle at 50% 46%, ${palette.highlight}${Math.round(pulse * 80).toString(16).padStart(2, '0')}, transparent 42%)`, opacity: pulse}} /> : null}
      {motion.fxBudget.vignette ? <AbsoluteFill style={{boxShadow: 'inset 0 0 190px rgba(0,0,0,.72)'}} /> : null}
      {motion.fxBudget.grain ? <Grain palette={palette} opacity={0.32} /> : null}
    </AbsoluteFill>
  );
};

const Pill: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => (
  <div style={{width: 250, height: 100, borderRadius: 70, overflow: 'hidden', border: `8px solid ${palette.ink}`, display: 'flex', transform: `rotate(${-18 + progress * 5}deg)`, boxShadow: `0 20px 45px ${palette.bg}99`}}>
    <div style={{flex: 1, background: palette.primary}} /><div style={{flex: 1, background: palette.surface}} />
  </div>
);

const HistoricalStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const mode = contract.visualDirection.sceneMode;
  const heroP = cueProgress(motion, 'hero', progress);
  const supportP = cueProgress(motion, 'support-1', progress);
  const labels = contract.motifs.map((item) => item.label);
  const figureX = interpolate(progress, [0, 1], [-70, 520]);
  if (mode === 'archival-evidence' || mode === 'portrait-focus') {
    return (
      <div style={{height: '100%', position: 'relative', transform: heroTransform(motion.heroPath, heroP)}}>
        <div style={{position: 'absolute', left: 80, top: 90, width: 490, height: 620, background: palette.surface, border: `7px solid ${palette.ink}`, transform: `rotate(${-4 + progress * 2}deg)`, padding: 42, boxShadow: `32px 38px 0 ${palette.primary}44`}}>
          <div style={{height: 28, width: '64%', background: palette.primary, marginBottom: 35}} />
          {Array.from({length: 9}).map((_, index) => <div key={index} style={{height: 9, width: `${92 - (index % 4) * 11}%`, background: palette.ink, opacity: 0.48, marginBottom: 20}} />)}
          <div style={{position: 'absolute', right: 34, bottom: 34, width: 122, height: 122, borderRadius: 99, border: `10px double ${palette.primary}`, transform: `rotate(${-12 + supportP * 7}deg) scale(${supportP})`}} />
        </div>
        <div style={{position: 'absolute', right: 65, top: 220, width: 360, height: 470, background: `linear-gradient(145deg, ${palette.muted}, ${palette.bg})`, border: `8px solid ${palette.surface}`, transform: `translateY(${(1 - supportP) * 60}px) rotate(4deg)`, opacity: supportP, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: '31%', top: 70, width: 140, height: 165, borderRadius: '48% 48% 42% 42%', background: palette.highlight}} />
          <div style={{position: 'absolute', left: '15%', right: '15%', bottom: 50, height: 210, borderRadius: '50% 50% 12% 12%', background: palette.primary}} />
        </div>
        <div style={{position: 'absolute', left: 130, right: 110, bottom: 55, display: 'flex', gap: 18, opacity: supportP}}>
          {labels.slice(0, 3).map((label, index) => <span key={label} style={{background: palette.bg, color: palette.ink, border: `2px solid ${palette.primary}`, padding: '10px 15px', fontFamily: font(contract.style), fontWeight: 800, transform: `rotate(${index % 2 ? 2 : -2}deg)`}}>{short(label, 25)}</span>)}
        </div>
      </div>
    );
  }
  if (mode === 'cartographic') return <MapStage scene={scene} progress={progress} />;
  return (
    <div style={{height: '100%', position: 'relative', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(${palette.highlight}20, transparent 42%), linear-gradient(0deg, ${palette.bg}, ${palette.secondary}55)`}} />
      <div style={{position: 'absolute', left: -60, right: -60, bottom: 95, height: 270, background: `linear-gradient(160deg, transparent 0 16%, ${palette.secondary} 17% 46%, transparent 47%), linear-gradient(205deg, transparent 0 26%, ${palette.primary} 27% 60%, transparent 61%)`, opacity: 0.78, transform: `translateX(${Math.sin(progress * Math.PI) * -18}px)`}} />
      <div style={{position: 'absolute', left: 110, right: 80, bottom: 190, height: 240, display: 'flex', alignItems: 'flex-end', gap: 12, opacity: heroP, transform: heroTransform(motion.heroPath, heroP)}}>
        {[210, 145, 260, 175, 230].map((height, index) => <div key={index} style={{width: index === 2 ? 180 : 120, height, background: index % 2 ? palette.surface : palette.muted, border: `6px solid ${palette.ink}`, clipPath: index === 2 ? 'polygon(0 25%, 30% 25%, 50% 0, 70% 25%, 100% 25%, 100% 100%, 0 100%)' : 'polygon(0 18%, 50% 0, 100% 18%, 100% 100%, 0 100%)'}} />)}
      </div>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M80 720 C240 650 350 760 520 670 S760 585 940 630" fill="none" stroke={palette.highlight} strokeWidth="12" strokeDasharray="20 18" strokeDashoffset={900 * (1 - supportP)} />
      </svg>
      {Array.from({length: 6}).map((_, index) => <div key={index} style={{position: 'absolute', left: figureX + index * 62, bottom: 132 + (index % 2) * 8, width: 34, height: 70, borderRadius: '50% 50% 20% 20%', background: palette.ink, opacity: supportP, transform: `scale(${0.82 + (index % 3) * 0.08})`}} />)}
      <div style={{position: 'absolute', left: 65, bottom: 45, color: palette.ink, fontFamily: font(contract.style, true), fontWeight: 900, fontSize: 36, opacity: supportP}}>{short(contract.visualDirection.subject, 36)}</div>
    </div>
  );
};

const MacroStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const heroP = cueProgress(motion, 'hero', progress);
  const supportP = cueProgress(motion, 'support-1', progress);
  const survivorMode = /surviv|resistan|mutation|selection/.test(`${scene.title} ${scene.voiceLine}`.toLowerCase());
  return (
    <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `radial-gradient(circle at 50% 50%, ${palette.surface}, ${palette.bg} 72%)`}}>
      {Array.from({length: 18}).map((_, index) => {
        const angle = (index / 18) * Math.PI * 2;
        const radius = 130 + (index % 5) * 55 + supportP * (survivorMode ? 80 : 15);
        const x = 500 + Math.cos(angle + progress * 0.7) * radius;
        const y = 430 + Math.sin(angle + progress * 0.55) * radius * 0.7;
        const resistant = index % 6 === 0;
        const fade = survivorMode && !resistant ? 1 - phase(progress, 0.38, 0.72) : 1;
        return <div key={index} style={{position: 'absolute', left: x, top: y, width: resistant ? 82 : 58, height: resistant ? 58 : 42, borderRadius: '48% 52% 44% 56%', background: resistant ? palette.highlight : palette.primary, border: `5px solid ${palette.ink}`, opacity: heroP * fade, transform: `translate(-50%,-50%) rotate(${index * 23 + progress * 35}deg) scale(${0.72 + heroP * 0.28})`, boxShadow: resistant ? `0 0 35px ${palette.highlight}` : 'none'}} />;
      })}
      <div style={{position: 'absolute', left: 380, top: 340, opacity: phase(progress, 0.06, 0.36), transform: heroTransform(motion.heroPath, heroP)}}><Pill palette={palette} progress={progress} /></div>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: supportP * 0.66}}>
        <path d="M140 690 C240 510 350 760 450 570 S660 360 850 470" fill="none" stroke={palette.secondary} strokeWidth="7" />
        <path d="M160 720 C250 540 370 790 470 600 S680 390 870 500" fill="none" stroke={palette.highlight} strokeWidth="5" />
        {Array.from({length: 8}).map((_, index) => <line key={index} x1={190 + index * 78} y1={620 - Math.sin(index) * 70} x2={210 + index * 78} y2={650 - Math.sin(index) * 70} stroke={palette.ink} strokeWidth="5" />)}
      </svg>
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 46, display: 'flex', justifyContent: 'space-between', color: palette.ink, fontFamily: font(contract.style), fontSize: 25, fontWeight: 800, opacity: supportP}}>
        {contract.visualDirection.supportingSubjects.slice(0, 3).map((label) => <span key={label}>{short(label, 24)}</span>)}
      </div>
    </div>
  );
};

const TechnicalStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const heroP = cueProgress(motion, 'hero', progress);
  const supportP = cueProgress(motion, 'support-1', progress);
  const pulseX = interpolate(progress, [0.25, 0.88], [160, 820], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `linear-gradient(180deg, ${palette.bg}, ${palette.surface})`}}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${palette.primary}18 1px, transparent 1px), linear-gradient(90deg, ${palette.primary}18 1px, transparent 1px)`, backgroundSize: '42px 42px'}} />
      <div style={{position: 'absolute', left: 90, right: 90, top: 250, height: 300, transform: heroTransform(motion.heroPath, heroP), opacity: heroP}}>
        {[1, 0.78, 0.58, 0.36].map((scale, index) => <div key={scale} style={{position: 'absolute', left: '50%', top: '50%', width: 720 * scale, height: 260 * scale, borderRadius: 180, border: `${18 - index * 2}px solid ${[palette.primary, palette.secondary, palette.highlight, palette.ink][index]}`, transform: 'translate(-50%,-50%)', background: index === 3 ? palette.ink : `${palette.surface}${index === 0 ? '66' : '22'}`}} />)}
        <div style={{position: 'absolute', left: pulseX, top: 132, width: 42, height: 42, borderRadius: 99, background: palette.highlight, boxShadow: `0 0 45px 16px ${palette.highlight}88`, opacity: supportP}} />
      </div>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: supportP}}>
        <path d="M140 660 L320 570 L500 650 L690 545 L870 625" fill="none" stroke={palette.primary} strokeWidth="8" strokeDasharray="16 13" strokeDashoffset={900 * (1 - supportP)} />
        {[140, 320, 500, 690, 870].map((x, index) => <circle key={x} cx={x} cy={[660, 570, 650, 545, 625][index]} r="18" fill={index % 2 ? palette.secondary : palette.highlight} stroke={palette.ink} strokeWidth="5" />)}
      </svg>
      <div style={{position: 'absolute', left: 55, top: 55, fontFamily: font(contract.style), color: palette.ink, fontSize: 24, fontWeight: 800, opacity: supportP}}>{short(contract.visualDirection.environment.replace(/-/g, ' '), 38)}</div>
      <div style={{position: 'absolute', left: 58, right: 58, bottom: 48, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, opacity: supportP}}>
        {contract.visualDirection.supportingSubjects.slice(0, 3).map((label, index) => <div key={label} style={{borderTop: `4px solid ${[palette.primary, palette.secondary, palette.highlight][index]}`, paddingTop: 10, color: palette.ink, fontFamily: font(contract.style), fontSize: 21, fontWeight: 800}}>{short(label, 25)}</div>)}
      </div>
    </div>
  );
};

const MapStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const heroP = cueProgress(motion, 'hero', progress);
  const routeP = cueProgress(motion, 'support-1', progress);
  return (
    <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: palette.surface, transform: heroTransform(motion.heroPath, heroP)}}>
      <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, ${palette.ink}14 0 1px, transparent 1.5px)`, backgroundSize: '18px 18px'}} />
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M40 280 C90 130 220 115 290 205 C335 265 285 325 225 395 C155 480 80 430 55 350 Z" fill={`${palette.primary}55`} stroke={palette.primary} strokeWidth="9" />
        <path d="M575 150 C725 60 930 150 920 315 C910 430 815 455 765 580 C720 690 590 670 555 565 C520 455 500 295 575 150 Z" fill={`${palette.secondary}55`} stroke={palette.secondary} strokeWidth="9" />
        <path d="M165 330 C340 170 520 285 690 310 S820 420 850 510" fill="none" stroke={palette.highlight} strokeWidth="13" strokeDasharray="22 18" strokeDashoffset={900 * (1 - routeP)} />
        {[{x: 165, y: 330}, {x: 420, y: 245}, {x: 690, y: 310}, {x: 850, y: 510}].map((node, index) => <g key={index} opacity={phase(progress, 0.16 + index * 0.11, 0.34 + index * 0.11)}><circle cx={node.x} cy={node.y} r="22" fill={index % 2 ? palette.primary : palette.highlight} stroke={palette.ink} strokeWidth="6" /><circle cx={node.x} cy={node.y} r="43" fill="none" stroke={palette.highlight} strokeWidth="4" opacity=".5" /></g>)}
      </svg>
      <div style={{position: 'absolute', left: 60, top: 55, color: palette.ink, fontFamily: font(contract.style, true), fontSize: 40, fontWeight: 900, opacity: heroP}}>{short(contract.visualDirection.subject, 38)}</div>
      <div style={{position: 'absolute', right: 58, bottom: 45, color: palette.ink, fontFamily: font(contract.style), fontSize: 22, fontWeight: 800, opacity: routeP}}>{short(contract.visualDirection.environment.replace(/-/g, ' '), 34)}</div>
    </div>
  );
};

const EnvironmentStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const heroP = cueProgress(motion, 'hero', progress);
  const supportP = cueProgress(motion, 'support-1', progress);
  return (
    <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `linear-gradient(${palette.secondary}66, ${palette.bg})`}}>
      <div style={{position: 'absolute', left: -80, right: -80, bottom: 130, height: 340, background: `linear-gradient(160deg, transparent 0 14%, ${palette.secondary} 15% 45%, transparent 46%), linear-gradient(205deg, transparent 0 24%, ${palette.primary} 25% 62%, transparent 63%)`, transform: `translateX(${progress * -18}px)`}} />
      {Array.from({length: 8}).map((_, index) => <div key={index} style={{position: 'absolute', left: 70 + index * 115 - progress * (index % 2 ? 12 : 5), bottom: 100 + (index % 3) * 20, width: 40 + (index % 3) * 12, height: 170 + (index % 4) * 32, background: palette.ink, clipPath: 'polygon(42% 0, 58% 0, 61% 42%, 100% 70%, 64% 67%, 70% 100%, 30% 100%, 36% 67%, 0 70%, 39% 42%)', opacity: 0.28 + supportP * 0.62}} />)}
      <div style={{position: 'absolute', left: 390, top: 230, width: 240, height: 190, borderRadius: '52% 48% 44% 56%', background: palette.highlight, border: `10px solid ${palette.ink}`, transform: `${heroTransform(motion.heroPath, heroP)} rotate(${Math.sin(progress * Math.PI * 2) * 4}deg)`, opacity: heroP}} />
      <div style={{position: 'absolute', left: 55, bottom: 45, color: palette.ink, fontFamily: font(contract.style, true), fontSize: 38, fontWeight: 900, opacity: supportP}}>{short(contract.visualDirection.subject, 42)}</div>
    </div>
  );
};

const DataStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const p = cueProgress(motion, 'hero', progress);
  return (
    <div style={{height: '100%', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 32, padding: '90px 75px 110px', background: `linear-gradient(180deg, ${palette.bg}, ${palette.surface})`}}>
      {[0.38, 0.63, 0.49, 0.86, 0.71, 0.95].map((height, index) => <div key={index} style={{width: 72, height: 560 * height * phase(progress, 0.08 + index * 0.055, 0.42 + index * 0.055), background: [palette.primary, palette.secondary, palette.highlight][index % 3], border: `5px solid ${palette.ink}`, boxShadow: `0 0 25px ${palette.bg}`}} />)}
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: p}}><path d="M105 620 C235 590 280 450 420 500 S610 330 735 390 S845 205 930 250" fill="none" stroke={palette.ink} strokeWidth="10" /></svg>
      <div style={{position: 'absolute', left: 55, top: 55, fontFamily: font(contract.style, true), color: palette.ink, fontSize: 40, fontWeight: 900, opacity: p}}>{short(contract.visualDirection.subject, 38)}</div>
    </div>
  );
};

const AssetStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const {palette} = contract.style;
  const heroP = cueProgress(motion, 'hero', progress);
  return (
    <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: palette.bg}}>
      <Img src={staticFile(scene.asset || '')} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `${heroTransform(motion.heroPath, heroP)} scale(${1.05 + progress * 0.055})`, filter: `contrast(1.12) saturate(.88) brightness(${0.86 + heroP * 0.14})`}} />
      <AbsoluteFill style={{background: `linear-gradient(0deg, ${palette.bg}E8, transparent 58%), linear-gradient(120deg, ${palette.primary}33, transparent 46%)`}} />
      <div style={{position: 'absolute', left: 45, bottom: 38, color: palette.ink, fontFamily: font(contract.style, true), fontSize: 37, fontWeight: 900, textShadow: `0 8px 24px ${palette.bg}`, opacity: heroP}}>{short(contract.visualDirection.subject, 42)}</div>
    </div>
  );
};

const Stage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const mode = scene.visualContract!.visualDirection.sceneMode;
  if (scene.asset && scene.visualContract!.visualDirection.renderStrategy === 'asset-first') return <AssetStage scene={scene} progress={progress} />;
  if (/history|forensic|institutional|archive|portrait/.test(mode)) return <HistoricalStage scene={scene} progress={progress} />;
  if (/macro|comparison-lab/.test(mode)) return <MacroStage scene={scene} progress={progress} />;
  if (/cutaway|realistic-object|orbital-diagram/.test(mode)) return <TechnicalStage scene={scene} progress={progress} />;
  if (/map|cartographic/.test(mode)) return <MapStage scene={scene} progress={progress} />;
  if (/environment|behavior/.test(mode)) return <EnvironmentStage scene={scene} progress={progress} />;
  if (/data/.test(mode)) return <DataStage scene={scene} progress={progress} />;
  return <TechnicalStage scene={scene} progress={progress} />;
};

const transitionStyle = (transition: string, progress: number): React.CSSProperties => {
  const enter = phase(progress, 0, 0.12);
  if (/paper-tear|paper-map|desk-wipe|ink-spread/.test(transition)) return {clipPath: `inset(0 ${100 - enter * 100}% 0 0)`, filter: `contrast(${0.8 + enter * 0.2})`};
  if (/crack-split/.test(transition)) return {clipPath: `polygon(0 0, ${48 + enter * 2}% 0, ${54 - enter * 2}% 100%, 0 100%, 0 0, 100% 0, 100% 100%, ${46 + enter * 2}% 100%, ${52 - enter * 2}% 0)`, opacity: enter};
  if (/map-zoom|zoom-through|match-zoom/.test(transition)) return {transform: `scale(${1.22 - enter * 0.22})`, opacity: enter};
  if (/organic-morph|focus-dissolve|depth-dissolve/.test(transition)) return {filter: `blur(${(1 - enter) * 24}px)`, opacity: enter};
  if (/light-wipe|signal-carry|route-carry/.test(transition)) return {clipPath: `inset(0 ${100 - enter * 100}% 0 0)`, opacity: enter};
  return {opacity: enter};
};

const TransitionOverlay: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const motion = scene.motionContract!;
  const palette = scene.visualContract!.style.palette;
  const enter = phase(progress, 0, 0.12);
  if (/signal-carry|route-carry|light-wipe/.test(motion.transitionIn)) {
    return <div style={{position: 'absolute', left: `${enter * 112 - 12}%`, top: 0, bottom: 0, width: 22, background: palette.highlight, boxShadow: `0 0 42px 14px ${palette.highlight}77`, opacity: 1 - enter * 0.55}} />;
  }
  if (/crack-split/.test(motion.transitionIn)) {
    return <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity: 1 - enter}}><path d="M550 -20 L500 320 L575 610 L505 930 L590 1280 L520 1600 L560 1940" fill="none" stroke={palette.highlight} strokeWidth="15" /></svg>;
  }
  return null;
};

const SceneView: React.FC<{scene: V8Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const contract = scene.visualContract;
  const motion = scene.motionContract;
  if (!contract || contract.version !== 8 || !motion || motion.version !== 8) return null;
  const durationFrames = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, durationFrames - 1));
  const exit = 1 - phase(progress, motion.phaseTiming.exitStart, 1);
  const titleP = cueProgress(motion, 'labels', progress);
  const stageP = cueProgress(motion, 'environment', progress);
  const {palette} = contract.style;
  const titleSize = scene.title.length > 44 ? 50 : scene.title.length > 30 ? 58 : 68;
  const focusBlur = /rack-focus|focus-shift/.test(motion.cameraMove) ? Math.abs(Math.sin(progress * Math.PI)) * 0.8 : 0;
  return (
    <AbsoluteFill style={{background: palette.bg, color: palette.ink, overflow: 'hidden', ...transitionStyle(motion.transitionIn, progress), opacity: exit}}>
      <div style={{position: 'absolute', inset: -34, transform: cameraTransform(motion.cameraMove, progress), filter: `blur(${focusBlur}px)`}}>
        <AtmosphericFx scene={scene} progress={progress} />
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 45, display: 'flex', alignItems: 'center', gap: 16, opacity: titleP, transform: `translateY(${(1 - titleP) * -18}px)`}}>
        <b style={{fontFamily: font(contract.style), fontSize: 20, letterSpacing: 2.2, color: palette.highlight, border: `2px solid ${palette.primary}`, padding: '8px 11px', background: `${palette.bg}CC`}}>{String(scene.id).padStart(2, '0')}</b>
        <span style={{height: 3, flex: 1, background: `linear-gradient(90deg, ${palette.primary}, transparent)`}} />
        <span style={{fontFamily: font(contract.style), fontSize: 17, letterSpacing: 1.5, color: palette.muted, textTransform: 'uppercase'}}>{contract.visualDirection.sceneMode.replace(/-/g, ' ')}</span>
      </div>
      <div style={{position: 'absolute', left: 55, right: 55, top: 112, fontFamily: font(contract.style, true), fontSize: titleSize, fontWeight: 900, lineHeight: 0.96, letterSpacing: -1.4, textTransform: /archive|history|data/.test(contract.visualDirection.domain) ? 'uppercase' : 'none', opacity: titleP, transform: `translateX(${(1 - titleP) * -42}px)`, textShadow: `0 12px 32px ${palette.bg}`}}>{short(scene.title, 58)}</div>
      <div style={{position: 'absolute', left: 58, right: 58, top: 270, fontFamily: font(contract.style), fontSize: 23, fontWeight: 800, color: palette.primary, opacity: titleP}}>{short(scene.kicker || contract.visualDirection.environment.replace(/-/g, ' '), 70)}</div>
      <div style={{position: 'absolute', left: 34, right: 34, top: 342, bottom: 238, opacity: stageP, transform: `translateY(${(1 - stageP) * 24}px)`, border: `2px solid ${palette.primary}55`, boxShadow: `0 28px 60px ${palette.bg}AA`, overflow: 'hidden'}}><Stage scene={scene} progress={progress} /></div>
      <div style={{position: 'absolute', left: 60, right: 60, bottom: 55, borderTop: `2px solid ${palette.primary}99`, paddingTop: 15, fontFamily: font(contract.style), fontSize: 29, lineHeight: 1.12, fontWeight: 700, color: palette.ink, opacity: titleP, textShadow: `0 7px 20px ${palette.bg}`}}>{scene.voiceLine}</div>
      <TransitionOverlay scene={scene} progress={progress} />
    </AbsoluteFill>
  );
};

export const AdaptiveDocumentaryAutoShortV8: React.FC = () => (
  <AbsoluteFill style={{background: '#050608'}}>
    <Audio src={staticFile('auto-factory/audio/final.wav')} />
    {plan.scenes.map((scene) => (
      <Sequence key={scene.id} from={Math.round(scene.start * plan.fps)} durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))} premountFor={20}>
        <SceneView scene={scene} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
