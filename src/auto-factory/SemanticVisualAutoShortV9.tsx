import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';

type Palette = {
  bg: string;
  paper: string;
  ink: string;
  primary: string;
  secondary: string;
  highlight: string;
  muted: string;
};

type V9Asset = string | {src?: string; semanticV9?: boolean; provider?: string; model?: string};
type V9Blueprint = {
  sceneFamily: string;
  visualStatement?: string;
  worldEntities?: string[];
  spatialRelations?: string[];
  layerPlan?: {foreground?: string[]; midground?: string[]; background?: string[]};
  motionIntent?: {camera?: string; grammar?: string; heroAction?: string; transitionLogic?: string};
  assetPlan?: {prompt?: string; fallbackRenderer?: string; aiImageRecommended?: boolean};
  semanticSpecificityScore?: number;
};
type Scene = {
  id: number;
  start: number;
  duration: number;
  title: string;
  kicker?: string;
  voiceLine?: string;
  heroVisual?: string;
  mustShow?: string[];
  asset?: V9Asset;
  v9Blueprint?: V9Blueprint;
  visualContract?: {
    style?: {palette?: Partial<Palette>};
    visualDirection?: {domain?: string; environment?: string; subject?: string; supportingSubjects?: string[]};
  };
};
type Plan = {
  fps: number;
  duration: number;
  topic: string;
  category?: string;
  palette?: {paper?: string; ink?: string; red?: string; teal?: string; gold?: string; blue?: string};
  scenes: Scene[];
};

const plan = planJson as unknown as Plan;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const v = clamp(value);
  return v * v * (3 - 2 * v);
};
const phase = (progress: number, start: number, end: number) => smooth((progress - start) / Math.max(0.001, end - start));
const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value: unknown) => clean(value).toLowerCase();
const short = (value: unknown, max = 48) => {
  const text = clean(value);
  if (text.length <= max) return text;
  const words = text.split(' ');
  let output = '';
  for (const word of words) {
    const next = `${output} ${word}`.trim();
    if (next.length > max) break;
    output = next;
  }
  return output || text.slice(0, max);
};
const hash = (value: unknown) => [...clean(value)].reduce((state, char) => (Math.imul(state, 31) + char.charCodeAt(0)) >>> 0, 17);
const alpha = (hex: string, opacity: number) => `${hex}${Math.round(clamp(opacity) * 255).toString(16).padStart(2, '0')}`;
const assetSource = (asset?: V9Asset) => typeof asset === 'string' ? asset : clean(asset?.src);
const sceneText = (scene: Scene) => lower([
  plan.topic,
  scene.title,
  scene.kicker,
  scene.voiceLine,
  scene.heroVisual,
  ...(scene.mustShow ?? []),
  ...(scene.v9Blueprint?.worldEntities ?? []),
].join(' '));

const paletteFor = (scene: Scene): Palette => {
  const base = plan.palette ?? {};
  const style = scene.visualContract?.style?.palette ?? {};
  return {
    bg: style.bg ?? '#080a0d',
    paper: style.paper ?? base.paper ?? '#e8dcc2',
    ink: style.ink ?? base.ink ?? '#15181c',
    primary: style.primary ?? base.red ?? '#c54b3f',
    secondary: style.secondary ?? base.teal ?? '#1f7f82',
    highlight: style.highlight ?? base.gold ?? '#e7bd58',
    muted: style.muted ?? base.blue ?? '#43576d',
  };
};

