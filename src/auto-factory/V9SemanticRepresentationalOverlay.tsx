import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
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

type Scene = {
  id: number;
  start: number;
  duration: number;
  title?: string;
  voiceLine?: string;
  heroVisual?: string;
  mustShow?: string[];
  v9Blueprint?: {
    sceneFamily?: string;
    worldEntities?: string[];
  };
  visualContract?: {
    style?: {palette?: Partial<Palette>};
  };
};

type Plan = {
  fps: number;
  topic?: string;
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
const phase = (value: number, start: number, end: number) => smooth((value - start) / Math.max(0.001, end - start));
const clean = (value: unknown) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value: unknown) => clean(value).toLowerCase();
const alpha = (hex: string, opacity: number) => `${hex}${Math.round(clamp(opacity) * 255).toString(16).padStart(2, '0')}`;
const localText = (scene: Scene) => lower([
  scene.title,
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
    paper: style.paper ?? base.paper ?? '#eadfc7',
    ink: style.ink ?? base.ink ?? '#17191d',
    primary: style.primary ?? base.red ?? '#b64a3a',
    secondary: style.secondary ?? base.teal ?? '#247c7a',
    highlight: style.highlight ?? base.gold ?? '#d9ae4a',
    muted: style.muted ?? base.blue ?? '#415a73',
  };
};

const Stage: React.FC<{scene: Scene; progress: number; children: React.ReactNode; background?: string}> = ({scene, progress, children, background}) => {
  const palette = paletteFor(scene);
  return (
    <div style={{position: 'absolute', left: 24, right: 24, top: 278, bottom: 205, overflow: 'hidden', background: background ?? palette.bg, border: `2px solid ${alpha(palette.paper, 0.2)}`, boxShadow: `0 24px 65px ${alpha(palette.bg, 0.75)}`}}>
      {children}
      <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.2, backgroundImage: `radial-gradient(circle, ${alpha(palette.paper, 0.14)} 0 1px, transparent 1.4px), repeating-linear-gradient(108deg, transparent 0 12px, ${alpha(palette.ink, 0.04)} 13px 14px)`, backgroundSize: '14px 14px', transform: `translate(${Math.sin(progress * Math.PI * 2) * 3}px, ${Math.cos(progress * Math.PI * 1.7) * 3}px)`}} />
      <AbsoluteFill style={{pointerEvents: 'none', boxShadow: 'inset 0 0 105px rgba(0,0,0,.5)'}} />
    </div>
  );
};

const Person: React.FC<{palette: Palette; x: number; y: number; scale?: number; progress: number; color?: string}> = ({palette, x, y, scale = 1, progress, color}) => {
  const appear = phase(progress, 0.08, 0.38);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 72 * scale, height: 178 * scale, opacity: appear, transform: `translateY(${(1 - appear) * 52}px)`}}>
      <div style={{position: 'absolute', left: 15 * scale, top: 0, width: 42 * scale, height: 42 * scale, borderRadius: '50%', background: palette.highlight, border: `${5 * scale}px solid ${palette.ink}`}} />
      <div style={{position: 'absolute', left: 4 * scale, top: 41 * scale, width: 64 * scale, height: 94 * scale, borderRadius: `${25 * scale}px ${25 * scale}px ${9 * scale}px ${9 * scale}px`, background: color ?? palette.primary, border: `${6 * scale}px solid ${palette.ink}`}} />
      <div style={{position: 'absolute', left: 14 * scale, top: 130 * scale, width: 12 * scale, height: 48 * scale, background: palette.ink, transform: 'rotate(6deg)'}} />
      <div style={{position: 'absolute', right: 14 * scale, top: 130 * scale, width: 12 * scale, height: 48 * scale, background: palette.ink, transform: 'rotate(-6deg)'}} />
    </div>
  );
};

