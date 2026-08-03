import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {FactoryPlanSchema, type ScenePlan} from './schema';

const plan = FactoryPlanSchema.parse(planJson);
const P = plan.palette;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const reveal = (progress: number, at: number, width = 0.2) => clamp((progress - at) / width);

const Stars: React.FC = () => (
  <g opacity="0.8">
    {Array.from({length: 42}, (_, index) => {
      const x = (index * 137 + 41) % 760;
      const y = (index * 83 + 29) % 760;
      const radius = 1.5 + (index % 4) * 0.8;
      return <circle key={index} cx={x} cy={y} r={radius} fill={index % 5 === 0 ? P.gold : '#f2ead8'} />;
    })}
  </g>
);

const WarpedGrid: React.FC<{progress: number; cx?: number; cy?: number}> = ({progress, cx = 380, cy = 355}) => (
  <g opacity={0.25 + progress * 0.5}>
    {[-180,-120,-60,0,60,120,180].map((offset) => (
      <path
        key={`h-${offset}`}
        d={`M45 ${cy + offset} C205 ${cy + offset - 12 - Math.abs(offset) * 0.08} ${cx - 115} ${cy + offset * 0.34} ${cx} ${cy + offset * 0.28} C${cx + 115} ${cy + offset * 0.34} 555 ${cy + offset - 12 - Math.abs(offset) * 0.08} 715 ${cy + offset}`}
        fill="none"
        stroke={offset === 0 ? P.gold : P.blue}
        strokeWidth={offset === 0 ? 7 : 4}
      />
    ))}
    {[-180,-120,-60,0,60,120,180].map((offset) => (
      <path
        key={`v-${offset}`}
        d={`M${cx + offset} 40 C${cx + offset - 12 - Math.abs(offset) * 0.08} 205 ${cx + offset * 0.34} ${cy - 115} ${cx + offset * 0.28} ${cy} C${cx + offset * 0.34} ${cy + 115} ${cx + offset - 12 - Math.abs(offset) * 0.08} 555 ${cx + offset} 720`}
        fill="none"
        stroke={offset === 0 ? P.red : P.teal}
        strokeWidth={offset === 0 ? 7 : 4}
      />
    ))}
  </g>
);

const BlackHole: React.FC<{x: number; y: number; scale?: number; progress: number}> = ({x, y, scale = 1, progress}) => {
  const spin = progress * 160;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse rx="125" ry="38" fill="none" stroke={P.gold} strokeWidth="17" transform={`rotate(${spin - 18})`} opacity="0.82" />
      <ellipse rx="112" ry="31" fill="none" stroke={P.red} strokeWidth="10" transform={`rotate(${-spin * 0.55 + 19})`} opacity="0.76" />
      <circle r="78" fill="#05070c" stroke="#d8c99d" strokeWidth="7" />
      <circle r="91" fill="none" stroke={P.blue} strokeWidth="7" strokeDasharray="14 9" opacity="0.78" />
      <circle cx="-28" cy="-24" r="12" fill="#ffffff" opacity={0.14 + progress * 0.18} />
    </g>
  );
};

const Clock: React.FC<{x: number; y: number; scale?: number; progress: number; slow?: boolean}> = ({x, y, scale = 1, progress, slow = false}) => {
  const angle = (slow ? progress * 55 : progress * 230) - 90;
  const radians = angle * Math.PI / 180;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle r="70" fill="#eadfbe" stroke={P.ink} strokeWidth="9" />
      {Array.from({length: 12}, (_, index) => {
        const a = index * Math.PI / 6;
        return <line key={index} x1={Math.cos(a) * 53} y1={Math.sin(a) * 53} x2={Math.cos(a) * 62} y2={Math.sin(a) * 62} stroke={P.ink} strokeWidth="5" />;
      })}
      <line x1="0" y1="0" x2={Math.cos(radians) * 46} y2={Math.sin(radians) * 46} stroke={slow ? P.red : P.teal} strokeWidth="8" strokeLinecap="round" />
      <line x1="0" y1="0" x2="-18" y2="28" stroke={P.ink} strokeWidth="7" strokeLinecap="round" />
      <circle r="7" fill={P.ink} />
    </g>
  );
};

const Photon: React.FC<{progress: number}> = ({progress}) => {
  const x = interpolate(progress, [0, 1], [170, 650]);
  const y = 335 - Math.sin(progress * Math.PI * 3) * 42;
  return (
    <g>
      <path d="M150 335 C250 260 330 420 430 335 C520 260 600 405 680 335" fill="none" stroke={P.gold} strokeWidth="10" strokeDasharray="18 10" opacity="0.5" />
      <circle cx={x} cy={y} r="18" fill={progress > 0.58 ? P.red : '#f0d46b'} stroke={P.ink} strokeWidth="6" />
    </g>
  );
};

const Traveler: React.FC<{x: number; y: number; progress: number}> = ({x, y, progress}) => (
  <g transform={`translate(${x} ${y}) rotate(${progress * 16 - 8})`}>
    <circle cy="-48" r="24" fill="#e8dab7" stroke={P.ink} strokeWidth="7" />
    <rect x="-30" y="-22" width="60" height="88" rx="20" fill={P.teal} stroke={P.ink} strokeWidth="8" />
    <path d="M-22 18 L-65 55 M22 18 L66 55 M-18 64 L-42 112 M18 64 L44 112" fill="none" stroke={P.ink} strokeWidth="10" strokeLinecap="round" />
    <rect x="-20" y="-5" width="40" height="30" rx="6" fill={P.blue} stroke={P.ink} strokeWidth="5" />
  </g>
);