const Grain: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at 48% 35%, ${alpha(palette.highlight, 0.12)}, transparent 42%), linear-gradient(145deg, ${alpha(palette.primary, 0.08)}, transparent 48%, ${alpha(palette.secondary, 0.09)})`}} />
    <AbsoluteFill style={{opacity: 0.22, backgroundImage: `radial-gradient(circle, ${alpha(palette.paper, 0.14)} 0 1px, transparent 1.4px), repeating-linear-gradient(108deg, transparent 0 11px, ${alpha(palette.ink, 0.04)} 12px 13px)`, backgroundSize: '14px 14px', transform: `translate(${Math.sin(progress * Math.PI * 2) * 3}px, ${Math.cos(progress * Math.PI * 1.6) * 3}px)`}} />
    <AbsoluteFill style={{boxShadow: 'inset 0 0 170px rgba(0,0,0,.62)'}} />
  </AbsoluteFill>
);

const EntityLabels: React.FC<{scene: Scene; palette: Palette; progress: number}> = ({scene, palette, progress}) => {
  const labels = (scene.v9Blueprint?.worldEntities ?? []).map((item) => short(item, 28)).filter(Boolean).slice(0, 4);
  return (
    <div style={{position: 'absolute', left: 34, right: 34, bottom: 28, display: 'flex', flexWrap: 'wrap', gap: 10, opacity: phase(progress, 0.2, 0.5)}}>
      {labels.map((label, index) => (
        <span key={`${label}-${index}`} style={{padding: '8px 12px', background: alpha(palette.bg, 0.76), border: `2px solid ${index % 2 ? palette.secondary : palette.highlight}`, color: palette.paper, fontFamily: 'Arial, sans-serif', fontSize: 17, fontWeight: 800}}>{label}</span>
      ))}
    </div>
  );
};

const StageShell: React.FC<{scene: Scene; progress: number; children: React.ReactNode; background?: string}> = ({scene, progress, children, background}) => {
  const palette = paletteFor(scene);
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: background ?? `linear-gradient(180deg, ${palette.bg}, ${alpha(palette.muted, 0.76)})`}}>
      {children}
      <EntityLabels scene={scene} palette={palette} progress={progress} />
      <Grain palette={palette} progress={progress} />
    </AbsoluteFill>
  );
};

const MountainRange: React.FC<{palette: Palette; y: number; opacity?: number}> = ({palette, y, opacity = 1}) => (
  <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity}}>
    <path d={`M-40 ${y} L110 ${y - 160} L205 ${y - 55} L350 ${y - 235} L470 ${y - 70} L610 ${y - 185} L735 ${y - 45} L880 ${y - 205} L1040 ${y} Z`} fill={palette.muted} stroke={alpha(palette.paper, 0.38)} strokeWidth="5" />
    <path d={`M70 ${y - 105} L110 ${y - 160} L145 ${y - 105} M315 ${y - 180} L350 ${y - 235} L390 ${y - 176} M840 ${y - 155} L880 ${y - 205} L920 ${y - 145}`} fill="none" stroke={palette.paper} strokeWidth="10" opacity=".72" />
  </svg>
);

const SilkRoadPreset = (scene: Scene) => /silk road|china.+europe|europe.+china/.test(sceneText(scene));
const routeLabels = (scene: Scene) => {
  if (SilkRoadPreset(scene)) return ['CHINA', 'CENTRAL ASIA', 'SAMARKAND', 'PERSIA', 'EUROPE'];
  const candidates = (scene.v9Blueprint?.worldEntities ?? [])
    .map((item) => short(item, 20).toUpperCase())
    .filter((item) => item.length >= 2 && item.length <= 20);
  return [...new Set(candidates)].slice(0, 5).concat(['ORIGIN', 'HUB', 'DESTINATION']).slice(0, 5);
};

const GeographicRouteStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const reveal = phase(progress, 0.08, 0.72);
  const labels = routeLabels(scene);
  const points = [{x: 865, y: 585}, {x: 700, y: 470}, {x: 520, y: 435}, {x: 350, y: 380}, {x: 145, y: 335}];
  const directionPoints = SilkRoadPreset(scene) ? points : (hash(scene.title) % 2 ? [...points].reverse() : points);
  const mover = directionPoints[Math.min(directionPoints.length - 1, Math.floor(reveal * directionPoints.length))];
  return (
    <StageShell scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.paper}, ${alpha(palette.highlight, 0.34)})`}>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M35 210 C120 80 270 80 365 150 C455 215 470 300 565 300 C680 300 725 195 830 170 C910 150 985 225 970 330 C950 445 835 500 730 510 C600 525 545 650 420 660 C300 670 190 600 120 520 C55 445 5 330 35 210 Z" fill={alpha(palette.secondary, 0.24)} stroke={palette.ink} strokeWidth="8" />
        <path d="M75 550 C210 500 300 570 425 520 C545 470 650 540 775 500 C860 470 920 495 970 540" fill="none" stroke={alpha(palette.muted, 0.72)} strokeWidth="44" />
        <path d="M900 610 C720 500 620 500 520 435 S330 350 130 320" fill="none" stroke={alpha(palette.ink, 0.28)} strokeWidth="30" strokeLinecap="round" />
        <path d="M900 610 C720 500 620 500 520 435 S330 350 130 320" fill="none" stroke={palette.primary} strokeWidth="12" strokeLinecap="round" strokeDasharray="18 14" strokeDashoffset={950 * (1 - reveal)} />
        <path d="M900 610 C720 500 620 500 520 435 S330 350 130 320" fill="none" stroke={palette.highlight} strokeWidth="4" strokeDasharray="5 20" strokeDashoffset={620 * (1 - reveal)} />
        {directionPoints.map((point, index) => (
          <g key={index} opacity={phase(progress, 0.12 + index * 0.08, 0.34 + index * 0.08)}>
            <circle cx={point.x} cy={point.y} r={index === 0 || index === directionPoints.length - 1 ? 24 : 16} fill={index % 2 ? palette.secondary : palette.highlight} stroke={palette.ink} strokeWidth="7" />
            <circle cx={point.x} cy={point.y} r={index === 0 || index === directionPoints.length - 1 ? 42 : 31} fill="none" stroke={palette.primary} strokeWidth="3" opacity=".55" />
            <text x={point.x} y={point.y - 52} textAnchor="middle" fill={palette.ink} fontFamily="Arial Black, Arial" fontSize="20">{labels[index] ?? `HUB ${index + 1}`}</text>
          </g>
        ))}
        <g transform={`translate(${mover.x} ${mover.y})`} opacity={reveal}>
          <path d="M-28 5 L18 -17 L39 0 L18 17 Z" fill={palette.primary} stroke={palette.ink} strokeWidth="6" />
          <path d="M38 0 L62 -12 L62 12 Z" fill={palette.highlight} stroke={palette.ink} strokeWidth="5" />
        </g>
      </svg>
      <MountainRange palette={palette} y={790} opacity={0.58} />
      <div style={{position: 'absolute', left: 55, top: 55, color: palette.ink, fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 32, maxWidth: 720}}>ORIGIN → INTERMEDIARY HUBS → DESTINATION</div>
    </StageShell>
  );
};

