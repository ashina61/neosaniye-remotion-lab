import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import type {FactoryPlan, ScenePlan} from './schema';

type Palette = {bg: string; surface: string; ink: string; primary: string; secondary: string; highlight: string; muted: string};
type VisualDirection = {sceneMode: string; composition: string; environment: string; subject: string; supportingSubjects: string[]};
type VisualContract = {version: 8; style: {palette: Palette}; visualDirection: VisualDirection};
type MotionContract = {
  version: 8;
  cameraMove: string;
  heroPath: {from: string; to: string; curve: string};
  choreography: Array<{layerId: string; start: number; end: number}>;
  emphasisMoments: Array<{at: number; strength: number}>;
};
type Scene = ScenePlan & {visualContract?: VisualContract; motionContract?: MotionContract};
type Plan = Omit<FactoryPlan, 'scenes'> & {scenes: Scene[]; storyDirector?: {id?: string}};

const plan = planJson as unknown as Plan;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {const v = clamp(value); return v * v * (3 - 2 * v);};
const phase = (value: number, start: number, end: number) => smooth((value - start) / Math.max(0.001, end - start));
const alpha = (hex: string, opacity: number) => `${hex}${Math.round(clamp(opacity) * 255).toString(16).padStart(2, '0')}`;
const cue = (motion: MotionContract, layer: string, progress: number, fallback: [number, number]) => {
  const item = motion.choreography.find((entry) => entry.layerId === layer);
  return phase(progress, item?.start ?? fallback[0], item?.end ?? fallback[1]);
};

