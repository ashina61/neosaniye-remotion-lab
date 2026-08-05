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
type Style = {family: string; palette: Palette; typography: string; texture: string; lighting: string; effects: string[]; density: string};
type VisualDirection = {
  domain: string; sceneRole: string; sceneMode: string; presentationClass: string; realismScore: number;
  heroAssetType: string; environment: string; composition: string; renderStrategy: string; subject: string;
  supportingSubjects: string[]; depthPlan: {foreground: string; midground: string; background: string};
};
type VisualContract = {version: 8; style: Style; visualDirection: VisualDirection; motifs: Array<{label: string; kind: string; importance: string; depth: number}>};
type MotionContract = {
  version: 8; sceneRole: string; motionMode: string; cameraMove: string; transitionIn: string; transitionOut: string;
  heroPath: {from: string; to: string; curve: string}; phaseTiming: {entranceEnd: number; explanationEnd: number; exitStart: number};
  choreography: Array<{layerId: string; animation: string; start: number; end: number}>;
  emphasisMoments: Array<{at: number; effect: string; target: string; strength: number}>;
  fxBudget: {intensity: number; grain: boolean; glow: boolean; particles: boolean; vignette: boolean; motionBlurHint: boolean; maxConcurrentEffects: number};
};
type V8Scene = ScenePlan & {asset?: string; visualContract?: VisualContract; motionContract?: MotionContract};
type V8Plan = Omit<FactoryPlan, 'scenes'> & {scenes: V8Scene[]};

const plan = planJson as unknown as V8Plan;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => {const v = clamp(value); return v * v * (3 - 2 * v);};
const phase = (progress: number, start: number, end: number) => ease((progress - start) / Math.max(0.001, end - start));
const words = (value: string) => String(value || '').replace(/\s+/g, ' ').trim();
const shorten = (value: string, max = 54) => {
  const text = words(value);
  if (text.length <= max) return text;
  let out = '';
  for (const word of text.split(' ')) {
    if (`${out} ${word}`.trim().length > max) break;
    out = `${out} ${word}`.trim();
  }
  return out || text.slice(0, max);
};
const hash = (value: string) => [...String(value)].reduce((state, char) => (Math.imul(state, 31) + char.charCodeAt(0)) >>> 0, 17);
const alpha = (hex: string, opacity: number) => `${hex}${Math.round(clamp(opacity) * 255).toString(16).padStart(2, '0')}`;
const familyFont = (style: Style, title = false) => {
  if (/archive|mythic|field|serif/.test(`${style.family} ${style.typography}`)) return title ? 'Georgia, Times New Roman, serif' : 'Georgia, serif';
  if (/blueprint|data|mono/.test(`${style.family} ${style.typography}`)) return 'Courier New, monospace';
  return title ? 'Arial Black, Arial, sans-serif' : 'Arial, Helvetica, sans-serif';
};
const cue = (motion: MotionContract, layer: string, progress: number, fallback: [number, number] = [0.08, 0.42]) => {
  const item = motion.choreography.find((entry) => entry.layerId === layer);
  return phase(progress, item?.start ?? fallback[0], item?.end ?? fallback[1]);
};

const camera = (move: string, progress: number) => {
  const p = ease(progress);
  if (/pull-out/.test(move)) return `scale(${1.13 - p * 0.13})`;
  if (/push|dolly/.test(move)) return `scale(${1 + p * 0.085}) translateY(${-p * 12}px)`;
  if (/right|route-follow|cross-section-track|graph-track/.test(move)) return `scale(1.045) translateX(${-34 + p * 62}px)`;
  if (/left/.test(move)) return `scale(1.045) translateX(${34 - p * 62}px)`;
  if (/tilt-up|aerial-descent/.test(move)) return `scale(1.055) translateY(${28 - p * 52}px)`;
  if (/tilt-down/.test(move)) return `scale(1.055) translateY(${-28 + p * 52}px)`;
  if (/orbit/.test(move)) return `scale(${1.02 + p * 0.045}) rotate(${Math.sin(p * Math.PI) * 1.7}deg)`;
  if (/map-zoom/.test(move)) return `scale(${1 + p * 0.12}) translate(${-p * 18}px, ${-p * 14}px)`;
  if (/parallax|handheld|desk/.test(move)) return `scale(1.04) translate(${Math.sin(p * Math.PI * 2) * 8}px, ${Math.cos(p * Math.PI * 1.4) * 6}px)`;
  return `scale(${1 + p * 0.035})`;
};

const entryTransform = (path: MotionContract['heroPath'], progress: number) => {
  const p = ease(progress);
  const positions: Record<string, [number, number, number]> = {
    left: [-160, 0, 0.9], right: [160, 0, 0.9], top: [0, -140, 0.9], bottom: [0, 150, 0.9],
    'deep-background': [0, 25, 0.73], center: [0, 0, 1], foreground: [0, -8, 1.08],
  };
  const from = positions[path.from] || positions['deep-background'];
  const to = positions[path.to] || positions.center;
  const arc = path.curve === 'arc-up' ? -Math.sin(p * Math.PI) * 42 : path.curve === 'arc-down' ? Math.sin(p * Math.PI) * 42 : 0;
  const float = path.curve === 'float' ? Math.sin(p * Math.PI * 2) * 8 : 0;
  return `translate3d(${from[0] + (to[0] - from[0]) * p}px, ${from[1] + (to[1] - from[1]) * p + arc + float}px, 0) scale(${from[2] + (to[2] - from[2]) * p})`;
};