const SceneArt: React.FC<{scene: ScenePlan; progress: number}> = ({scene, progress}) => {
  const variant = (scene.id - 1) % 10;
  const a = reveal(progress, 0.03, 0.2);
  const b = reveal(progress, 0.24, 0.25);
  const c = reveal(progress, 0.52, 0.28);

  if (variant === 0) return <><WarpedGrid progress={a} /><BlackHole x={380} y={365} scale={0.94} progress={progress} /><Clock x={640} y={155} scale={0.58} progress={progress} slow /></>;
  if (variant === 1) return <><WarpedGrid progress={a * 0.7} /><Clock x={210} y={360} scale={1.05} progress={progress} /><Clock x={560} y={360} scale={1.05} progress={progress} slow /><path d="M290 360 H480" stroke={P.gold} strokeWidth="12" strokeDasharray="18 10" opacity={b} /></>;
  if (variant === 2) return <><circle cx="210" cy="360" r={105 - b * 38} fill={P.gold} stroke={P.ink} strokeWidth="10" /><path d="M310 360 H440" stroke={P.red} strokeWidth="14" /><polygon points="460,360 420,332 420,388" fill={P.red} /><BlackHole x={570} y={360} scale={0.72} progress={progress} /></>;
  if (variant === 3) return <><WarpedGrid progress={a} /><BlackHole x={380} y={365} scale={0.78 + b * 0.12} progress={progress} /><circle cx="380" cy="365" r={180 + c * 30} fill="none" stroke={P.red} strokeWidth="8" strokeDasharray="20 12" opacity={c} /></>;
  if (variant === 4) return <><BlackHole x={575} y={380} scale={0.82} progress={progress} /><Clock x={interpolate(b, [0,1], [185,455])} y={350} scale={0.82} progress={progress} slow /><path d="M160 520 C310 470 430 430 520 405" fill="none" stroke={P.gold} strokeWidth="10" strokeDasharray="16 10" /></>;
  if (variant === 5) return <><BlackHole x={175} y={380} scale={0.62} progress={progress} /><Photon progress={b} /><path d="M210 510 H650" stroke={P.blue} strokeWidth="18" opacity="0.25" /><path d={`M210 510 H${410 + c * 240}`} stroke={P.red} strokeWidth="18" /></>;
  if (variant === 6) return <><BlackHole x={560} y={375} scale={0.82} progress={progress} /><Traveler x={interpolate(b, [0,1], [180,475])} y={365} progress={progress} /><Clock x={180} y={590} scale={0.52} progress={progress} /></>;
  if (variant === 7) return <><WarpedGrid progress={a * 0.65} /><path d="M150 620 C240 510 260 260 360 145" fill="none" stroke={P.teal} strokeWidth="15" /><path d="M610 620 C520 510 500 260 400 145" fill="none" stroke={P.red} strokeWidth="15" /><Clock x={165} y={610} scale={0.48} progress={progress} /><Clock x={595} y={610} scale={0.48} progress={progress} slow /></>;
  if (variant === 8) return <><Clock x={205} y={350} scale={1.05} progress={progress} /><Clock x={555} y={350} scale={1.05} progress={progress} slow /><path d={`M205 520 C310 ${510-c*80} 450 ${590-c*120} 555 520`} fill="none" stroke={P.red} strokeWidth="12" strokeDasharray="16 10" /></>;
  return <><WarpedGrid progress={a} /><BlackHole x={380} y={360} scale={0.9} progress={progress} /><Clock x={170} y={585} scale={0.48} progress={progress} /><Clock x={590} y={585} scale={0.48} progress={progress} slow /><path d="M235 560 C300 500 330 475 350 445 M525 560 C460 500 430 475 410 445" fill="none" stroke={P.gold} strokeWidth="9" /></>;
};

const BlackHoleScene: React.FC<{scene: ScenePlan}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, total - 1));
  const intro = spring({frame, fps, config: {damping: 18, stiffness: 105, mass: 0.85}});
  return (
    <div style={{position:'absolute',left:159,top:364,width:760,height:760,overflow:'hidden',background:'radial-gradient(circle at 50% 48%,#253248 0%,#111a29 48%,#070b12 100%)',opacity:intro}}>
      <svg width="760" height="760" viewBox="0 0 760 760">
        <Stars />
        <SceneArt scene={scene} progress={progress} />
      </svg>
      <div style={{position:'absolute',left:22,right:22,bottom:18,height:7,background:'rgba(235,219,180,.18)',overflow:'hidden'}}>
        <div style={{height:'100%',width:`${progress * 100}%`,background:P.gold}} />
      </div>
    </div>
  );
};

export const BlackHoleSceneOverlay: React.FC = () => {
  if (plan.topicProfile?.visualWorld !== 'black-hole-spacetime') return null;
  return (
    <AbsoluteFill style={{pointerEvents:'none'}}>
      {plan.scenes.map((scene) => (
        <Sequence key={`black-hole-${scene.id}`} from={Math.round(scene.start * plan.fps)} durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}>
          <BlackHoleScene scene={scene} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