const Camel: React.FC<{palette: Palette; x: number; y: number; scale: number; progress: number; delay: number}> = ({palette, x, y, scale, progress, delay}) => {
  const p = phase(progress, delay, delay + 0.28);
  return (
    <svg width={220 * scale} height={150 * scale} viewBox="0 0 220 150" style={{position: 'absolute', left: x + progress * 55, top: y + Math.sin((progress + delay) * Math.PI * 4) * 3, opacity: p}}>
      <path d="M35 78 C50 45 70 47 82 70 C93 35 121 35 135 69 C157 67 173 78 180 95 L150 105 L55 104 Z" fill={palette.highlight} stroke={palette.ink} strokeWidth="7" />
      <path d="M151 78 C170 48 186 38 196 46 C205 54 199 72 183 88" fill="none" stroke={palette.ink} strokeWidth="13" strokeLinecap="round" />
      <circle cx="198" cy="45" r="10" fill={palette.highlight} stroke={palette.ink} strokeWidth="5" />
      <path d="M66 101 L59 143 M96 101 L91 143 M135 101 L140 143 M161 98 L173 139" stroke={palette.ink} strokeWidth="9" strokeLinecap="round" />
      <rect x="88" y="61" width="45" height="28" rx="5" fill={palette.primary} stroke={palette.ink} strokeWidth="5" />
    </svg>
  );
};

const Person: React.FC<{palette: Palette; x: number; y: number; scale?: number; progress: number; accent?: string}> = ({palette, x, y, scale = 1, progress, accent}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 74 * scale, height: 175 * scale, transform: `translateY(${(1 - phase(progress, 0.1, 0.42)) * 55}px)`, opacity: phase(progress, 0.1, 0.42)}}>
    <div style={{position: 'absolute', left: 16 * scale, top: 0, width: 42 * scale, height: 42 * scale, borderRadius: '50%', background: palette.highlight, border: `${5 * scale}px solid ${palette.ink}`}} />
    <div style={{position: 'absolute', left: 5 * scale, top: 42 * scale, width: 64 * scale, height: 92 * scale, borderRadius: `${26 * scale}px ${26 * scale}px ${10 * scale}px ${10 * scale}px`, background: accent ?? palette.primary, border: `${6 * scale}px solid ${palette.ink}`}} />
    <div style={{position: 'absolute', left: 15 * scale, top: 128 * scale, width: 12 * scale, height: 48 * scale, background: palette.ink, transform: 'rotate(6deg)'}} />
    <div style={{position: 'absolute', right: 15 * scale, top: 128 * scale, width: 12 * scale, height: 48 * scale, background: palette.ink, transform: 'rotate(-6deg)'}} />
  </div>
);

const HumanReconstructionStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const text = sceneText(scene);
  const caravan = /silk road|caravan|merchant|camel|desert|trade route/.test(text);
  const lab = /scientist|laboratory|research|antibiotic|cell|microscope/.test(text);
  if (caravan) {
    return (
      <StageShell scene={scene} progress={progress} background={`linear-gradient(180deg, ${alpha(palette.highlight, 0.75)}, ${palette.paper} 44%, ${alpha(palette.primary, 0.58)})`}>
        <MountainRange palette={palette} y={520} opacity={0.55} />
        <div style={{position: 'absolute', left: -80, right: -80, bottom: 0, height: 330, borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${alpha(palette.highlight, 0.85)}, ${palette.primary})`, transform: `translateX(${Math.sin(progress * Math.PI) * -20}px)`}} />
        <div style={{position: 'absolute', right: 90, top: 155, width: 240, height: 270, background: palette.paper, border: `8px solid ${palette.ink}`, clipPath: 'polygon(0 22%,18% 22%,24% 0,76% 0,82% 22%,100% 22%,100% 100%,0 100%)'}}>
          <div style={{position: 'absolute', left: 75, top: 105, width: 90, height: 165, borderRadius: '48px 48px 0 0', background: palette.bg}} />
        </div>
        <Camel palette={palette} x={20} y={500} scale={0.85} progress={progress} delay={0.05} />
        <Camel palette={palette} x={220} y={475} scale={1.0} progress={progress} delay={0.14} />
        <Camel palette={palette} x={465} y={505} scale={0.8} progress={progress} delay={0.23} />
        <Person palette={palette} x={705} y={500} scale={0.72} progress={progress} accent={palette.secondary} />
      </StageShell>
    );
  }
  return (
    <StageShell scene={scene} progress={progress}>
      <div style={{position: 'absolute', left: 80, right: 80, top: 110, bottom: 95, border: `8px solid ${palette.ink}`, background: lab ? alpha(palette.paper, 0.72) : alpha(palette.muted, 0.65)}}>
        {lab ? (
          <>
            <div style={{position: 'absolute', left: 90, top: 80, width: 330, height: 280, border: `7px solid ${palette.ink}`, background: palette.bg}}>
              <div style={{position: 'absolute', left: 50, top: 65, width: 215, height: 15, background: palette.highlight, transform: 'rotate(-30deg)', transformOrigin: 'left'}} />
              <div style={{position: 'absolute', left: 190, top: 120, width: 56, height: 130, borderRadius: '30px 30px 12px 12px', background: palette.secondary, border: `6px solid ${palette.ink}`}} />
            </div>
            <div style={{position: 'absolute', right: 90, top: 95, width: 245, height: 230, borderRadius: '50%', background: `radial-gradient(circle, ${palette.primary}, ${palette.bg})`, border: `8px solid ${palette.ink}`}} />
          </>
        ) : null}
        <Person palette={palette} x={445} y={355} scale={1.25} progress={progress} accent={palette.primary} />
        <Person palette={palette} x={610} y={385} scale={1.05} progress={progress} accent={palette.secondary} />
      </div>
    </StageShell>
  );
};

const MarketExchangeStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const handoff = phase(progress, 0.2, 0.72);
  return (
    <StageShell scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.paper}, ${alpha(palette.highlight, 0.45)})`}>
      {[80, 355, 630].map((left, index) => (
        <div key={left} style={{position: 'absolute', left, top: 145 + (index % 2) * 28, width: 245, height: 390, background: index % 2 ? palette.secondary : palette.primary, border: `8px solid ${palette.ink}`, clipPath: 'polygon(0 18%,12% 0,88% 0,100% 18%,100% 100%,0 100%)'}}>
          <div style={{position: 'absolute', left: 22, right: 22, top: 85, height: 16, background: palette.paper}} />
          <div style={{position: 'absolute', left: 24, right: 24, bottom: 28, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8}}>
            {Array.from({length: 6}).map((_, item) => <div key={item} style={{height: 42, borderRadius: 8, background: [palette.highlight, palette.paper, palette.muted][item % 3], border: `3px solid ${palette.ink}`}} />)}
          </div>
        </div>
      ))}
      <Person palette={palette} x={190} y={520} scale={0.9} progress={progress} accent={palette.secondary} />
      <Person palette={palette} x={700} y={520} scale={0.9} progress={progress} accent={palette.primary} />
      <div style={{position: 'absolute', left: 310 + handoff * 270, top: 610, width: 88, height: 64, background: palette.highlight, border: `7px solid ${palette.ink}`, transform: `rotate(${(handoff - 0.5) * 10}deg)`, boxShadow: `0 0 32px ${alpha(palette.highlight, 0.65)}`}} />
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}><path d="M355 642 C470 590 565 690 675 635" fill="none" stroke={palette.ink} strokeWidth="7" strokeDasharray="14 12" strokeDashoffset={450 * (1 - handoff)} /></svg>
    </StageShell>
  );
};

const IndustrialProcessStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const flow = phase(progress, 0.12, 0.86);
  const text = sceneText(scene);
  const chip = /chip|semiconductor|wafer|fab|lithograph/.test(text);
  return (
    <StageShell scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.bg}, ${palette.muted})`}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${alpha(palette.paper, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(palette.paper, 0.08)} 1px, transparent 1px)`, backgroundSize: '52px 52px'}} />
      {[65, 365, 665].map((left, index) => (
        <div key={left} style={{position: 'absolute', left, top: 145 + index * 30, width: 260, height: 360, borderRadius: 24, background: alpha(palette.paper, 0.86), border: `9px solid ${palette.ink}`, boxShadow: `18px 22px 0 ${alpha(palette.primary, 0.28)}`, transform: `translateY(${(1 - phase(progress, 0.06 + index * 0.08, 0.36 + index * 0.08)) * 65}px)`, opacity: phase(progress, 0.06 + index * 0.08, 0.36 + index * 0.08)}}>
          <div style={{position: 'absolute', left: 28, right: 28, top: 38, height: 95, background: palette.bg, border: `6px solid ${palette.ink}`}} />
          <div style={{position: 'absolute', left: 45, right: 45, top: 175, height: 22, background: index % 2 ? palette.secondary : palette.primary}} />
          {chip ? <div style={{position: 'absolute', left: 76, top: 230, width: 105, height: 105, borderRadius: '50%', background: `conic-gradient(${palette.highlight}, ${palette.secondary}, ${palette.primary}, ${palette.highlight})`, border: `7px solid ${palette.ink}`}} /> : <div style={{position: 'absolute', left: 58, right: 58, bottom: 42, height: 70, borderRadius: 12, background: palette.highlight, border: `6px solid ${palette.ink}`}} />}
        </div>
      ))}
      <div style={{position: 'absolute', left: 40, right: 40, bottom: 190, height: 90, background: palette.ink, borderRadius: 22}}>
        {Array.from({length: 8}).map((_, index) => <div key={index} style={{position: 'absolute', left: 25 + index * 115 + flow * 55, top: 17, width: 64, height: 56, borderRadius: chip ? '50%' : 8, background: [palette.primary, palette.highlight, palette.secondary][index % 3], border: `5px solid ${palette.paper}`}} />)}
      </div>
      <Person palette={palette} x={775} y={520} scale={0.9} progress={progress} accent={palette.secondary} />
    </StageShell>
  );
};

const MechanismCutawayStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const open = phase(progress, 0.08, 0.56);
  const pulse = phase(progress, 0.42, 0.9);
  return (
    <StageShell scene={scene} progress={progress}>
      <AbsoluteFill style={{backgroundImage: `linear-gradient(${alpha(palette.paper, 0.08)} 1px, transparent 1px), linear-gradient(90deg, ${alpha(palette.paper, 0.08)} 1px, transparent 1px)`, backgroundSize: '40px 40px'}} />
      <div style={{position: 'absolute', left: 105, right: 105, top: 180, height: 410}}>
        {[0, 1, 2, 3].map((index) => {
          const width = 720 - index * 120;
          const height = 330 - index * 55;
          return <div key={index} style={{position: 'absolute', left: '50%', top: '50%', width, height, borderRadius: 190, transform: `translate(-50%,-50%) translateX(${(index - 1.5) * (1 - open) * 150}px)`, border: `${18 - index * 2}px solid ${[palette.ink, palette.primary, palette.secondary, palette.highlight][index]}`, background: index === 3 ? palette.paper : alpha(palette.bg, 0.35), opacity: open}} />;
        })}
        <div style={{position: 'absolute', left: 90 + pulse * 540, top: 185, width: 42, height: 42, borderRadius: '50%', background: palette.highlight, boxShadow: `0 0 48px 20px ${alpha(palette.highlight, 0.72)}`}} />
      </div>
      <div style={{position: 'absolute', left: 130, right: 130, top: 635, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 15}}>
        {['OUTER SHELL', 'STRUCTURE', 'ACTIVE LAYER', 'CORE'].map((label, index) => <div key={label} style={{paddingTop: 11, borderTop: `5px solid ${[palette.ink, palette.primary, palette.secondary, palette.highlight][index]}`, color: palette.paper, fontFamily: 'Arial, sans-serif', fontWeight: 900, fontSize: 17}}>{label}</div>)}
      </div>
    </StageShell>
  );
};

const MicroscopicProcessStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const text = sceneText(scene);
  const resistance = /antibiotic|resistan|surviv|mutation|bacter/.test(text);
  const attack = phase(progress, 0.18, 0.7);
  return (
    <StageShell scene={scene} progress={progress} background={`radial-gradient(circle at 50% 45%, ${alpha(palette.paper, 0.72)}, ${palette.bg} 72%)`}>
      {Array.from({length: 22}).map((_, index) => {
        const angle = index / 22 * Math.PI * 2 + progress * 0.5;
        const radius = 105 + (index % 6) * 58;
        const x = 500 + Math.cos(angle) * radius;
        const y = 410 + Math.sin(angle) * radius * 0.72;
        const survivor = resistance && index % 7 === 0;
        const fade = resistance && !survivor ? 1 - phase(progress, 0.4, 0.78) * 0.82 : 1;
        return <div key={index} style={{position: 'absolute', left: x, top: y, width: survivor ? 92 : 62, height: survivor ? 58 : 40, borderRadius: '48% 52% 42% 58%', background: survivor ? palette.highlight : palette.primary, border: `5px solid ${palette.ink}`, transform: `translate(-50%,-50%) rotate(${index * 29 + progress * 35}deg)`, opacity: phase(progress, 0.05 + index * 0.012, 0.32 + index * 0.012) * fade, boxShadow: survivor ? `0 0 35px ${palette.highlight}` : 'none'}} />;
      })}
      {resistance ? (
        <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
          {Array.from({length: 8}).map((_, index) => <path key={index} d={`M${80 + index * 115} 40 L${180 + index * 85} ${250 + (index % 3) * 95}`} stroke={palette.secondary} strokeWidth="12" strokeLinecap="round" opacity={attack * 0.76} />)}
          <path d="M290 640 C390 540 580 750 720 570" fill="none" stroke={palette.highlight} strokeWidth="10" strokeDasharray="18 14" strokeDashoffset={480 * (1 - attack)} />
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: 325, right: 325, top: 320, height: 170, borderRadius: '50%', border: `8px solid ${palette.secondary}`, transform: `scale(${0.85 + attack * 0.15})`, opacity: 0.45 + attack * 0.45}} />
    </StageShell>
  );
};

const NetworkFlowStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const flow = phase(progress, 0.12, 0.86);
  const nodes = Array.from({length: 13}).map((_, index) => ({x: 95 + (index % 4) * 265 + (index % 2) * 40, y: 125 + Math.floor(index / 4) * 210 + (index % 3) * 25}));
  return (
    <StageShell scene={scene} progress={progress}>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        {nodes.slice(0, -1).map((node, index) => {
          const next = nodes[(index + 3) % nodes.length];
          return <line key={index} x1={node.x} y1={node.y} x2={next.x} y2={next.y} stroke={index % 2 ? palette.secondary : palette.primary} strokeWidth={index % 4 === 0 ? 10 : 5} opacity={0.22 + flow * 0.58} strokeDasharray={index % 3 === 0 ? '14 12' : undefined} strokeDashoffset={350 * (1 - flow)} />;
        })}
        {nodes.map((node, index) => <g key={index} opacity={phase(progress, 0.05 + index * 0.03, 0.3 + index * 0.03)}><circle cx={node.x} cy={node.y} r={index % 4 === 0 ? 42 : 25} fill={index % 3 === 0 ? palette.highlight : index % 3 === 1 ? palette.primary : palette.secondary} stroke={palette.ink} strokeWidth="7" /><circle cx={node.x} cy={node.y} r={index % 4 === 0 ? 62 : 39} fill="none" stroke={palette.paper} strokeWidth="3" opacity=".3" /></g>)}
      </svg>
      <div style={{position: 'absolute', left: 100, top: 60, color: palette.paper, fontFamily: 'Arial Black, Arial', fontSize: 26}}>PHYSICAL HUBS • DIRECTION • BOTTLENECKS</div>
    </StageShell>
  );
};

const ArchivalEvidenceStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const reveal = phase(progress, 0.08, 0.55);
  return (
    <StageShell scene={scene} progress={progress} background={`linear-gradient(145deg, ${palette.paper}, ${alpha(palette.highlight, 0.5)})`}>
      {[{x:70,y:95,r:-6},{x:365,y:145,r:4},{x:650,y:75,r:-2}].map((paper, index) => (
        <div key={index} style={{position: 'absolute', left: paper.x, top: paper.y, width: 280, height: 530, padding: 28, background: palette.paper, border: `7px solid ${palette.ink}`, boxShadow: `22px 26px 0 ${alpha(palette.primary, 0.28)}`, transform: `translateY(${(1 - reveal) * 80}px) rotate(${paper.r}deg)`, opacity: reveal}}>
          <div style={{height: 28, width: `${55 + index * 12}%`, background: index % 2 ? palette.secondary : palette.primary, marginBottom: 30}} />
          {Array.from({length: 9}).map((_, line) => <div key={line} style={{height: 9, width: `${92 - (line % 4) * 13}%`, background: palette.ink, opacity: 0.42, marginBottom: 18}} />)}
          {index === 1 ? <div style={{position: 'absolute', left: 45, right: 45, bottom: 52, height: 150, background: palette.muted, border: `6px solid ${palette.ink}`}} /> : null}
          {index === 2 ? <div style={{position: 'absolute', right: 35, bottom: 35, width: 100, height: 100, borderRadius: '50%', border: `9px double ${palette.primary}`}} /> : null}
        </div>
      ))}
      <div style={{position: 'absolute', left: 380, top: 420, width: 250, height: 90, border: `7px solid ${palette.primary}`, transform: `rotate(-8deg) scale(${phase(progress, 0.38, 0.66)})`, color: palette.primary, fontFamily: 'Arial Black, Arial', fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: alpha(palette.paper, 0.82)}}>EVIDENCE</div>
    </StageShell>
  );
};

const HazardOperationStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const danger = phase(progress, 0.08, 0.48);
  const response = phase(progress, 0.42, 0.86);
  return (
    <StageShell scene={scene} progress={progress}>
      <div style={{position: 'absolute', left: 80, right: 80, top: 125, height: 520, border: `9px solid ${palette.ink}`, background: alpha(palette.muted, 0.68)}}>
        <svg width="100%" height="100%" viewBox="0 0 840 520" style={{position: 'absolute', inset: 0}}>
          <path d="M40 400 C190 310 300 430 430 350 S660 315 800 390" fill="none" stroke={palette.paper} strokeWidth="32" />
          <path d="M40 400 C190 310 300 430 430 350 S660 315 800 390" fill="none" stroke={palette.highlight} strokeWidth="9" strokeDasharray="13 12" />
          <path d="M170 20 L265 240 L220 335" fill="none" stroke={palette.ink} strokeWidth="24" strokeLinecap="round" opacity={danger} />
          <path d="M660 55 C560 135 535 225 500 350" fill="none" stroke={palette.secondary} strokeWidth="17" strokeDasharray="20 14" strokeDashoffset={460 * (1 - response)} />
          <circle cx="500" cy="350" r="31" fill={palette.primary} stroke={palette.ink} strokeWidth="8" opacity={response} />
          <path d="M430 350 L470 320 L520 375 L560 335" fill="none" stroke={palette.primary} strokeWidth="16" opacity={danger} />
        </svg>
        <Person palette={palette} x={590} y={235} scale={0.8} progress={progress} accent={palette.secondary} />
      </div>
      <div style={{position: 'absolute', left: 95, top: 75, color: palette.highlight, fontFamily: 'Arial Black, Arial', fontSize: 27}}>THREAT → IMPACT → RESPONSE</div>
    </StageShell>
  );
};

const ComparisonStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const p = phase(progress, 0.08, 0.62);
  return (
    <StageShell scene={scene} progress={progress}>
      <div style={{position: 'absolute', left: 45, top: 105, width: 430, height: 570, background: alpha(palette.paper, 0.82), border: `9px solid ${palette.ink}`, transform: `translateX(${(1 - p) * -90}px)`, opacity: p}}>
        <div style={{position: 'absolute', left: 75, right: 75, top: 90, height: 270, borderRadius: '50%', background: palette.primary, border: `8px solid ${palette.ink}`}} />
        <div style={{position: 'absolute', left: 65, right: 65, bottom: 65, height: 75, background: palette.muted, border: `6px solid ${palette.ink}`}} />
      </div>
      <div style={{position: 'absolute', right: 45, top: 105, width: 430, height: 570, background: alpha(palette.paper, 0.82), border: `9px solid ${palette.ink}`, transform: `translateX(${(1 - p) * 90}px)`, opacity: p}}>
        <div style={{position: 'absolute', left: 95, right: 95, top: 125, height: 210, borderRadius: 30, background: palette.highlight, border: `8px solid ${palette.ink}`, transform: `scale(${0.78 + p * 0.22})`}} />
        <div style={{position: 'absolute', left: 45, right: 45, bottom: 65, height: 75, background: palette.secondary, border: `6px solid ${palette.ink}`}} />
      </div>
      <div style={{position: 'absolute', left: 485, top: 260, width: 30, height: 300, background: palette.highlight, boxShadow: `0 0 35px ${palette.highlight}`}} />
    </StageShell>
  );
};

const TimelineCausalityStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const trace = phase(progress, 0.05, 0.82);
  const labels = (scene.v9Blueprint?.worldEntities ?? []).slice(0, 5);
  return (
    <StageShell scene={scene} progress={progress}>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M90 450 L910 450" stroke={alpha(palette.paper, 0.28)} strokeWidth="25" strokeLinecap="round" />
        <path d="M90 450 L910 450" stroke={palette.highlight} strokeWidth="9" strokeLinecap="round" strokeDasharray="18 14" strokeDashoffset={850 * (1 - trace)} />
        {[130, 310, 500, 690, 870].map((x, index) => <g key={x} opacity={phase(progress, 0.1 + index * 0.09, 0.35 + index * 0.09)}><circle cx={x} cy="450" r={index === 0 || index === 4 ? 42 : 30} fill={index % 2 ? palette.secondary : palette.primary} stroke={palette.ink} strokeWidth="8" /><path d={`M${x} ${index % 2 ? 410 : 490} L${x} ${index % 2 ? 245 : 650}`} stroke={palette.paper} strokeWidth="5" /><rect x={x - 78} y={index % 2 ? 160 : 650} width="156" height="90" rx="12" fill={palette.paper} stroke={palette.ink} strokeWidth="6" /><text x={x} y={index % 2 ? 215 : 706} textAnchor="middle" fill={palette.ink} fontFamily="Arial Black, Arial" fontSize="16">{short(labels[index] ?? `EVENT ${index + 1}`, 18)}</text></g>)}
      </svg>
    </StageShell>
  );
};

const EnvironmentalReconstructionStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  return (
    <StageShell scene={scene} progress={progress} background={`linear-gradient(180deg, ${alpha(palette.secondary, 0.78)}, ${palette.paper} 52%, ${palette.primary})`}>
      <div style={{position: 'absolute', left: -60, right: -60, bottom: 0, height: 300, background: `linear-gradient(165deg, transparent 0 12%, ${palette.primary} 13% 48%, transparent 49%), linear-gradient(205deg, transparent 0 26%, ${palette.secondary} 27% 65%, transparent 66%)`, transform: `translateX(${-progress * 22}px)`}} />
      <MountainRange palette={palette} y={600} opacity={0.82} />
      {Array.from({length: 11}).map((_, index) => <div key={index} style={{position: 'absolute', left: 28 + index * 94 - progress * (index % 2 ? 12 : 4), bottom: 90 + (index % 3) * 22, width: 48, height: 180 + (index % 4) * 35, background: palette.ink, clipPath: 'polygon(42% 0,58% 0,62% 38%,100% 68%,65% 64%,71% 100%,29% 100%,35% 64%,0 68%,38% 38%)', opacity: 0.25 + phase(progress, 0.1, 0.55) * 0.58}} />)}
      <div style={{position: 'absolute', left: 365, top: 245, width: 270, height: 215, borderRadius: '52% 48% 44% 56%', background: palette.highlight, border: `10px solid ${palette.ink}`, transform: `scale(${0.75 + phase(progress, 0.08, 0.5) * 0.25}) rotate(${Math.sin(progress * Math.PI * 2) * 3}deg)`, opacity: phase(progress, 0.08, 0.5)}} />
    </StageShell>
  );
};

const ConsequenceWorldStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const pull = phase(progress, 0.05, 0.82);
  return (
    <StageShell scene={scene} progress={progress} background={`radial-gradient(circle at 50% 45%, ${alpha(palette.secondary, 0.55)}, ${palette.bg} 72%)`}>
      <div style={{position: 'absolute', left: 270, top: 120, width: 460, height: 460, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${palette.paper}, ${palette.secondary} 38%, ${palette.bg} 72%)`, border: `12px solid ${palette.ink}`, transform: `scale(${1.2 - pull * 0.2}) rotate(${progress * 9}deg)`, boxShadow: `0 0 80px ${alpha(palette.highlight, 0.32)}`}}>
        {Array.from({length: 9}).map((_, index) => <div key={index} style={{position: 'absolute', left: `${12 + (index * 19) % 76}%`, top: `${10 + (index * 27) % 74}%`, width: 55 + (index % 3) * 28, height: 38 + (index % 2) * 24, borderRadius: '48% 52%', background: index % 2 ? palette.primary : palette.highlight, transform: `rotate(${index * 29}deg)`, opacity: 0.7}} />)}
      </div>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        {[{x:130,y:690},{x:310,y:760},{x:500,y:690},{x:690,y:760},{x:870,y:690}].map((node, index) => <g key={index} opacity={phase(progress, 0.2 + index * 0.06, 0.48 + index * 0.06)}><circle cx={node.x} cy={node.y} r="28" fill={index % 2 ? palette.secondary : palette.primary} stroke={palette.paper} strokeWidth="6" /><path d={`M${node.x} ${node.y - 35} C${node.x} 610 500 590 500 560`} fill="none" stroke={palette.highlight} strokeWidth="5" opacity=".52" /></g>)}
      </svg>
    </StageShell>
  );
};

const AssetStage: React.FC<{scene: Scene; progress: number; source: string}> = ({scene, progress, source}) => {
  const palette = paletteFor(scene);
  const camera = scene.v9Blueprint?.motionIntent?.camera ?? 'controlled-push-in';
  const x = /left/.test(camera) ? 36 - progress * 70 : /right/.test(camera) ? -36 + progress * 70 : 0;
  const y = /up/.test(camera) ? 24 - progress * 48 : /down/.test(camera) ? -24 + progress * 48 : -progress * 16;
  const scale = /pull/.test(camera) ? 1.14 - progress * 0.12 : 1.04 + progress * 0.08;
  return (
    <StageShell scene={scene} progress={progress} background={palette.bg}>
      <Img src={staticFile(source)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${x}px, ${y}px) scale(${scale})`, filter: 'contrast(1.1) saturate(.92) brightness(.88)'}} />
      <AbsoluteFill style={{background: `linear-gradient(0deg, ${alpha(palette.bg, 0.94)}, transparent 58%), linear-gradient(120deg, ${alpha(palette.primary, 0.18)}, transparent 48%)`}} />
      <div style={{position: 'absolute', left: 55, right: 55, bottom: 82, padding: 18, background: alpha(palette.bg, 0.62), borderLeft: `7px solid ${palette.highlight}`, color: palette.paper, fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 25}}>{short(scene.v9Blueprint?.visualStatement, 130)}</div>
    </StageShell>
  );
};