const Texture: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const palette = contract.style.palette;
  const pulse = Math.max(0, ...motion.emphasisMoments.map((item) => clamp(1 - Math.abs(progress - item.at) / 0.07) * item.strength));
  const particles = motion.fxBudget.particles ? 22 : 8;
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 42%, ${alpha(palette.highlight, 0.08 + pulse * 0.14)}, transparent 46%), linear-gradient(130deg, ${alpha(palette.primary, 0.09)}, transparent 45%, ${alpha(palette.secondary, 0.08)})`}} />
    {Array.from({length: particles}).map((_, index) => {
      const n = hash(`${scene.id}-${index}`);
      return <span key={index} style={{position: 'absolute', left: `${n % 100}%`, top: `${(n * 19) % 100}%`, width: index % 5 === 0 ? 5 : 3, height: index % 5 === 0 ? 5 : 3, borderRadius: 99, background: index % 3 ? palette.ink : palette.highlight, opacity: 0.06 + (index % 4) * 0.04, transform: `translate(${((index % 5) - 2) * progress * 11}px, ${-progress * (6 + index % 8)}px)`}} />;
    })}
    {motion.fxBudget.grain ? <AbsoluteFill style={{opacity: 0.28, backgroundImage: `radial-gradient(circle, ${alpha(palette.ink, 0.15)} 0 1px, transparent 1.5px), repeating-linear-gradient(108deg, transparent 0 9px, ${alpha(palette.ink, 0.035)} 10px 11px)`, backgroundSize: '12px 12px'}} /> : null}
    {motion.fxBudget.vignette ? <AbsoluteFill style={{boxShadow: 'inset 0 0 180px rgba(0,0,0,.68)'}} /> : null}
  </AbsoluteFill>;
};

const OceanFloor: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => <>
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${alpha(palette.secondary, 0.54)}, ${palette.bg} 62%, ${palette.muted})`}} />
  <div style={{position: 'absolute', left: -80, right: -80, bottom: -10, height: 230, borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${palette.muted}, ${palette.ink})`, transform: `translateX(${Math.sin(progress * Math.PI) * -18}px)`}} />
  {Array.from({length: 11}).map((_, index) => <div key={index} style={{position: 'absolute', left: 30 + index * 92, bottom: 70 + (index % 4) * 17, width: 24 + (index % 3) * 12, height: 16 + (index % 2) * 9, borderRadius: '55% 45%', background: index % 2 ? palette.surface : palette.primary, opacity: 0.35}} />)}
</>;

const CableLine: React.FC<{palette: Palette; progress: number; y?: number; armored?: boolean}> = ({palette, progress, y = 620, armored = false}) => <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
  <path d={`M-50 ${y} C170 ${y - 100} 310 ${y + 75} 510 ${y - 25} S790 ${y - 110} 1060 ${y - 10}`} fill="none" stroke={palette.ink} strokeWidth={armored ? 34 : 24} strokeLinecap="round" />
  <path d={`M-50 ${y} C170 ${y - 100} 310 ${y + 75} 510 ${y - 25} S790 ${y - 110} 1060 ${y - 10}`} fill="none" stroke={palette.highlight} strokeWidth={armored ? 14 : 9} strokeLinecap="round" strokeDasharray={armored ? '8 13' : undefined} strokeDashoffset={armored ? 420 * (1 - progress) : undefined} />
</svg>;

const PhysicalTechnologyStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!;
  const motion = scene.motionContract!;
  const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress);
  const support = cue(motion, 'support-1', progress);
  const text = words(`${scene.title} ${scene.voiceLine} ${contract.visualDirection.subject}`).toLowerCase();
  const isCable = /cable|fiber|fibre|undersea|submarine/.test(`${plan.topic} ${text}`.toLowerCase());
  if (!isCable) return <GenericPhysicalObject scene={scene} progress={progress} />;

  const shipScene = /ship|lay|laid|repair|raise|retrieve|survey|fault/.test(text);
  const shoreScene = /landing|shore|coast|station|terrestrial/.test(text);
  const hazardScene = /shallow|anchor|fishing|armor|armour|protect/.test(text);
  const repeaterScene = /repeater|amplif|restore|signal/.test(text);

  return <div style={{height: '100%', position: 'relative', overflow: 'hidden'}}>
    <OceanFloor palette={palette} progress={progress} />
    <CableLine palette={palette} progress={support} y={hazardScene ? 650 : 630} armored={hazardScene} />
    {shipScene ? <>
      <div style={{position: 'absolute', left: 235 + progress * 55, top: 105, width: 440, height: 105, background: palette.surface, border: `7px solid ${palette.ink}`, clipPath: 'polygon(0 0, 82% 0, 100% 38%, 91% 100%, 13% 100%)', transform: entryTransform(motion.heroPath, hero), opacity: hero}} />
      <div style={{position: 'absolute', left: 410 + progress * 55, top: 45, width: 125, height: 70, background: palette.primary, border: `6px solid ${palette.ink}`, opacity: hero}} />
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: support}}><path d="M500 205 C480 350 560 430 530 625" fill="none" stroke={palette.highlight} strokeWidth="12" /><circle cx="530" cy="625" r="28" fill={palette.primary} stroke={palette.ink} strokeWidth="7" /></svg>
    </> : null}
    {shoreScene ? <>
      <div style={{position: 'absolute', right: -20, top: 0, bottom: 180, width: 410, background: `linear-gradient(100deg, transparent 0 8%, ${palette.surface} 9% 100%)`, opacity: hero}} />
      <div style={{position: 'absolute', right: 85, top: 270, width: 250, height: 230, background: palette.surface, border: `8px solid ${palette.ink}`, opacity: hero, transform: `translateX(${(1 - hero) * 90}px)`}}><div style={{position: 'absolute', left: 35, right: 35, top: 58, height: 24, background: palette.primary}} /><div style={{position: 'absolute', left: 35, right: 35, top: 112, height: 24, background: palette.secondary}} /></div>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: support}}><path d="M150 640 C430 590 600 560 820 430" fill="none" stroke={palette.highlight} strokeWidth="13" strokeDasharray="22 15" strokeDashoffset={600 * (1 - support)} /></svg>
    </> : null}
    {repeaterScene ? Array.from({length: 4}).map((_, index) => <div key={index} style={{position: 'absolute', left: 145 + index * 210, bottom: 202 + Math.sin(index) * 30, width: 86, height: 54, borderRadius: 32, background: palette.primary, border: `7px solid ${palette.ink}`, boxShadow: `0 0 ${20 + support * 35}px ${alpha(palette.highlight, 0.75)}`, opacity: phase(progress, 0.18 + index * 0.1, 0.38 + index * 0.1)}} />) : null}
    {hazardScene ? <>
      <div style={{position: 'absolute', left: 170, top: 120, width: 18, height: 290, background: palette.ink, transform: `rotate(${15 - support * 6}deg)`, transformOrigin: 'top'}}><div style={{position: 'absolute', left: -52, bottom: -12, width: 120, height: 70, border: `14px solid ${palette.ink}`, borderTop: 0, borderRadius: '0 0 70px 70px'}} /></div>
      <div style={{position: 'absolute', left: 70, top: 80, fontFamily: familyFont(contract.style, true), fontSize: 34, fontWeight: 900, color: palette.ink, opacity: support}}>SHALLOW WATER RISK</div>
    </> : null}
    {!shipScene && !shoreScene && !hazardScene && !repeaterScene ? <>
      <div style={{position: 'absolute', left: 100, top: 115, width: 800, height: 210, borderRadius: '50%', border: `7px solid ${alpha(palette.highlight, 0.44)}`, transform: `scale(${0.72 + hero * 0.28})`, opacity: hero}} />
      <div style={{position: 'absolute', left: 130, right: 130, top: 170, textAlign: 'center', fontFamily: familyFont(contract.style, true), fontSize: 43, fontWeight: 900, color: palette.surface, textShadow: `0 8px 24px ${palette.bg}`, opacity: hero}}>{shorten(contract.visualDirection.subject, 42)}</div>
    </> : null}
    <div style={{position: 'absolute', left: 42, right: 42, bottom: 28, display: 'flex', gap: 14, opacity: support}}>{contract.visualDirection.supportingSubjects.slice(0, 3).map((label) => <span key={label} style={{background: alpha(palette.bg, 0.78), color: palette.surface, border: `2px solid ${palette.highlight}`, padding: '9px 13px', fontFamily: familyFont(contract.style), fontWeight: 800, fontSize: 19}}>{shorten(label, 24)}</span>)}</div>
  </div>;
};

const GenericPhysicalObject: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  return <div style={{height: '100%', position: 'relative', background: `linear-gradient(145deg, ${palette.bg}, ${palette.surface})`, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 240, top: 165, width: 520, height: 420, borderRadius: 70, background: `linear-gradient(145deg, ${palette.surface}, ${palette.muted})`, border: `11px solid ${palette.ink}`, boxShadow: `28px 35px 0 ${alpha(palette.primary, 0.3)}`, transform: entryTransform(motion.heroPath, hero), opacity: hero}}><div style={{position: 'absolute', left: 85, right: 85, top: 95, height: 110, background: palette.bg, border: `7px solid ${palette.ink}`}} /><div style={{position: 'absolute', left: 105, right: 105, bottom: 62, height: 35, background: palette.highlight}} /></div>
    <div style={{position: 'absolute', left: 80, right: 80, bottom: 48, color: palette.ink, fontFamily: familyFont(contract.style, true), fontSize: 36, fontWeight: 900, textAlign: 'center', opacity: support}}>{shorten(contract.visualDirection.subject, 44)}</div>
  </div>;
};

const CutawayStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  const composition = contract.visualDirection.composition;
  const colors = [palette.primary, palette.secondary, palette.highlight, palette.ink];
  const pulseX = interpolate(progress, [0.24, 0.87], [145, 810], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const horizontal = /signal-through-core|transparent-shell/.test(composition);
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `linear-gradient(180deg, ${palette.bg}, ${palette.surface})`}}>
    <AbsoluteFill style={{backgroundImage: `linear-gradient(${alpha(palette.primary, 0.09)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(palette.primary, 0.09)} 1px, transparent 1px)`, backgroundSize: '42px 42px'}} />
    {composition === 'exploded-axis' ? <div style={{position: 'absolute', inset: '135px 70px 170px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, opacity: hero, transform: entryTransform(motion.heroPath, hero)}}>{[220, 180, 135, 90].map((size, index) => <div key={size} style={{width: size, height: size, borderRadius: 999, border: `${18 - index * 2}px solid ${colors[index]}`, background: index === 3 ? palette.ink : alpha(palette.surface, 0.4), transform: `translateX(${(index - 1.5) * (1 - hero) * 90}px)`}} />)}</div> : null}
    {composition === 'layer-peel' ? <div style={{position: 'absolute', left: 150, right: 150, top: 120, bottom: 150, opacity: hero}}>{[0, 1, 2, 3].map((index) => <div key={index} style={{position: 'absolute', left: 100 + index * 62, top: 80 + index * 92, width: 540 - index * 85, height: 150, borderRadius: 90, border: `${16 - index * 2}px solid ${colors[index]}`, background: index === 3 ? palette.ink : alpha(palette.surface, 0.36), transform: `translate(${(1 - hero) * (index % 2 ? 100 : -100)}px, ${(1 - hero) * 55}px) rotate(${index % 2 ? 4 : -4}deg)`}} />)}</div> : null}
    {horizontal ? <div style={{position: 'absolute', left: 85, right: 85, top: 245, height: 300, opacity: hero, transform: entryTransform(motion.heroPath, hero)}}>{[1, 0.78, 0.57, 0.35].map((scale, index) => <div key={scale} style={{position: 'absolute', left: '50%', top: '50%', width: 730 * scale, height: 265 * scale, borderRadius: 190, border: `${18 - index * 2}px solid ${colors[index]}`, transform: 'translate(-50%,-50%)', background: index === 3 ? palette.ink : alpha(palette.surface, index === 0 ? 0.42 : 0.18)}} />)}{composition === 'signal-through-core' ? <div style={{position: 'absolute', left: pulseX, top: 130, width: 45, height: 45, borderRadius: 99, background: palette.highlight, boxShadow: `0 0 48px 18px ${alpha(palette.highlight, 0.65)}`, opacity: support}} /> : null}</div> : null}
    <div style={{position: 'absolute', left: 55, top: 48, color: palette.ink, fontFamily: familyFont(contract.style), fontSize: 22, fontWeight: 800, opacity: support}}>{contract.visualDirection.environment.replace(/-/g, ' ')}</div>
    <div style={{position: 'absolute', left: 55, right: 55, bottom: 42, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, opacity: support}}>{contract.visualDirection.supportingSubjects.slice(0, 3).map((label, index) => <div key={label} style={{borderTop: `4px solid ${colors[index]}`, paddingTop: 9, color: palette.ink, fontFamily: familyFont(contract.style), fontSize: 19, fontWeight: 800}}>{shorten(label, 24)}</div>)}</div>
  </div>;
};

const NetworkMapStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const route = cue(motion, 'support-1', progress);
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: palette.surface, transform: entryTransform(motion.heroPath, hero)}}>
    <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, ${alpha(palette.ink, 0.12)} 0 1px, transparent 1.5px)`, backgroundSize: '18px 18px'}} />
    <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
      <path d="M35 270 C90 120 235 110 305 210 C350 280 290 340 225 415 C145 510 60 445 45 350 Z" fill={alpha(palette.primary, 0.28)} stroke={palette.primary} strokeWidth="8" />
      <path d="M570 145 C735 65 940 150 925 320 C915 440 820 465 770 590 C720 710 575 680 545 560 C515 440 500 275 570 145 Z" fill={alpha(palette.secondary, 0.28)} stroke={palette.secondary} strokeWidth="8" />
      <path d="M150 340 C320 175 515 280 690 315 S820 425 865 525" fill="none" stroke={palette.highlight} strokeWidth="13" strokeDasharray="22 17" strokeDashoffset={920 * (1 - route)} />
      <path d="M175 510 C330 450 460 565 610 510 S805 600 900 675" fill="none" stroke={palette.primary} strokeWidth="8" strokeDasharray="14 16" strokeDashoffset={700 * (1 - route)} opacity=".7" />
      {[{x:150,y:340},{x:420,y:245},{x:690,y:315},{x:865,y:525},{x:175,y:510},{x:610,y:510},{x:900,y:675}].map((node, index) => <g key={index} opacity={phase(progress, 0.14 + index * 0.065, 0.32 + index * 0.065)}><circle cx={node.x} cy={node.y} r="20" fill={index % 2 ? palette.primary : palette.highlight} stroke={palette.ink} strokeWidth="6" /><circle cx={node.x} cy={node.y} r="38" fill="none" stroke={palette.highlight} strokeWidth="3" opacity=".45" /></g>)}
    </svg>
    <div style={{position: 'absolute', left: 55, top: 45, color: palette.ink, fontFamily: familyFont(contract.style, true), fontSize: 38, fontWeight: 900, opacity: hero}}>{shorten(contract.visualDirection.subject, 40)}</div>
    <div style={{position: 'absolute', right: 52, bottom: 35, color: palette.ink, fontFamily: familyFont(contract.style), fontSize: 20, fontWeight: 800, opacity: route}}>{contract.visualDirection.environment.replace(/-/g, ' ')}</div>
  </div>;
};

const DataEvidenceStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const p = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  const tech = /technology|network|cable|internet/.test(`${contract.visualDirection.domain} ${plan.topic}`.toLowerCase());
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `linear-gradient(180deg, ${palette.bg}, ${palette.surface})`}}>
    {tech ? <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 18}).map((_, index) => {const x = 95 + (index % 6) * 160; const y = 130 + Math.floor(index / 6) * 255 + (index % 2) * 35; return <g key={index} opacity={phase(progress, 0.08 + index * 0.025, 0.28 + index * 0.025)}><circle cx={x} cy={y} r={index % 5 === 0 ? 35 : 22} fill={index % 3 === 0 ? palette.highlight : index % 3 === 1 ? palette.primary : palette.secondary} stroke={palette.ink} strokeWidth="6" />{index < 12 ? <line x1={x} y1={y} x2={95 + ((index + 1) % 6) * 160} y2={130 + Math.floor((index + 1) / 6) * 255 + ((index + 1) % 2) * 35} stroke={palette.ink} strokeWidth="5" opacity=".42" /> : null}</g>;})}
      <path d="M90 755 C250 670 360 770 505 655 S760 565 920 610" fill="none" stroke={palette.highlight} strokeWidth="11" strokeDasharray="18 15" strokeDashoffset={760 * (1 - support)} />
    </svg> : <div style={{position: 'absolute', left: 70, right: 70, bottom: 100, top: 130, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 30}}>{[0.38,0.62,0.49,0.86,0.71,0.95].map((height,index) => <div key={index} style={{width: 72, height: 520 * height * phase(progress, 0.08 + index * 0.055, 0.42 + index * 0.055), background: [palette.primary,palette.secondary,palette.highlight][index % 3], border: `5px solid ${palette.ink}`}} />)}</div>}
    <div style={{position: 'absolute', left: 55, top: 45, color: palette.ink, fontFamily: familyFont(contract.style, true), fontSize: 39, fontWeight: 900, opacity: p}}>{shorten(contract.visualDirection.subject, 40)}</div>
    <div style={{position: 'absolute', left: 55, right: 55, bottom: 34, display: 'flex', justifyContent: 'space-between', color: palette.ink, fontFamily: familyFont(contract.style), fontSize: 19, fontWeight: 800, opacity: support}}>{contract.visualDirection.supportingSubjects.slice(0, 3).map((label) => <span key={label}>{shorten(label, 23)}</span>)}</div>
  </div>;
};

const ArchiveStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  return <div style={{height: '100%', position: 'relative', background: `linear-gradient(145deg, ${palette.bg}, ${palette.muted})`, overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: 75, top: 70, width: 520, height: 640, background: palette.surface, border: `7px solid ${palette.ink}`, padding: 40, boxShadow: `34px 38px 0 ${alpha(palette.primary, 0.3)}`, transform: `${entryTransform(motion.heroPath, hero)} rotate(${-4 + progress * 2}deg)`, opacity: hero}}><div style={{height: 28, width: '62%', background: palette.primary, marginBottom: 34}} />{Array.from({length: 9}).map((_, index) => <div key={index} style={{height: 9, width: `${94 - (index % 4) * 12}%`, background: palette.ink, opacity: 0.45, marginBottom: 20}} />)}<div style={{position: 'absolute', right: 35, bottom: 35, width: 120, height: 120, borderRadius: 99, border: `10px double ${palette.primary}`, transform: `scale(${support}) rotate(${-15 + support * 8}deg)`}} /></div>
    <div style={{position: 'absolute', right: 60, top: 205, width: 360, height: 470, background: `linear-gradient(145deg, ${palette.muted}, ${palette.bg})`, border: `8px solid ${palette.surface}`, transform: `translateY(${(1 - support) * 65}px) rotate(4deg)`, opacity: support}}><div style={{position: 'absolute', left: '30%', top: 70, width: 145, height: 170, borderRadius: '50%', background: palette.highlight}} /><div style={{position: 'absolute', left: '14%', right: '14%', bottom: 45, height: 210, borderRadius: '50% 50% 12% 12%', background: palette.primary}} /></div>
  </div>;
};

const HistoricalReconstructionStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `linear-gradient(${alpha(palette.highlight, 0.18)}, transparent 42%), linear-gradient(0deg, ${palette.bg}, ${alpha(palette.secondary, 0.55)})`}}>
    <div style={{position: 'absolute', left: -60, right: -60, bottom: 80, height: 285, background: `linear-gradient(160deg, transparent 0 15%, ${palette.secondary} 16% 46%, transparent 47%), linear-gradient(205deg, transparent 0 25%, ${palette.primary} 26% 61%, transparent 62%)`, opacity: 0.78, transform: `translateX(${Math.sin(progress * Math.PI) * -18}px)`}} />
    <div style={{position: 'absolute', left: 95, right: 75, bottom: 180, height: 260, display: 'flex', alignItems: 'flex-end', gap: 12, opacity: hero, transform: entryTransform(motion.heroPath, hero)}}>{[210,145,265,178,230].map((height,index) => <div key={index} style={{width: index === 2 ? 180 : 120, height, background: index % 2 ? palette.surface : palette.muted, border: `6px solid ${palette.ink}`, clipPath: index === 2 ? 'polygon(0 25%,30% 25%,50% 0,70% 25%,100% 25%,100% 100%,0 100%)' : 'polygon(0 18%,50% 0,100% 18%,100% 100%,0 100%)'}} />)}</div>
    <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: support}}><path d="M70 730 C235 650 350 760 520 670 S760 585 945 630" fill="none" stroke={palette.highlight} strokeWidth="12" strokeDasharray="20 18" strokeDashoffset={850 * (1 - support)} /></svg>
    {Array.from({length: 7}).map((_,index) => <div key={index} style={{position: 'absolute', left: -50 + progress * 510 + index * 78, bottom: 112 + (index % 2) * 8, width: 34, height: 72, borderRadius: '50% 50% 20% 20%', background: palette.ink, opacity: support}} />)}
  </div>;
};

const MacroStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  const text = `${scene.title} ${scene.voiceLine}`.toLowerCase(); const survivor = /surviv|resistan|mutation|selection/.test(text); const transfer = /plasmid|transfer|gene exchange/.test(text);
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `radial-gradient(circle at 50% 48%, ${palette.surface}, ${palette.bg} 72%)`}}>
    {Array.from({length: 18}).map((_,index) => {const angle = index / 18 * Math.PI * 2; const radius = 125 + (index % 5) * 55 + support * (survivor ? 80 : 12); const x = 500 + Math.cos(angle + progress * 0.7) * radius; const y = 430 + Math.sin(angle + progress * 0.55) * radius * 0.7; const resistant = index % 6 === 0; const fade = survivor && !resistant ? 1 - phase(progress, 0.38, 0.72) : 1; return <div key={index} style={{position: 'absolute', left: x, top: y, width: resistant ? 82 : 58, height: resistant ? 58 : 42, borderRadius: '48% 52% 44% 56%', background: resistant ? palette.highlight : palette.primary, border: `5px solid ${palette.ink}`, opacity: hero * fade, transform: `translate(-50%,-50%) rotate(${index * 23 + progress * 35}deg) scale(${0.72 + hero * 0.28})`, boxShadow: resistant ? `0 0 35px ${palette.highlight}` : 'none'}} />;})}
    {transfer ? <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity: support}}><path d="M315 430 C425 275 570 600 690 425" fill="none" stroke={palette.secondary} strokeWidth="10" strokeDasharray="15 12" strokeDashoffset={420 * (1 - support)} /><circle cx="315" cy="430" r="58" fill="none" stroke={palette.highlight} strokeWidth="9" /><circle cx="690" cy="425" r="58" fill="none" stroke={palette.highlight} strokeWidth="9" /></svg> : null}
    <div style={{position: 'absolute', left: 55, right: 55, bottom: 38, display: 'flex', justifyContent: 'space-between', color: palette.ink, fontFamily: familyFont(contract.style), fontSize: 20, fontWeight: 800, opacity: support}}>{contract.visualDirection.supportingSubjects.slice(0,3).map((label) => <span key={label}>{shorten(label,23)}</span>)}</div>
  </div>;
};

const NatureStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `linear-gradient(${alpha(palette.secondary, 0.58)}, ${palette.bg})`}}>
    <div style={{position: 'absolute', left: -80, right: -80, bottom: 110, height: 350, background: `linear-gradient(160deg, transparent 0 14%, ${palette.secondary} 15% 45%, transparent 46%), linear-gradient(205deg, transparent 0 24%, ${palette.primary} 25% 62%, transparent 63%)`, transform: `translateX(${-progress * 18}px)`}} />
    {Array.from({length: 9}).map((_,index) => <div key={index} style={{position: 'absolute', left: 45 + index * 108 - progress * (index % 2 ? 12 : 5), bottom: 85 + (index % 3) * 18, width: 42 + (index % 3) * 10, height: 175 + (index % 4) * 34, background: palette.ink, clipPath: 'polygon(42% 0,58% 0,61% 42%,100% 70%,64% 67%,70% 100%,30% 100%,36% 67%,0 70%,39% 42%)', opacity: 0.26 + support * 0.65}} />)}
    <div style={{position: 'absolute', left: 365, top: 215, width: 270, height: 205, borderRadius: '52% 48% 44% 56%', background: palette.highlight, border: `10px solid ${palette.ink}`, transform: `${entryTransform(motion.heroPath, hero)} rotate(${Math.sin(progress * Math.PI * 2) * 4}deg)`, opacity: hero}} />
  </div>;
};

const CosmicStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette;
  const hero = cue(motion, 'hero', progress); const support = cue(motion, 'support-1', progress);
  return <div style={{height: '100%', position: 'relative', overflow: 'hidden', background: `radial-gradient(circle at 52% 48%, ${alpha(palette.primary,0.38)}, ${palette.bg} 48%, #000 100%)`}}>
    {Array.from({length: 55}).map((_,index) => {const n = hash(`${scene.id}-star-${index}`); return <div key={index} style={{position: 'absolute', left: `${n % 100}%`, top: `${(n * 17) % 100}%`, width: index % 9 === 0 ? 5 : 2, height: index % 9 === 0 ? 5 : 2, borderRadius: 99, background: palette.surface, opacity: 0.25 + (index % 5) * 0.13}} />;})}
    <div style={{position: 'absolute', left: 315, top: 225, width: 370, height: 370, borderRadius: 999, background: '#000', boxShadow: `0 0 0 25px ${alpha(palette.highlight,0.55)}, 0 0 90px 42px ${alpha(palette.primary,0.5)}`, transform: `${entryTransform(motion.heroPath,hero)} rotate(${progress * 18}deg)`, opacity: hero}} />
    <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position:'absolute',inset:0,opacity:support}}><ellipse cx="500" cy="410" rx="360" ry="130" fill="none" stroke={palette.highlight} strokeWidth="10" transform={`rotate(${progress * 16} 500 410)`} /><ellipse cx="500" cy="410" rx="280" ry="90" fill="none" stroke={palette.secondary} strokeWidth="6" transform={`rotate(${-progress * 20} 500 410)`} /></svg>
  </div>;
};

const AssetStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const contract = scene.visualContract!; const motion = scene.motionContract!; const palette = contract.style.palette; const hero = cue(motion,'hero',progress);
  return <div style={{height:'100%',position:'relative',overflow:'hidden',background:palette.bg}}><Img src={staticFile(scene.asset || '')} style={{width:'100%',height:'100%',objectFit:'cover',transform:`${entryTransform(motion.heroPath,hero)} scale(${1.04 + progress * 0.06})`,filter:`contrast(1.12) saturate(.9) brightness(${0.84 + hero * 0.16})`}} /><AbsoluteFill style={{background:`linear-gradient(0deg, ${alpha(palette.bg,0.9)}, transparent 58%), linear-gradient(120deg, ${alpha(palette.primary,0.2)}, transparent 46%)`}} /></div>;
};

const DirectedStage: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const direction = scene.visualContract!.visualDirection; const mode = direction.sceneMode;
  if (scene.asset && direction.renderStrategy === 'asset-first') return <AssetStage scene={scene} progress={progress} />;
  if (/archival-evidence|portrait-focus/.test(mode)) return <ArchiveStage scene={scene} progress={progress} />;
  if (/historical-reconstruction|forensic-reconstruction|institutional-reconstruction/.test(mode)) return <HistoricalReconstructionStage scene={scene} progress={progress} />;
  if (/cartographic|system-map|ecological-map/.test(mode)) return <NetworkMapStage scene={scene} progress={progress} />;
  if (/scientific-macro|comparison-lab|behavior-closeup/.test(mode)) return <MacroStage scene={scene} progress={progress} />;
  if (/technical-cutaway|process-cutaway|orbital-diagram/.test(mode)) return <CutawayStage scene={scene} progress={progress} />;
  if (/realistic-object/.test(mode)) return <PhysicalTechnologyStage scene={scene} progress={progress} />;
  if (/environmental-realism/.test(mode)) return <NatureStage scene={scene} progress={progress} />;
  if (/cosmic-reconstruction|scale-comparison/.test(mode)) return <CosmicStage scene={scene} progress={progress} />;
  if (/data-evidence/.test(mode)) return <DataEvidenceStage scene={scene} progress={progress} />;
  return <GenericPhysicalObject scene={scene} progress={progress} />;
};

const transitionStyle = (transition: string, progress: number): React.CSSProperties => {
  const enter = phase(progress, 0, 0.12);
  if (/paper|desk|ink/.test(transition)) return {clipPath: `inset(0 ${100 - enter * 100}% 0 0)`, filter: `contrast(${0.82 + enter * 0.18})`};
  if (/crack/.test(transition)) return {clipPath: `polygon(0 0, ${48 + enter * 2}% 0, ${54 - enter * 2}% 100%, 0 100%, 0 0, 100% 0, 100% 100%, ${46 + enter * 2}% 100%, ${52 - enter * 2}% 0)`, opacity: enter};
  if (/zoom/.test(transition)) return {transform: `scale(${1.22 - enter * 0.22})`, opacity: enter};
  if (/morph|dissolve/.test(transition)) return {filter: `blur(${(1 - enter) * 22}px)`, opacity: enter};
  if (/wipe|signal-carry|route-carry/.test(transition)) return {clipPath: `inset(0 ${100 - enter * 100}% 0 0)`, opacity: enter};
  return {opacity: enter};
};