const Camel: React.FC<{palette: Palette; x: number; y: number; scale: number; progress: number; delay: number}> = ({palette, x, y, scale, progress, delay}) => {
  const appear = phase(progress, delay, delay + 0.27);
  return (
    <svg width={225 * scale} height={155 * scale} viewBox="0 0 225 155" style={{position: 'absolute', left: x + progress * 58, top: y + Math.sin((progress + delay) * Math.PI * 4) * 3, opacity: appear}}>
      <path d="M34 80 C48 45 69 47 82 70 C94 34 122 35 137 70 C159 67 174 79 181 97 L151 108 L54 106 Z" fill={palette.highlight} stroke={palette.ink} strokeWidth="7" />
      <path d="M153 80 C171 49 188 38 198 47 C207 55 201 74 184 90" fill="none" stroke={palette.ink} strokeWidth="13" strokeLinecap="round" />
      <circle cx="199" cy="46" r="10" fill={palette.highlight} stroke={palette.ink} strokeWidth="5" />
      <path d="M67 103 L60 148 M98 103 L92 148 M136 103 L141 148 M162 100 L174 144" stroke={palette.ink} strokeWidth="9" strokeLinecap="round" />
      <rect x="88" y="61" width="47" height="30" rx="5" fill={palette.primary} stroke={palette.ink} strokeWidth="5" />
    </svg>
  );
};

const Mountains: React.FC<{palette: Palette; y?: number; opacity?: number}> = ({palette, y = 620, opacity = 0.75}) => (
  <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0, opacity}}>
    <path d={`M-30 ${y} L100 ${y - 150} L205 ${y - 45} L350 ${y - 235} L485 ${y - 55} L625 ${y - 180} L755 ${y - 38} L890 ${y - 205} L1030 ${y} Z`} fill={palette.muted} stroke={alpha(palette.paper, 0.4)} strokeWidth="5" />
    <path d={`M65 ${y - 110} L100 ${y - 150} L137 ${y - 105} M310 ${y - 180} L350 ${y - 235} L393 ${y - 174} M850 ${y - 158} L890 ${y - 205} L930 ${y - 150}`} fill="none" stroke={palette.paper} strokeWidth="10" opacity=".72" />
  </svg>
);

const CaravanScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${alpha(palette.highlight, 0.78)}, ${palette.paper} 45%, ${alpha(palette.primary, 0.65)})`}>
      <Mountains palette={palette} y={570} opacity={0.55} />
      <div style={{position: 'absolute', left: -80, right: -80, bottom: -10, height: 320, borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${palette.highlight}, ${palette.primary})`, transform: `translateX(${Math.sin(progress * Math.PI) * -18}px)`}} />
      <Camel palette={palette} x={15} y={495} scale={0.83} progress={progress} delay={0.04} />
      <Camel palette={palette} x={225} y={468} scale={1.02} progress={progress} delay={0.13} />
      <Camel palette={palette} x={490} y={500} scale={0.79} progress={progress} delay={0.22} />
      <Person palette={palette} x={760} y={500} scale={0.72} progress={progress} color={palette.secondary} />
      <div style={{position: 'absolute', left: 44, top: 45, padding: '10px 14px', color: palette.ink, background: alpha(palette.paper, 0.68), borderLeft: `7px solid ${palette.primary}`, fontFamily: 'Georgia, serif', fontSize: 25, fontWeight: 900}}>CARAVAN • TERRAIN • STAGED JOURNEY</div>
    </Stage>
  );
};

const CityRelayScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const reveal = phase(progress, 0.05, 0.5);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.paper}, ${alpha(palette.highlight, 0.55)})`}>
      <Mountains palette={palette} y={560} opacity={0.38} />
      <div style={{position: 'absolute', left: 95, right: 95, bottom: 100, height: 455, display: 'flex', alignItems: 'flex-end', gap: 12, opacity: reveal, transform: `translateY(${(1 - reveal) * 60}px)`}}>
        {[250, 190, 320, 210, 265].map((height, index) => <div key={index} style={{position: 'relative', width: index === 2 ? 205 : 145, height, background: index % 2 ? palette.secondary : palette.primary, border: `7px solid ${palette.ink}`, clipPath: index === 2 ? 'polygon(0 22%,24% 22%,30% 0,70% 0,76% 22%,100% 22%,100% 100%,0 100%)' : 'polygon(0 18%,50% 0,100% 18%,100% 100%,0 100%)'}}>
          <div style={{position: 'absolute', left: '34%', bottom: 0, width: '32%', height: '48%', borderRadius: '50px 50px 0 0', background: palette.bg}} />
        </div>)}
      </div>
      <div style={{position: 'absolute', left: 110, right: 110, bottom: 70, height: 18, background: palette.ink}} />
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M55 730 C240 655 355 760 510 685 S760 605 945 660" fill="none" stroke={palette.highlight} strokeWidth="12" strokeDasharray="20 16" strokeDashoffset={850 * (1 - progress)} />
        {[190, 505, 810].map((x, index) => <circle key={x} cx={x} cy={index === 1 ? 685 : 690} r="22" fill={index === 1 ? palette.primary : palette.secondary} stroke={palette.ink} strokeWidth="7" opacity={phase(progress, 0.18 + index * 0.1, 0.4 + index * 0.1)} />)}
      </svg>
      <div style={{position: 'absolute', left: 55, top: 52, color: palette.ink, fontFamily: 'Georgia, serif', fontSize: 29, fontWeight: 900}}>OASIS CITY AS A HUMAN RELAY HUB</div>
    </Stage>
  );
};

const MaritimeScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const move = phase(progress, 0.08, 0.78);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${alpha(palette.secondary, 0.66)}, ${palette.bg} 58%, ${palette.muted})`}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 315, height: 12, background: alpha(palette.paper, 0.68)}} />
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M0 330 C130 300 245 355 370 325 S620 295 760 330 S910 350 1000 320 L1000 900 L0 900 Z" fill={alpha(palette.secondary, 0.75)} />
        <path d="M0 700 C190 640 350 760 520 690 S800 635 1000 710 L1000 900 L0 900 Z" fill={palette.ink} opacity=".6" />
        <g transform={`translate(${90 + move * 390} 0)`}>
          <path d="M80 360 L540 360 L610 410 L570 495 L150 495 L95 445 Z" fill={palette.paper} stroke={palette.ink} strokeWidth="10" />
          <path d="M145 495 L570 495 L545 535 L175 535 Z" fill={palette.primary} stroke={palette.ink} strokeWidth="7" />
          <rect x="275" y="270" width="165" height="98" fill={palette.paper} stroke={palette.ink} strokeWidth="8" />
          <path d="M355 270 L355 120" stroke={palette.ink} strokeWidth="13" />
          <path d="M355 130 L500 260 L355 260 Z" fill={palette.highlight} stroke={palette.ink} strokeWidth="7" />
          <rect x="175" y="325" width="75" height="45" fill={palette.secondary} stroke={palette.ink} strokeWidth="6" />
        </g>
        <path d="M180 625 C380 555 510 650 700 580 S870 560 960 610" fill="none" stroke={palette.highlight} strokeWidth="9" strokeDasharray="18 14" strokeDashoffset={650 * (1 - move)} />
      </svg>
      <div style={{position: 'absolute', right: 50, bottom: 48, width: 260, height: 260, background: palette.paper, border: `8px solid ${palette.ink}`, clipPath: 'polygon(0 18%,18% 18%,22% 0,78% 0,82% 18%,100% 18%,100% 100%,0 100%)'}}>
        <div style={{position: 'absolute', left: 70, bottom: 0, width: 120, height: 150, borderRadius: '60px 60px 0 0', background: palette.bg}} />
      </div>
      <div style={{position: 'absolute', left: 50, top: 48, color: palette.paper, fontFamily: 'Arial Black, Arial', fontSize: 27}}>SHIP + PORT + LAND-ROUTE HANDOFF</div>
    </Stage>
  );
};

const CheckpointScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const gate = phase(progress, 0.08, 0.52);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.muted}, ${palette.paper})`}>
      <Mountains palette={palette} y={650} opacity={0.42} />
      <div style={{position: 'absolute', left: 155, right: 155, top: 120, height: 500, opacity: gate, transform: `scale(${0.82 + gate * 0.18})`}}>
        <div style={{position: 'absolute', left: 0, top: 130, width: 220, height: 340, background: palette.primary, border: `9px solid ${palette.ink}`}} />
        <div style={{position: 'absolute', right: 0, top: 130, width: 220, height: 340, background: palette.primary, border: `9px solid ${palette.ink}`}} />
        <div style={{position: 'absolute', left: 170, right: 170, top: 30, height: 170, background: palette.highlight, border: `9px solid ${palette.ink}`, clipPath: 'polygon(0 28%,18% 28%,25% 0,75% 0,82% 28%,100% 28%,100% 100%,0 100%)'}} />
        <div style={{position: 'absolute', left: 230, top: 250, width: 230, height: 220, borderRadius: '115px 115px 0 0', background: palette.bg, border: `9px solid ${palette.ink}`}} />
      </div>
      <Person palette={palette} x={120} y={520} scale={0.85} progress={progress} color={palette.secondary} />
      <Person palette={palette} x={810} y={520} scale={0.85} progress={progress} color={palette.secondary} />
      <div style={{position: 'absolute', left: 405, bottom: 90, width: 190, height: 90, background: palette.paper, border: `7px solid ${palette.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial Black, Arial', color: palette.primary, fontSize: 23, transform: `rotate(${-5 + progress * 4}deg)`}}>TAX / CONTROL</div>
      <div style={{position: 'absolute', left: 48, top: 48, color: palette.ink, fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 28}}>EMPIRE CONTROL WAS A PHYSICAL CHECKPOINT</div>
    </Stage>
  );
};

const TerrainScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${alpha(palette.secondary, 0.72)}, ${palette.paper} 43%, ${palette.highlight})`}>
      <Mountains palette={palette} y={600} opacity={0.9} />
      <div style={{position: 'absolute', left: -90, right: 400, bottom: -20, height: 340, borderRadius: '50% 50% 0 0', background: `linear-gradient(180deg, ${palette.highlight}, ${palette.primary})`, transform: `translateX(${-progress * 22}px)`}} />
      <div style={{position: 'absolute', right: 100, bottom: 95, width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${palette.secondary} 0 38%, ${palette.paper} 40% 50%, transparent 52%)`, border: `8px solid ${palette.ink}`, transform: `scale(${0.86 + phase(progress, 0.15, 0.55) * 0.14})`}} />
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M70 760 C230 660 360 780 520 675 S760 600 915 650" fill="none" stroke={palette.ink} strokeWidth="28" opacity=".34" />
        <path d="M70 760 C230 660 360 780 520 675 S760 600 915 650" fill="none" stroke={palette.primary} strokeWidth="9" strokeDasharray="18 14" strokeDashoffset={780 * (1 - progress)} />
      </svg>
      <div style={{position: 'absolute', left: 48, top: 48, color: palette.ink, fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 28}}>MOUNTAINS • DESERT • WATER DECIDE THE PATH</div>
    </Stage>
  );
};

const ArchiveIdeasScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const reveal = phase(progress, 0.06, 0.54);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(145deg, ${palette.paper}, ${alpha(palette.highlight, 0.52)})`}>
      {[{x:75,y:95,r:-7},{x:370,y:140,r:4},{x:665,y:78,r:-2}].map((paper, index) => <div key={index} style={{position: 'absolute', left: paper.x, top: paper.y, width: 270, height: 540, padding: 28, background: palette.paper, border: `7px solid ${palette.ink}`, boxShadow: `22px 26px 0 ${alpha(index % 2 ? palette.secondary : palette.primary, 0.3)}`, transform: `translateY(${(1 - reveal) * 80}px) rotate(${paper.r}deg)`, opacity: reveal}}>
        <div style={{height: 28, width: `${56 + index * 12}%`, background: index % 2 ? palette.secondary : palette.primary, marginBottom: 30}} />
        {Array.from({length: 8}).map((_, line) => <div key={line} style={{height: 9, width: `${92 - (line % 4) * 13}%`, background: palette.ink, opacity: 0.42, marginBottom: 18}} />)}
        {index === 1 ? <svg width="100%" height="150" viewBox="0 0 210 150" style={{position: 'absolute', left: 28, bottom: 45}}><path d="M20 120 C55 45 110 45 185 115" fill="none" stroke={palette.primary} strokeWidth="8" /><circle cx="45" cy="90" r="17" fill={palette.highlight}/><circle cx="115" cy="60" r="17" fill={palette.secondary}/><circle cx="180" cy="112" r="17" fill={palette.primary}/></svg> : null}
        {index === 2 ? <div style={{position: 'absolute', right: 32, bottom: 32, width: 105, height: 105, borderRadius: '50%', border: `9px double ${palette.primary}`}} /> : null}
      </div>)}
      <div style={{position: 'absolute', left: 385, top: 420, width: 230, height: 88, border: `7px solid ${palette.secondary}`, transform: `rotate(-8deg) scale(${phase(progress, 0.38, 0.68)})`, color: palette.secondary, fontFamily: 'Arial Black, Arial', fontSize: 23, display: 'flex', alignItems: 'center', justifyContent: 'center', background: alpha(palette.paper, 0.88)}}>IDEAS TRAVEL</div>
    </Stage>
  );
};

const HazardRouteScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const impact = phase(progress, 0.14, 0.55);
  const redirect = phase(progress, 0.48, 0.9);
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.bg}, ${palette.muted})`}>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M65 600 C220 470 355 620 500 500 S740 420 930 520" fill="none" stroke={palette.paper} strokeWidth="34" opacity=".35" />
        <path d="M65 600 C220 470 355 620 500 500 S740 420 930 520" fill="none" stroke={palette.highlight} strokeWidth="11" strokeDasharray="18 14" />
        <path d="M460 420 L540 575 M540 420 L460 575" stroke={palette.primary} strokeWidth="30" strokeLinecap="round" opacity={impact} />
        <path d="M385 500 C365 300 610 255 755 405 C820 470 865 440 930 375" fill="none" stroke={palette.secondary} strokeWidth="13" strokeDasharray="20 15" strokeDashoffset={720 * (1 - redirect)} />
        {[{x:65,y:600},{x:300,y:545},{x:755,y:405},{x:930,y:375}].map((node, index) => <circle key={index} cx={node.x} cy={node.y} r="24" fill={index < 2 ? palette.primary : palette.secondary} stroke={palette.ink} strokeWidth="7" opacity={phase(progress, 0.08 + index * 0.1, 0.35 + index * 0.1)} />)}
      </svg>
      <div style={{position: 'absolute', left: 55, top: 54, color: palette.paper, fontFamily: 'Arial Black, Arial', fontSize: 29}}>BROKEN LINK → ALTERNATE CORRIDOR</div>
      <div style={{position: 'absolute', left: 360, bottom: 85, width: 280, padding: 15, background: alpha(palette.bg, 0.76), border: `4px solid ${palette.primary}`, color: palette.paper, textAlign: 'center', fontFamily: 'Arial Black, Arial', fontSize: 22, opacity: impact}}>WAR • DISEASE • BLOCKAGE</div>
    </Stage>
  );
};