const SemanticStage: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const source = assetSource(scene.asset);
  if (source) return <AssetStage scene={scene} progress={progress} source={source} />;
  switch (scene.v9Blueprint?.sceneFamily) {
    case 'geographic-route': return <GeographicRouteStage scene={scene} progress={progress} />;
    case 'human-reconstruction': return <HumanReconstructionStage scene={scene} progress={progress} />;
    case 'environmental-reconstruction': return <EnvironmentalReconstructionStage scene={scene} progress={progress} />;
    case 'industrial-process': return <IndustrialProcessStage scene={scene} progress={progress} />;
    case 'mechanism-cutaway': return <MechanismCutawayStage scene={scene} progress={progress} />;
    case 'microscopic-process': return <MicroscopicProcessStage scene={scene} progress={progress} />;
    case 'market-exchange': return <MarketExchangeStage scene={scene} progress={progress} />;
    case 'network-flow': return <NetworkFlowStage scene={scene} progress={progress} />;
    case 'archival-evidence': return <ArchivalEvidenceStage scene={scene} progress={progress} />;
    case 'hazard-operation': return <HazardOperationStage scene={scene} progress={progress} />;
    case 'comparison-stage': return <ComparisonStage scene={scene} progress={progress} />;
    case 'timeline-causality': return <TimelineCausalityStage scene={scene} progress={progress} />;
    case 'consequence-world': return <ConsequenceWorldStage scene={scene} progress={progress} />;
    default: return <EnvironmentalReconstructionStage scene={scene} progress={progress} />;
  }
};

const SceneFrame: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, totalFrames - 1));
  const palette = paletteFor(scene);
  const enter = phase(progress, 0, 0.13);
  const exit = 1 - phase(progress, 0.88, 1);
  const family = clean(scene.v9Blueprint?.sceneFamily).replace(/-/g, ' ').toUpperCase();
  const cameraHint = clean(scene.v9Blueprint?.motionIntent?.grammar).replace(/-/g, ' ');
  const titleSize = scene.title.length > 48 ? 39 : scene.title.length > 34 ? 45 : 53;
  return (
    <AbsoluteFill style={{background: palette.bg, color: palette.paper, overflow: 'hidden', opacity: enter * exit, transform: `scale(${1.035 - enter * 0.035})`}}>
      <div style={{position: 'absolute', left: 46, right: 46, top: 38, display: 'flex', alignItems: 'center', gap: 14, opacity: enter}}>
        <span style={{padding: '7px 10px', border: `2px solid ${palette.highlight}`, color: palette.highlight, background: alpha(palette.bg, 0.72), fontFamily: 'Arial Black, Arial', fontSize: 17}}>{String(scene.id).padStart(2, '0')}</span>
        <span style={{height: 3, flex: 1, background: `linear-gradient(90deg, ${palette.primary}, transparent)`}} />
        <span style={{fontFamily: 'Arial, sans-serif', fontWeight: 800, letterSpacing: 1.3, fontSize: 14, color: palette.muted}}>{family}</span>
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, top: 96, fontFamily: /history|archive|silk/.test(lower(`${plan.category} ${plan.topic}`)) ? 'Georgia, serif' : 'Arial Black, Arial', fontSize: titleSize, fontWeight: 900, lineHeight: 0.98, letterSpacing: -1, textShadow: `0 10px 28px ${palette.bg}`, opacity: phase(progress, 0.02, 0.22), transform: `translateX(${(1 - enter) * -38}px)`}}>{short(scene.title, 62)}</div>
      <div style={{position: 'absolute', left: 52, right: 52, top: 220, fontFamily: 'Arial, sans-serif', color: palette.highlight, fontWeight: 800, fontSize: 18, opacity: phase(progress, 0.08, 0.32)}}>{short(scene.kicker || cameraHint || scene.v9Blueprint?.visualStatement, 88)}</div>
      <div style={{position: 'absolute', left: 24, right: 24, top: 278, bottom: 205, border: `2px solid ${alpha(palette.paper, 0.2)}`, boxShadow: `0 24px 65px ${alpha(palette.bg, 0.75)}`, overflow: 'hidden', opacity: phase(progress, 0.02, 0.24), transform: `translateY(${(1 - enter) * 24}px)`}}>
        <SemanticStage scene={scene} progress={progress} />
      </div>
      <div style={{position: 'absolute', left: 50, right: 50, bottom: 42, borderTop: `2px solid ${alpha(palette.highlight, 0.62)}`, paddingTop: 13, fontFamily: 'Arial, sans-serif', fontSize: 26, lineHeight: 1.12, fontWeight: 750, color: palette.paper, textShadow: `0 6px 18px ${palette.bg}`, opacity: phase(progress, 0.12, 0.38), maxHeight: 120, overflow: 'hidden'}}>{clean(scene.voiceLine)}</div>
    </AbsoluteFill>
  );
};

export const SemanticVisualAutoShortV9: React.FC = () => (
  <AbsoluteFill style={{background: '#07090c'}}>
    <Audio src={staticFile('auto-factory/audio/final.wav')} />
    {plan.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
        premountFor={20}
      >
        <SceneFrame scene={scene} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