const StageShell: React.FC<{palette: Palette; children: React.ReactNode; glow?: boolean}> = ({palette, children, glow = false}) => (
  <AbsoluteFill style={{overflow: 'hidden', background: `linear-gradient(180deg, ${palette.bg}, ${alpha(palette.secondary, 0.58)} 48%, ${palette.muted})`}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at 52% 38%, ${alpha(glow ? palette.highlight : palette.secondary, glow ? 0.2 : 0.11)}, transparent 48%)`}} />
    {children}
    <AbsoluteFill style={{boxShadow: 'inset 0 0 100px rgba(0,0,0,.48)', pointerEvents: 'none'}} />
  </AbsoluteFill>
);

const SeaLayers: React.FC<{palette: Palette; progress: number; horizon?: number}> = ({palette, progress, horizon = 220}) => (
  <>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: horizon, background: `linear-gradient(180deg, ${alpha(palette.surface, 0.34)}, ${alpha(palette.secondary, 0.5)})`}} />
    <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
      <path d={`M0 ${horizon} C120 ${horizon - 20} 230 ${horizon + 24} 355 ${horizon} S610 ${horizon - 22} 760 ${horizon + 4} S910 ${horizon + 20} 1000 ${horizon - 2}`} fill="none" stroke={alpha(palette.surface, 0.78)} strokeWidth="7" />
      <path d="M0 770 C160 700 315 790 470 730 S760 680 1000 745 L1000 900 L0 900 Z" fill={palette.ink} opacity=".7" />
      <path d="M0 815 C210 745 360 835 545 775 S815 740 1000 800 L1000 900 L0 900 Z" fill={palette.muted} opacity=".9" />
    </svg>
    {Array.from({length: 20}).map((_, index) => <span key={index} style={{position: 'absolute', left: `${4 + index * 5.2}%`, bottom: 50 + (index % 5) * 15, width: 8 + (index % 3) * 5, height: 5 + (index % 2) * 4, borderRadius: '50%', background: index % 2 ? palette.surface : palette.primary, opacity: 0.22, transform: `translateX(${Math.sin(progress * Math.PI + index) * 7}px)`}} />)}
  </>
);

const UnderseaCable: React.FC<{palette: Palette; progress: number; y?: number; armored?: boolean; pulse?: boolean}> = ({palette, progress, y = 720, armored = false, pulse = false}) => {
  const pulseX = interpolate(progress, [0.18, 0.86], [40, 960], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
    <path d={`M-70 ${y} C120 ${y - 80} 270 ${y + 42} 440 ${y - 16} S720 ${y - 92} 1070 ${y - 5}`} fill="none" stroke="#020406" strokeWidth={armored ? 42 : 32} strokeLinecap="round" />
    <path d={`M-70 ${y} C120 ${y - 80} 270 ${y + 42} 440 ${y - 16} S720 ${y - 92} 1070 ${y - 5}`} fill="none" stroke={armored ? palette.surface : palette.primary} strokeWidth={armored ? 27 : 21} strokeLinecap="round" />
    <path d={`M-70 ${y} C120 ${y - 80} 270 ${y + 42} 440 ${y - 16} S720 ${y - 92} 1070 ${y - 5}`} fill="none" stroke={palette.highlight} strokeWidth={armored ? 8 : 7} strokeLinecap="round" strokeDasharray={armored ? '10 12' : undefined} strokeDashoffset={armored ? 360 * (1 - progress) : undefined} />
    {pulse ? <circle cx={pulseX} cy={y - 28 + Math.sin(progress * Math.PI * 4) * 10} r="17" fill={palette.highlight} style={{filter: `drop-shadow(0 0 18px ${palette.highlight})`}} /> : null}
  </svg>;
};

const DetailedShip: React.FC<{palette: Palette; progress: number; repair?: boolean}> = ({palette, progress, repair = false}) => {
  const drift = Math.sin(progress * Math.PI * 2) * 7;
  return <div style={{position: 'absolute', left: 175 + drift, top: 90, width: 650, height: 250}}>
    <svg width="100%" height="100%" viewBox="0 0 650 250">
      <defs>
        <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={palette.surface}/><stop offset="1" stopColor={palette.muted}/></linearGradient>
      </defs>
      <path d="M35 115 L560 115 L625 155 L590 213 L100 213 L48 178 Z" fill="url(#hull)" stroke={palette.ink} strokeWidth="9" />
      <path d="M100 213 L590 213 L570 238 L125 238 Z" fill={palette.primary} stroke={palette.ink} strokeWidth="7" />
      <rect x="235" y="52" width="185" height="70" rx="8" fill={palette.surface} stroke={palette.ink} strokeWidth="8" />
      <rect x="270" y="70" width="42" height="25" fill={palette.secondary}/><rect x="326" y="70" width="42" height="25" fill={palette.secondary}/>
      <rect x="325" y="15" width="16" height="42" fill={palette.ink}/><path d="M333 17 L377 37" stroke={palette.highlight} strokeWidth="6" />
      <circle cx="145" cy="135" r="49" fill={palette.bg} stroke={palette.highlight} strokeWidth="12" /><circle cx="145" cy="135" r="18" fill={palette.primary}/>
      <circle cx="480" cy="139" r="34" fill={palette.bg} stroke={palette.secondary} strokeWidth="9" /><circle cx="480" cy="139" r="11" fill={palette.highlight}/>
      <path d={repair ? 'M520 122 L610 35 L622 42' : 'M180 118 L230 46 L245 48'} fill="none" stroke={palette.ink} strokeWidth="13" strokeLinecap="round" />
      <path d={repair ? 'M610 35 L600 168' : 'M230 46 L210 176'} fill="none" stroke={palette.highlight} strokeWidth="7" />
      {repair ? <><rect x="405" y="117" width="85" height="48" fill={palette.primary} stroke={palette.ink} strokeWidth="6"/><path d="M447 165 L447 218" stroke={palette.highlight} strokeWidth="8" /></> : null}
    </svg>
  </div>;
};

const PhysicalInternetScene: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => <StageShell palette={palette} glow>
  <SeaLayers palette={palette} progress={progress} horizon={155} />
  <UnderseaCable palette={palette} progress={progress} y={690} pulse />
  <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
    <path d="M20 100 C130 25 235 48 290 125 C220 180 115 195 35 155 Z" fill={alpha(palette.surface, 0.72)} stroke={palette.ink} strokeWidth="7" />
    <path d="M690 80 C790 20 950 55 985 155 C905 205 780 185 715 145 Z" fill={alpha(palette.surface, 0.72)} stroke={palette.ink} strokeWidth="7" />
    <path d="M155 142 C280 330 350 500 455 665" fill="none" stroke={palette.highlight} strokeWidth="8" strokeDasharray="13 12" strokeDashoffset={300 * (1 - progress)} />
    <path d="M850 145 C760 330 650 500 555 665" fill="none" stroke={palette.highlight} strokeWidth="8" strokeDasharray="13 12" strokeDashoffset={300 * (1 - progress)} />
    <circle cx="155" cy="142" r="18" fill={palette.primary} stroke={palette.ink} strokeWidth="6"/><circle cx="850" cy="145" r="18" fill={palette.primary} stroke={palette.ink} strokeWidth="6"/>
  </svg>
  <div style={{position: 'absolute', left: 275, top: 290, width: 450, padding: 22, background: alpha(palette.bg, 0.68), border: `2px solid ${alpha(palette.highlight, 0.6)}`, color: palette.surface, textAlign: 'center', fontFamily: 'Arial Black, Arial, sans-serif', fontSize: 28, letterSpacing: 1}}>PHYSICAL INFRASTRUCTURE BELOW THE OCEAN</div>
</StageShell>;

const CableShipScene: React.FC<{palette: Palette; progress: number; repair?: boolean}> = ({palette, progress, repair = false}) => <StageShell palette={palette} glow>
  <SeaLayers palette={palette} progress={progress} horizon={340} />
  <DetailedShip palette={palette} progress={progress} repair={repair} />
  <UnderseaCable palette={palette} progress={progress} y={755} />
  <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
    <path d={repair ? 'M780 220 C760 400 690 490 640 700 C610 820 420 785 455 690' : 'M400 250 C420 430 510 500 520 720'} fill="none" stroke={palette.highlight} strokeWidth="12" strokeLinecap="round" />
    {repair ? <><path d="M455 690 C400 610 360 615 325 715" fill="none" stroke={palette.surface} strokeWidth="25"/><circle cx="455" cy="690" r="25" fill={palette.primary} stroke={palette.ink} strokeWidth="8"/></> : <circle cx="520" cy="720" r="24" fill={palette.primary} stroke={palette.ink} strokeWidth="8" />}
  </svg>
  <div style={{position: 'absolute', left: 55, bottom: 42, display: 'flex', gap: 12}}>{(repair ? ['A-FRAME CRANE', 'CABLE LIFT', 'SPLICE DECK'] : ['CABLE DRUM', 'ROUTE SURVEY', 'CONTROLLED LAY']).map((label) => <span key={label} style={{padding: '9px 14px', background: alpha(palette.bg, 0.75), border: `2px solid ${palette.highlight}`, color: palette.surface, fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 17}}>{label}</span>)}</div>
</StageShell>;

const ExplodedCableScene: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => {
  const p = phase(progress, 0.08, 0.5);
  const layers = [
    {x: 125, size: 210, outer: palette.ink, inner: palette.muted, label: 'POLYETHYLENE SHEATH'},
    {x: 355, size: 170, outer: palette.surface, inner: palette.primary, label: 'STEEL STRENGTH WIRES'},
    {x: 555, size: 125, outer: palette.highlight, inner: palette.secondary, label: 'COPPER POWER TUBE'},
    {x: 725, size: 86, outer: palette.secondary, inner: palette.surface, label: 'OPTICAL FIBERS'},
  ];
  return <StageShell palette={palette} glow>
    <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
      <path d="M80 455 L920 455" stroke={alpha(palette.surface, 0.2)} strokeWidth="3" strokeDasharray="12 14" />
      {layers.map((layer, index) => <g key={layer.label} transform={`translate(${(1 - p) * (index - 1.5) * -100} 0)`} opacity={p}>
        <circle cx={layer.x} cy="455" r={layer.size / 2} fill={layer.outer} stroke={palette.bg} strokeWidth="9" />
        <circle cx={layer.x} cy="455" r={layer.size / 3.2} fill={layer.inner} stroke={palette.bg} strokeWidth="6" />
        {index === 1 ? Array.from({length: 10}).map((_, wire) => {const a = wire / 10 * Math.PI * 2; return <circle key={wire} cx={layer.x + Math.cos(a) * 58} cy={455 + Math.sin(a) * 58} r="12" fill={palette.highlight}/>;}) : null}
        {index === 3 ? Array.from({length: 6}).map((_, fiber) => {const a = fiber / 6 * Math.PI * 2; return <circle key={fiber} cx={layer.x + Math.cos(a) * 23} cy={455 + Math.sin(a) * 23} r="8" fill={[palette.primary,palette.highlight,palette.secondary][fiber % 3]}/>;}) : null}
        <path d={`M${layer.x} ${455 + layer.size / 2 + 15} L${layer.x} 700`} stroke={palette.surface} strokeWidth="4" opacity=".55" />
      </g>)}
    </svg>
    <div style={{position: 'absolute', left: 55, right: 55, bottom: 40, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12}}>{layers.map((layer) => <div key={layer.label} style={{color: palette.surface, fontFamily: 'Arial, sans-serif', fontWeight: 800, fontSize: 15, borderTop: `3px solid ${layer.inner}`, paddingTop: 8}}>{layer.label}</div>)}</div>
  </StageShell>;
};

const LightEncodingScene: React.FC<{palette: Palette; progress: number; reflection?: boolean}> = ({palette, progress, reflection = false}) => {
  const p = phase(progress, 0.12, 0.72);
  const pulseX = interpolate(progress, [0.22, 0.85], [260, 895], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <StageShell palette={palette} glow>
    {!reflection ? <>
      <div style={{position: 'absolute', left: 60, top: 285, width: 190, height: 230, borderRadius: 20, background: `linear-gradient(145deg, ${palette.surface}, ${palette.muted})`, border: `9px solid ${palette.ink}`, boxShadow: `0 18px 42px ${alpha(palette.bg, 0.6)}`}}><div style={{position: 'absolute', left: 45, top: 55, width: 100, height: 54, background: palette.bg, border: `6px solid ${palette.ink}`}} /><div style={{position: 'absolute', left: 82, top: 128, width: 28, height: 28, borderRadius: 99, background: palette.highlight, boxShadow: `0 0 26px ${palette.highlight}`}} /></div>
      <div style={{position: 'absolute', left: 75, top: 220, color: palette.surface, fontFamily: 'Courier New, monospace', fontWeight: 900, fontSize: 23}}>101101001011</div>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}><rect x="230" y="370" width="720" height="100" rx="50" fill={alpha(palette.surface, 0.22)} stroke={palette.surface} strokeWidth="10"/><rect x="245" y="392" width="690" height="56" rx="28" fill={alpha(palette.secondary, 0.4)} stroke={palette.highlight} strokeWidth="5"/><circle cx={pulseX} cy="420" r="20" fill={palette.highlight} style={{filter:`drop-shadow(0 0 20px ${palette.highlight})`}}/>{Array.from({length:6}).map((_,index)=><circle key={index} cx={315+index*100} cy="420" r="10" fill={index%2?palette.primary:palette.highlight} opacity={phase(progress,0.18+index*.07,0.32+index*.07)}/>)}</svg>
    </> : <>
      <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position: 'absolute', inset: 0}}>
        <rect x="90" y="260" width="820" height="360" rx="55" fill={alpha(palette.surface,0.15)} stroke={palette.surface} strokeWidth="12"/>
        <rect x="120" y="300" width="760" height="280" rx="40" fill={alpha(palette.secondary,0.3)} stroke={palette.highlight} strokeWidth="6"/>
        <path d="M145 500 L250 330 L360 550 L470 330 L580 550 L690 330 L840 500" fill="none" stroke={palette.highlight} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="900" strokeDashoffset={900*(1-p)} style={{filter:`drop-shadow(0 0 15px ${palette.highlight})`}}/>
        {[250,360,470,580,690].map((x,index)=><circle key={x} cx={x} cy={index%2===0?330:550} r="17" fill={palette.primary} stroke={palette.surface} strokeWidth="5" opacity={p}/>) }
      </svg>
      <div style={{position:'absolute',left:105,top:180,color:palette.surface,fontFamily:'Arial Black, Arial, sans-serif',fontSize:28}}>TOTAL INTERNAL REFLECTION</div>
    </>}
    <div style={{position:'absolute',right:55,bottom:38,color:palette.surface,fontFamily:'Courier New, monospace',fontSize:17,opacity:.7}}>{reflection?'LIGHT REMAINS INSIDE THE GLASS CORE':'DIGITAL BITS → OPTICAL PULSES'}</div>
  </StageShell>;
};

const RepeaterScene: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => <StageShell palette={palette} glow>
  <SeaLayers palette={palette} progress={progress} horizon={80} />
  <UnderseaCable palette={palette} progress={progress} y={600} pulse />
  {Array.from({length:4}).map((_,index)=><div key={index} style={{position:'absolute',left:95+index*225,top:480+Math.sin(index)*25,width:155,height:70,borderRadius:38,background:`linear-gradient(180deg,${palette.surface},${palette.muted})`,border:`8px solid ${palette.ink}`,boxShadow:`0 0 ${20+phase(progress,.15+index*.1,.35+index*.1)*35}px ${alpha(palette.highlight,.65)}`,opacity:phase(progress,.12+index*.1,.32+index*.1)}}><div style={{position:'absolute',left:20,right:20,top:24,height:12,borderRadius:8,background:palette.primary}}/><div style={{position:'absolute',left:66,top:-17,width:24,height:24,borderRadius:99,background:palette.highlight,boxShadow:`0 0 18px ${palette.highlight}`}}/></div>)}
  <div style={{position:'absolute',left:90,top:145,right:90,textAlign:'center',color:palette.surface,fontFamily:'Arial Black, Arial, sans-serif',fontSize:30}}>REPEATERS RESTORE WEAKENING OPTICAL SIGNALS</div>
</StageShell>;

const LandingStationScene: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => <StageShell palette={palette} glow>
  <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position:'absolute',inset:0}}>
    <path d="M0 0 H525 V900 H0 Z" fill={alpha(palette.secondary,.55)}/><path d="M490 0 H1000 V900 H490 C575 650 570 280 490 0 Z" fill={alpha(palette.surface,.3)}/>
    <path d="M0 690 C190 620 330 720 520 640" fill="none" stroke={palette.ink} strokeWidth="34"/><path d="M0 690 C190 620 330 720 520 640" fill="none" stroke={palette.highlight} strokeWidth="10"/>
    <path d="M520 640 C640 570 675 520 735 455" fill="none" stroke={palette.highlight} strokeWidth="11" strokeDasharray="16 12" strokeDashoffset={380*(1-progress)}/>
  </svg>
  <div style={{position:'absolute',right:80,top:220,width:330,height:310,background:`linear-gradient(145deg,${palette.surface},${palette.muted})`,border:`9px solid ${palette.ink}`,boxShadow:`25px 28px 0 ${alpha(palette.primary,.3)}`}}><div style={{position:'absolute',left:45,right:45,top:55,height:28,background:palette.primary}}/><div style={{position:'absolute',left:45,right:45,top:115,height:28,background:palette.secondary}}/><div style={{position:'absolute',left:45,right:45,top:175,height:28,background:palette.highlight}}/><div style={{position:'absolute',left:118,bottom:-70,width:90,height:75,background:palette.ink}}/></div>
  <div style={{position:'absolute',left:60,top:110,color:palette.surface,fontFamily:'Arial Black, Arial, sans-serif',fontSize:30}}>SEA CABLE</div><div style={{position:'absolute',right:65,top:130,color:palette.ink,fontFamily:'Arial Black, Arial, sans-serif',fontSize:29}}>LANDING STATION</div>
</StageShell>;

const AnchorHazardScene: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => <StageShell palette={palette} glow>
  <SeaLayers palette={palette} progress={progress} horizon={250} />
  <UnderseaCable palette={palette} progress={progress} y={735} armored />
  <div style={{position:'absolute',left:155,top:82,width:420,height:130}}><svg width="100%" height="100%" viewBox="0 0 420 130"><path d="M15 40 H360 L410 72 L380 112 H70 L30 90 Z" fill={palette.surface} stroke={palette.ink} strokeWidth="8"/><rect x="170" y="0" width="95" height="48" fill={palette.muted} stroke={palette.ink} strokeWidth="7"/></svg></div>
  <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position:'absolute',inset:0}}><path d="M360 190 C380 345 340 470 355 610" fill="none" stroke={palette.ink} strokeWidth="10"/><path d="M355 610 L355 690" stroke={palette.ink} strokeWidth="13"/><path d="M300 680 C300 735 410 735 410 680" fill="none" stroke={palette.primary} strokeWidth="20"/><path d="M355 610 L315 650 M355 610 L395 650" stroke={palette.primary} strokeWidth="15"/><circle cx="470" cy="730" r="55" fill={alpha(palette.primary,.22)} stroke={palette.primary} strokeWidth="7" opacity={phase(progress,.35,.65)}/></svg>
  <div style={{position:'absolute',right:55,top:310,width:280,padding:18,background:alpha(palette.bg,.72),border:`3px solid ${palette.primary}`,color:palette.surface,fontFamily:'Arial Black, Arial, sans-serif',fontSize:24}}>ARMORED SHORE SECTION</div>
</StageShell>;

const RedundantRoutesScene: React.FC<{palette: Palette; progress: number}> = ({palette, progress}) => {
  const p = phase(progress,.08,.72);
  return <StageShell palette={palette} glow>
    <svg width="100%" height="100%" viewBox="0 0 1000 900" style={{position:'absolute',inset:0}}>
      <path d="M45 250 C115 95 275 95 335 210 C285 315 170 390 65 340 Z" fill={alpha(palette.surface,.23)} stroke={palette.secondary} strokeWidth="8"/>
      <path d="M590 145 C740 60 950 145 930 330 C870 420 785 470 730 610 C635 690 545 600 550 465 C555 340 520 230 590 145 Z" fill={alpha(palette.surface,.23)} stroke={palette.primary} strokeWidth="8"/>
      <path d="M175 300 C360 180 565 260 790 300" fill="none" stroke={palette.primary} strokeWidth="9" strokeDasharray="14 12" strokeDashoffset={700*(1-p)}/>
      <path d="M175 335 C350 480 560 450 805 340" fill="none" stroke={palette.highlight} strokeWidth="12" strokeDasharray="18 12" strokeDashoffset={760*(1-p)} style={{filter:`drop-shadow(0 0 10px ${palette.highlight})`}}/>
      <path d="M180 365 C330 610 620 650 825 380" fill="none" stroke={palette.secondary} strokeWidth="8" strokeDasharray="12 14" strokeDashoffset={820*(1-p)}/>
      <path d="M485 245 L525 315 M525 245 L485 315" stroke={palette.primary} strokeWidth="18" opacity={phase(progress,.45,.6)}/>
      {[{x:175,y:320},{x:805,y:330},{x:175,y:365},{x:825,y:380}].map((node,index)=><circle key={index} cx={node.x} cy={node.y} r="20" fill={index%2?palette.highlight:palette.primary} stroke={palette.ink} strokeWidth="6"/>)}
    </svg>
    <div style={{position:'absolute',left:80,top:90,color:palette.surface,fontFamily:'Arial Black, Arial, sans-serif',fontSize:31}}>ONE ROUTE FAILS</div><div style={{position:'absolute',right:65,bottom:65,color:palette.highlight,fontFamily:'Arial Black, Arial, sans-serif',fontSize:30}}>TRAFFIC MOVES TO ALTERNATE CABLES</div>
  </StageShell>;
};

const OverlayScene: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const visual = scene.visualContract;
  const motion = scene.motionContract;
  if (!visual || visual.version !== 8 || !motion || motion.version !== 8) return null;
  const frames = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, frames - 1));
  const hero = cue(motion, 'hero', progress, [0.04, 0.35]);
  const palette = visual.style.palette;
  const composition = visual.visualDirection.composition;
  const text = `${scene.title} ${scene.voiceLine}`.toLowerCase();
  let content: React.ReactNode = null;
  if (composition === 'foreground-hero') content = <PhysicalInternetScene palette={palette} progress={progress} />;
  else if (composition === 'cable-ship-operation') content = <CableShipScene palette={palette} progress={progress} />;
  else if (composition === 'repair-ship-operation') content = <CableShipScene palette={palette} progress={progress} repair />;
  else if (composition === 'exploded-axis') content = <ExplodedCableScene palette={palette} progress={progress} />;
  else if (composition === 'signal-through-core') content = <LightEncodingScene palette={palette} progress={progress} reflection={/reflection|stays inside|glass core/.test(text)} />;
  else if (composition === 'repeater-line') content = <RepeaterScene palette={palette} progress={progress} />;
  else if (composition === 'shore-landing-station') content = <LandingStationScene palette={palette} progress={progress} />;
  else if (composition === 'anchor-hazard') content = <AnchorHazardScene palette={palette} progress={progress} />;
  else if (composition === 'redundant-route-map') content = <RedundantRoutesScene palette={palette} progress={progress} />;
  if (!content) return null;
  return <div style={{position: 'absolute', left: 28, right: 28, top: 292, bottom: 205, overflow: 'hidden', opacity: hero, transform: `scale(${0.985 + hero * 0.015})`, boxShadow: `0 28px 70px ${alpha(palette.bg, 0.7)}`}}>{content}</div>;
};

export const V8RepresentationalOverlay: React.FC = () => {
  if (plan.storyDirector?.id !== 'undersea-cable-mechanism-v1') return null;
  return <AbsoluteFill style={{pointerEvents: 'none'}}>
    {plan.scenes.map((scene) => <Sequence key={scene.id} from={Math.round(scene.start * plan.fps)} durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))} premountFor={20}><OverlayScene scene={scene} /></Sequence>)}
  </AbsoluteFill>;
};