const RouteScene: React.FC<{scene: Scene; progress: number}> = ({scene, progress}) => {
  const palette = paletteFor(scene);
  const reveal = phase(progress, 0.08, 0.76);
  const points = [{x:875,y:600,label:'CHINA'},{x:710,y:500,label:'CENTRAL ASIA'},{x:520,y:440,label:'SAMARKAND'},{x:345,y:380,label:'PERSIA'},{x:135,y:330,label:'EUROPE'}];
  const moverIndex = Math.min(points.length - 1, Math.floor(reveal * points.length));
  const mover = points[moverIndex];
  return (
    <Stage scene={scene} progress={progress} background={`linear-gradient(180deg, ${palette.paper}, ${alpha(palette.highlight, 0.36)})`}>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <path d="M30 205 C120 75 270 75 375 155 C455 220 485 300 575 300 C685 300 735 200 835 170 C925 145 990 235 965 345 C940 460 830 505 725 515 C595 530 550 655 425 665 C300 675 190 610 115 525 C45 450 0 325 30 205 Z" fill={alpha(palette.secondary, 0.25)} stroke={palette.ink} strokeWidth="8" />
        <path d="M910 615 C735 505 625 505 520 440 S325 350 120 315" fill="none" stroke={alpha(palette.ink, 0.25)} strokeWidth="30" strokeLinecap="round" />
        <path d="M910 615 C735 505 625 505 520 440 S325 350 120 315" fill="none" stroke={palette.primary} strokeWidth="12" strokeLinecap="round" strokeDasharray="18 14" strokeDashoffset={950 * (1 - reveal)} />
        {points.map((point, index) => <g key={point.label} opacity={phase(progress, 0.12 + index * 0.08, 0.34 + index * 0.08)}><circle cx={point.x} cy={point.y} r={index === 0 || index === 4 ? 24 : 16} fill={index % 2 ? palette.secondary : palette.highlight} stroke={palette.ink} strokeWidth="7" /><text x={point.x} y={point.y - 48} textAnchor="middle" fill={palette.ink} fontFamily="Arial Black, Arial" fontSize="19">{point.label}</text></g>)}
        <g transform={`translate(${mover.x} ${mover.y})`} opacity={reveal}><path d="M-30 4 L18 -18 L42 0 L18 18 Z" fill={palette.primary} stroke={palette.ink} strokeWidth="6" /><path d="M41 0 L67 -13 L67 13 Z" fill={palette.highlight} stroke={palette.ink} strokeWidth="5" /></g>
      </svg>
      <Mountains palette={palette} y={800} opacity={0.5} />
      <div style={{position: 'absolute', left: 50, top: 48, color: palette.ink, fontFamily: 'Georgia, serif', fontSize: 29, fontWeight: 900}}>CHINA → HUBS → EUROPE</div>
    </Stage>
  );
};

const EnhancedScene: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const frames = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, frames - 1));
  const text = localText(scene);
  const family = clean(scene.v9Blueprint?.sceneFamily);

  if (family === 'geographic-route') return <RouteScene scene={scene} progress={progress} />;
  if (family === 'environmental-reconstruction' && /mountain|desert|terrain|water|passage|geograph/.test(text)) return <TerrainScene scene={scene} progress={progress} />;
  if (family === 'archival-evidence' && /paper|manuscript|religion|story|knowledge|idea|archive|document/.test(text)) return <ArchiveIdeasScene scene={scene} progress={progress} />;
  if (family === 'hazard-operation' && /war|blocked|blockage|break|redirect|danger|tax|empire|protect|fight/.test(text)) {
    if (/tax|empire|protect|soldier|checkpoint|fought/.test(text)) return <CheckpointScene scene={scene} progress={progress} />;
    return <HazardRouteScene scene={scene} progress={progress} />;
  }
  if (family === 'human-reconstruction') {
    if (/ship|port|harbou?r|sea route|maritime|vessel|aircraft/.test(text)) return <MaritimeScene scene={scene} progress={progress} />;
    if (/oasis city|city gate|relay hub|samarkand|city became|cities became/.test(text)) return <CityRelayScene scene={scene} progress={progress} />;
    if (/tax|empire|soldier|checkpoint|fort/.test(text)) return <CheckpointScene scene={scene} progress={progress} />;
    if (/caravan|camel|merchant journey|desert crossing|mountain pass/.test(text)) return <CaravanScene scene={scene} progress={progress} />;
  }

  return null;
};

const OverlayScene: React.FC<{scene: Scene}> = ({scene}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <EnhancedScene scene={scene} />
  </AbsoluteFill>
);

export const V9SemanticRepresentationalOverlay: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {plan.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
        premountFor={20}
      >
        <OverlayScene scene={scene} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