const TransitionEffect: React.FC<{scene: V8Scene; progress: number}> = ({scene, progress}) => {
  const motion = scene.motionContract!; const palette = scene.visualContract!.style.palette; const enter = phase(progress,0,0.12);
  if (/signal-carry|route-carry|light-wipe/.test(motion.transitionIn)) return <div style={{position:'absolute',left:`${enter * 112 - 12}%`,top:0,bottom:0,width:22,background:palette.highlight,boxShadow:`0 0 42px 14px ${alpha(palette.highlight,0.48)}`,opacity:1 - enter * .55}} />;
  if (/crack/.test(motion.transitionIn)) return <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{position:'absolute',inset:0,opacity:1-enter}}><path d="M550 -20 L500 320 L575 610 L505 930 L590 1280 L520 1600 L560 1940" fill="none" stroke={palette.highlight} strokeWidth="15" /></svg>;
  return null;
};

const Scene: React.FC<{scene: V8Scene}> = ({scene}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig(); const contract = scene.visualContract; const motion = scene.motionContract;
  if (!contract || contract.version !== 8 || !motion || motion.version !== 8) return null;
  const frames = Math.max(1, Math.round(scene.duration * fps)); const progress = clamp(frame / Math.max(1, frames - 1));
  const exit = 1 - phase(progress, motion.phaseTiming.exitStart, 1); const labels = cue(motion,'labels',progress,[0.08,0.36]); const stage = cue(motion,'environment',progress,[0.02,0.28]); const palette = contract.style.palette;
  const titleSize = scene.title.length > 44 ? 43 : scene.title.length > 30 ? 49 : 57;
  return <AbsoluteFill style={{background:palette.bg,color:palette.ink,overflow:'hidden',...transitionStyle(motion.transitionIn,progress),opacity:exit}}>
    <div style={{position:'absolute',inset:-32,transform:camera(motion.cameraMove,progress)}}><Texture scene={scene} progress={progress} /></div>
    <div style={{position:'absolute',left:48,right:48,top:38,display:'flex',alignItems:'center',gap:15,opacity:labels,transform:`translateY(${(1-labels)*-18}px)`}}><b style={{fontFamily:familyFont(contract.style),fontSize:18,letterSpacing:2,color:palette.highlight,border:`2px solid ${palette.primary}`,padding:'7px 10px',background:alpha(palette.bg,.78)}}>{String(scene.id).padStart(2,'0')}</b><span style={{height:3,flex:1,background:`linear-gradient(90deg,${palette.primary},transparent)`}} /><span style={{fontFamily:familyFont(contract.style),fontSize:15,letterSpacing:1.4,color:palette.muted,textTransform:'uppercase'}}>{contract.visualDirection.sceneMode.replace(/-/g,' ')}</span></div>
    <div style={{position:'absolute',left:52,right:52,top:96,fontFamily:familyFont(contract.style,true),fontSize:titleSize,fontWeight:900,lineHeight:.98,letterSpacing:-1.1,textTransform:/history|archive|data/.test(contract.visualDirection.domain)?'uppercase':'none',opacity:labels,transform:`translateX(${(1-labels)*-38}px)`,textShadow:`0 10px 28px ${palette.bg}`}}>{shorten(scene.title,58)}</div>
    <div style={{position:'absolute',left:54,right:54,top:230,fontFamily:familyFont(contract.style),fontSize:19,fontWeight:800,color:palette.primary,opacity:labels}}>{shorten(scene.kicker || contract.visualDirection.environment.replace(/-/g,' '),72)}</div>
    <div style={{position:'absolute',left:28,right:28,top:292,bottom:205,opacity:stage,transform:`translateY(${(1-stage)*24}px)`,border:`2px solid ${alpha(palette.primary,.32)}`,boxShadow:`0 26px 58px ${alpha(palette.bg,.7)}`,overflow:'hidden'}}><DirectedStage scene={scene} progress={progress} /></div>
    <div style={{position:'absolute',left:52,right:52,bottom:45,borderTop:`2px solid ${alpha(palette.primary,.58)}`,paddingTop:13,fontFamily:familyFont(contract.style),fontSize:26,lineHeight:1.1,fontWeight:700,color:palette.ink,opacity:labels,textShadow:`0 7px 18px ${palette.bg}`,maxHeight:112,overflow:'hidden'}}>{scene.voiceLine}</div>
    <TransitionEffect scene={scene} progress={progress} />
  </AbsoluteFill>;
};

export const DirectedAutoShortV8: React.FC = () => <AbsoluteFill style={{background:'#050608'}}>
  <Audio src={staticFile('auto-factory/audio/final.wav')} />
  {plan.scenes.map((scene) => <Sequence key={scene.id} from={Math.round(scene.start * plan.fps)} durationInFrames={Math.max(1,Math.round(scene.duration * plan.fps))} premountFor={20}><Scene scene={scene} /></Sequence>)}
</AbsoluteFill>;
