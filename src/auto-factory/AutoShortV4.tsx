import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {FactoryPlanSchema, type ScenePlan} from './schema';

const plan = FactoryPlanSchema.parse(planJson);

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const enter = (progress: number, at: number, width = 0.16) => clamp((progress - at) / width);
const words = (value: string) => value.trim().split(/\s+/).filter(Boolean);
const short = (value: string, max = 34) => value.length <= max ? value : `${value.slice(0, max - 1).trim()}…`;

const fallbackGrammar = (scene: ScenePlan, index: number) => {
  const byKind: Record<string, ScenePlan['sceneGrammar']> = {
    'microbe-field': 'macro-field',
    biology: 'macro-field',
    'selection-process': 'selection-field',
    'gene-transfer': 'mechanism-cutaway',
    'object-exploded': 'exploded-object',
    mechanism: 'mechanism-cutaway',
    'before-after': 'comparison-scale',
    comparison: 'comparison-scale',
    timeline: 'timeline-strip',
    document: 'evidence-board',
    'evidence-board': 'evidence-board',
    'map-route': 'map-route',
    'map-evolution': 'map-route',
    'world-network': 'spread-network',
    'process-flow': 'cause-chain',
    'cause-effect': 'cause-chain',
  };
  const sequence: ScenePlan['sceneGrammar'][] = [
    'hero-poster', 'macro-field', 'mechanism-cutaway', 'cause-chain', 'exploded-object',
    'timeline-strip', 'comparison-scale', 'map-route', 'spread-network', 'evidence-board',
  ];
  return scene.sceneGrammar ?? byKind[scene.visualKind] ?? sequence[index % sequence.length];
};

type Art = {
  paper: string;
  ink: string;
  primary: string;
  secondary: string;
  highlight: string;
};

const artFor = (scene: ScenePlan): Art => {
  const palette = scene.artDirection?.palette;
  return {
    paper: palette?.paper ?? plan.palette.paper,
    ink: palette?.ink ?? plan.palette.ink,
    primary: palette?.primary ?? plan.palette.red,
    secondary: palette?.secondary ?? plan.palette.teal,
    highlight: palette?.highlight ?? plan.palette.gold,
  };
};

const Grain: React.FC<{ink: string}> = ({ink}) => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          opacity: 0.13,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27120%27 height=%27120%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.78%27 numOctaves=%272%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25 filter=%27url(%23n)%27 opacity=%27.48%27/%3E%3C/svg%3E")',
          backgroundPosition: `${frame % 17}px ${frame % 13}px`,
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: `radial-gradient(circle at 48% 42%, transparent 45%, ${ink}55 120%)`,
        }}
      />
    </>
  );
};

const Torn: React.FC<React.PropsWithChildren<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  background: string;
  border?: string;
  shadow?: boolean;
  opacity?: number;
}>> = ({x, y, w, h, rotate = 0, background, border, shadow = true, opacity = 1, children}) => (
  <div
    style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      background, border: border ? `5px solid ${border}` : undefined,
      boxShadow: shadow ? '18px 22px 0 rgba(17,14,12,.22)' : undefined,
      clipPath: 'polygon(2% 1%, 97% 0, 100% 7%, 98% 96%, 93% 100%, 4% 98%, 0 91%, 1% 8%)',
      transform: `rotate(${rotate}deg)`, opacity, overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const Tape: React.FC<{x: number; y: number; rotate?: number; color: string; width?: number}> = ({x, y, rotate = 0, color, width = 170}) => (
  <div style={{position: 'absolute', left: x, top: y, width, height: 42, background: `${color}bb`, transform: `rotate(${rotate}deg)`, clipPath: 'polygon(3% 3%,98% 0,95% 96%,0 100%)', opacity: 0.78}} />
);

const Label: React.FC<{text: string; x: number; y: number; color: string; ink: string; rotate?: number; size?: number; width?: number; opacity?: number}> = ({text, x, y, color, ink, rotate = 0, size = 27, width = 360, opacity = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width, padding: '13px 18px 11px', background: color, color: ink, border: `4px solid ${ink}`, fontFamily: 'Arial, sans-serif', fontWeight: 950, fontSize: size, lineHeight: 0.98, letterSpacing: 0.3, transform: `rotate(${rotate}deg)`, boxShadow: `8px 10px 0 ${ink}2d`, opacity}}>
    {text}
  </div>
);

const BigWord: React.FC<{text: string; art: Art; x?: number; y?: number; rotate?: number; opacity?: number; size?: number}> = ({text, art, x = 40, y = 160, rotate = -5, opacity = 0.12, size = 154}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 1040, color: art.ink, opacity, fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 1000, fontSize: size, lineHeight: 0.78, letterSpacing: -7, transform: `rotate(${rotate}deg)`, textTransform: 'uppercase'}}>
    {short(text, 22)}
  </div>
);

const SubjectGlyph: React.FC<{scene: ScenePlan; art: Art; progress: number; size?: number; variant?: number}> = ({scene, art, progress, size = 460, variant = 0}) => {
  const key = `${scene.visualWorld} ${scene.primaryMotif} ${scene.heroVisual}`.toLowerCase();
  const pulse = 1 + Math.sin(progress * Math.PI * 2) * 0.025;
  const reveal = enter(progress, 0.08, 0.3);
  const common = {width: size, height: size, viewBox: '0 0 500 500'};

  if (/bacter|microbe|cell|antibiotic|plasmid|dna|gene/.test(key)) {
    return (
      <svg {...common} style={{overflow: 'visible', transform: `scale(${pulse})`}}>
        <circle cx="250" cy="250" r="205" fill={`${art.secondary}18`} stroke={art.ink} strokeWidth="9" strokeDasharray="18 12" />
        {Array.from({length: 8}).map((_, index) => {
          const angle = (index / 8) * Math.PI * 2 + variant * 0.2;
          const radius = 72 + (index % 3) * 55;
          const x = 250 + Math.cos(angle) * radius;
          const y = 250 + Math.sin(angle) * radius;
          const resistant = index === (variant + 2) % 8;
          return (
            <g key={index} transform={`translate(${x} ${y}) rotate(${index * 19}) scale(${0.65 + reveal * 0.22})`} opacity={0.32 + reveal * 0.68}>
              <rect x="-48" y="-24" width="96" height="48" rx="24" fill={resistant ? art.primary : art.secondary} stroke={art.ink} strokeWidth="7" />
              {resistant ? <path d="M-12 -35 L0 -54 L12 -35 M-12 35 L0 54 L12 35" fill="none" stroke={art.highlight} strokeWidth="7" /> : null}
            </g>
          );
        })}
        {/dna|gene|plasmid/.test(key) ? (
          <g transform="translate(250 250)">
            <circle r={58 + reveal * 18} fill="none" stroke={art.highlight} strokeWidth="14" />
            <circle r={28 + reveal * 10} fill="none" stroke={art.ink} strokeWidth="7" />
          </g>
        ) : null}
      </svg>
    );
  }

  if (/black hole|space|planet|orbit|star|rocket/.test(key)) {
    return (
      <svg {...common} style={{overflow: 'visible', transform: `scale(${pulse})`}}>
        <defs>
          <radialGradient id={`bh-${scene.id}-${variant}`}>
            <stop offset="0" stopColor="#000" />
            <stop offset="48%" stopColor="#080808" />
            <stop offset="62%" stopColor={art.primary} />
            <stop offset="78%" stopColor={art.highlight} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle cx="250" cy="250" r={115 + reveal * 28} fill={`url(#bh-${scene.id}-${variant})`} />
        <ellipse cx="250" cy="250" rx="214" ry="80" fill="none" stroke={art.secondary} strokeWidth="8" transform={`rotate(${18 + progress * 10} 250 250)`} />
        <ellipse cx="250" cy="250" rx="185" ry="54" fill="none" stroke={art.highlight} strokeWidth="5" strokeDasharray="18 14" transform={`rotate(${-15 - progress * 8} 250 250)`} />
        {Array.from({length: 20}).map((_, index) => <circle key={index} cx={35 + ((index * 83) % 430)} cy={25 + ((index * 137) % 445)} r={index % 4 === 0 ? 4 : 2} fill={art.ink} opacity={0.35 + (index % 3) * 0.2} />)}
      </svg>
    );
  }

  if (/route|map|trade|silk|caravan|country|border|network/.test(key)) {
    return (
      <svg {...common} style={{overflow: 'visible'}}>
        <path d="M45 375 C120 270 170 340 225 235 C275 140 350 215 455 80" fill="none" stroke={art.primary} strokeWidth="15" strokeDasharray="25 16" pathLength="1" strokeDashoffset={1 - reveal} />
        {[{x:45,y:375},{x:145,y:292},{x:225,y:235},{x:325,y:180},{x:455,y:80}].map((point, index) => (
          <g key={index} transform={`translate(${point.x} ${point.y}) scale(${0.35 + reveal * 0.65})`}>
            <circle r={index === 2 ? 31 : 22} fill={index % 2 ? art.highlight : art.secondary} stroke={art.ink} strokeWidth="7" />
            <circle r={index === 2 ? 11 : 7} fill={art.ink} />
          </g>
        ))}
        <path d="M60 90 L150 55 L220 115 L310 58 L440 125 L405 420 L300 390 L190 440 L80 360 Z" fill={`${art.highlight}18`} stroke={art.ink} strokeWidth="7" strokeLinejoin="round" />
      </svg>
    );
  }

  if (/ai|neural|pixel|image|computer|digital|algorithm/.test(key)) {
    return (
      <svg {...common} style={{overflow: 'visible'}}>
        {Array.from({length: 64}).map((_, index) => {
          const x = 58 + (index % 8) * 50;
          const y = 58 + Math.floor(index / 8) * 50;
          const distance = Math.abs((index % 8) - 3.5) + Math.abs(Math.floor(index / 8) - 3.5);
          const active = reveal > distance / 11;
          return <rect key={index} x={x} y={y} width="38" height="38" fill={active ? (index % 3 === 0 ? art.primary : art.secondary) : `${art.ink}18`} stroke={art.ink} strokeWidth="3" />;
        })}
        <path d="M80 430 C150 345 200 400 250 310 C315 200 365 265 430 145" fill="none" stroke={art.highlight} strokeWidth="12" />
      </svg>
    );
  }

  return (
    <svg {...common} style={{overflow: 'visible', transform: `scale(${pulse})`}}>
      <polygon points="250,30 445,145 405,380 185,465 38,290 85,95" fill={`${art.secondary}45`} stroke={art.ink} strokeWidth="10" />
      <circle cx="250" cy="250" r={90 + reveal * 35} fill={art.primary} stroke={art.ink} strokeWidth="11" />
      <path d="M85 95 L250 250 L445 145 M38 290 L250 250 L185 465 M405 380 L250 250" stroke={art.highlight} strokeWidth="9" fill="none" strokeDasharray="14 10" />
    </svg>
  );
};

type GrammarProps = {scene: ScenePlan; art: Art; progress: number; index: number};

const HeroPoster: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const reveal = enter(progress, 0.08, 0.3);
  return (
    <AbsoluteFill>
      <BigWord text={scene.primaryMotif} art={art} x={-45} y={220} size={190} opacity={0.1} />
      <Torn x={88} y={245} w={905} h={1180} rotate={-2.5} background={`${art.paper}ee`} border={art.ink} opacity={reveal}>
        <div style={{position: 'absolute', right: -90, top: 160, transform: `rotate(-7deg) translateX(${(1 - reveal) * 170}px)`}}>
          <SubjectGlyph scene={scene} art={art} progress={progress} size={760} />
        </div>
        <div style={{position: 'absolute', left: 65, top: 70, width: 510, fontFamily: 'Arial Black, Arial', fontSize: 76, fontWeight: 1000, lineHeight: 0.88, color: art.ink, textTransform: 'uppercase'}}>{short(scene.title, 34)}</div>
        <div style={{position: 'absolute', left: 70, bottom: 85, width: 620, fontFamily: 'Georgia, serif', fontSize: 37, lineHeight: 1.08, color: art.ink}}>{short(scene.kicker || scene.primaryMotif, 62)}</div>
      </Torn>
      <Tape x={380} y={230} rotate={-5} color={art.highlight} width={260} />
    </AbsoluteFill>
  );
};

const MacroField: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const focus = enter(progress, 0.28, 0.28);
  return (
    <AbsoluteFill>
      <BigWord text={scene.kicker || scene.title} art={art} x={-10} y={90} size={126} opacity={0.08} rotate={-2} />
      {Array.from({length: 7}).map((_, index) => {
        const positions = [[-90,300],[390,230],[690,390],[60,770],[470,760],[-40,1210],[630,1190]];
        const [x, y] = positions[index];
        return <div key={index} style={{position: 'absolute', left: x, top: y, opacity: 0.36 + focus * (index === 4 ? 0.64 : 0.22), transform: `rotate(${index * 19 - 33}deg) scale(${index === 4 ? 1.15 : 0.72})`}}><SubjectGlyph scene={scene} art={art} progress={progress} size={390} variant={index} /></div>;
      })}
      <div style={{position: 'absolute', left: 365, top: 650, width: 500, height: 500, borderRadius: '50%', border: `18px solid ${art.ink}`, boxShadow: `0 0 0 22px ${art.paper}aa, 30px 35px 0 ${art.ink}2d`, transform: `scale(${0.65 + focus * 0.35})`}} />
      <Label text={short(scene.title, 32)} x={75} y={1420} color={art.primary} ink={art.paper} rotate={-2} size={37} width={630} opacity={enter(progress, 0.55, 0.22)} />
      <Label text={short(scene.secondaryMotif, 30)} x={690} y={1540} color={art.highlight} ink={art.ink} rotate={4} width={300} opacity={enter(progress, 0.66, 0.2)} />
    </AbsoluteFill>
  );
};

const SelectionField: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const eliminate = enter(progress, 0.34, 0.32);
  const survivor = enter(progress, 0.62, 0.2);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: '210px 70px 260px', border: `8px solid ${art.ink}`, background: `${art.paper}aa`, transform: 'rotate(-1deg)'}} />
      {Array.from({length: 12}).map((_, index) => {
        const x = 125 + (index % 3) * 315;
        const y = 330 + Math.floor(index / 3) * 270;
        const chosen = index === 7;
        return (
          <div key={index} style={{position: 'absolute', left: x, top: y, width: 180, height: 120, opacity: chosen ? 1 : 1 - eliminate * 0.78, transform: `rotate(${(index % 4) * 7 - 10}deg) scale(${chosen ? 0.75 + survivor * 0.45 : 0.68})`}}>
            <SubjectGlyph scene={scene} art={art} progress={progress} size={180} variant={index} />
            {!chosen && eliminate > 0.2 ? <div style={{position: 'absolute', left: 22, top: 72, width: 150, height: 12, background: art.primary, transform: 'rotate(34deg)'}} /> : null}
          </div>
        );
      })}
      <Label text={short(scene.title, 30)} x={70} y={90} color={art.ink} ink={art.paper} size={43} width={720} />
      <Label text={short(scene.kicker, 34)} x={615} y={1480} color={art.highlight} ink={art.ink} rotate={3} width={370} opacity={survivor} />
    </AbsoluteFill>
  );
};

const MechanismCutaway: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const open = enter(progress, 0.18, 0.46);
  const parts = [scene.primaryMotif, scene.secondaryMotif, scene.supportVisuals[0], scene.supportVisuals[1] ?? scene.props[1]];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: -170, top: 390, transform: `scale(${1.3 + progress * 0.08})`}}><SubjectGlyph scene={scene} art={art} progress={progress} size={820} /></div>
      <div style={{position: 'absolute', left: 515, top: 210, width: 465, height: 1180}}>
        {parts.map((part, index) => {
          const y = index * 265;
          return (
            <React.Fragment key={`${part}-${index}`}>
              <div style={{position: 'absolute', left: -220 + open * 220, top: y + 120, width: 235, height: 7, background: index % 2 ? art.secondary : art.primary, transform: `rotate(${index % 2 ? -8 : 8}deg)`, transformOrigin: 'right center'}} />
              <Torn x={30 + (1 - open) * 160} y={y} w={410} h={205} rotate={index % 2 ? 2 : -2} background={index % 2 ? art.secondary : art.paper} border={art.ink} opacity={open}>
                <div style={{padding: 28, fontFamily: 'Arial Black, Arial', fontSize: 31, lineHeight: 0.94, color: index % 2 ? art.paper : art.ink, textTransform: 'uppercase'}}>{short(part || '', 35)}</div>
                <div style={{position: 'absolute', right: 20, bottom: 14, fontFamily: 'monospace', fontWeight: 800, color: index % 2 ? art.paper : art.ink, opacity: 0.55}}>0{index + 1}</div>
              </Torn>
            </React.Fragment>
          );
        })}
      </div>
      <Label text={short(scene.title, 29)} x={70} y={105} color={art.primary} ink={art.paper} size={43} width={690} rotate={-2} />
    </AbsoluteFill>
  );
};

const CauseChain: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const items = [scene.primaryMotif, scene.secondaryMotif, ...scene.supportVisuals].filter(Boolean).slice(0, 4);
  return (
    <AbsoluteFill>
      <BigWord text={scene.title} art={art} x={-70} y={630} size={170} opacity={0.07} rotate={-10} />
      {items.map((item, index) => {
        const x = 95 + index * 225;
        const y = 300 + index * 310;
        const visible = enter(progress, 0.08 + index * 0.14, 0.2);
        return (
          <React.Fragment key={`${item}-${index}`}>
            {index > 0 ? <div style={{position: 'absolute', left: x - 170, top: y - 90, width: 220, height: 10, background: index % 2 ? art.secondary : art.primary, transform: 'rotate(52deg)', transformOrigin: 'left center', opacity: visible}} /> : null}
            <Torn x={x} y={y} w={410} h={255} rotate={index % 2 ? 4 : -4} background={index % 2 ? art.paper : art.highlight} border={art.ink} opacity={visible}>
              <div style={{position: 'absolute', right: -60, top: -65}}><SubjectGlyph scene={scene} art={art} progress={progress} size={260} variant={index} /></div>
              <div style={{position: 'absolute', left: 28, bottom: 30, width: 245, fontFamily: 'Arial Black, Arial', fontSize: 32, lineHeight: 0.92, color: art.ink, textTransform: 'uppercase'}}>{short(item, 28)}</div>
            </Torn>
          </React.Fragment>
        );
      })}
      <Label text={short(scene.kicker || scene.title, 34)} x={70} y={100} color={art.ink} ink={art.paper} size={41} width={780} />
    </AbsoluteFill>
  );
};

const ExplodedObject: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const open = enter(progress, 0.16, 0.52);
  const pieces = [
    {x: 540, y: 420, label: scene.primaryMotif},
    {x: 190, y: 235, label: scene.secondaryMotif},
    {x: 865, y: 230, label: scene.supportVisuals[0]},
    {x: 195, y: 1120, label: scene.supportVisuals[1] ?? scene.props[0]},
    {x: 860, y: 1160, label: scene.props[1] ?? scene.kicker},
  ];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 285, top: 580, transform: `scale(${0.75 + open * 0.45}) rotate(${progress * 8 - 4}deg)`}}><SubjectGlyph scene={scene} art={art} progress={progress} size={520} /></div>
      {pieces.slice(1).map((piece, index) => {
        const cx = 540 + (piece.x - 540) * open;
        const cy = 850 + (piece.y - 850) * open;
        return (
          <React.Fragment key={index}>
            <div style={{position: 'absolute', left: Math.min(540, cx), top: Math.min(850, cy), width: Math.hypot(cx - 540, cy - 850), height: 7, background: index % 2 ? art.primary : art.secondary, transform: `rotate(${Math.atan2(cy - 850, cx - 540) * 180 / Math.PI}deg)`, transformOrigin: 'left center', opacity: open}} />
            <Label text={short(piece.label || '', 25)} x={cx - 150} y={cy - 55} color={index % 2 ? art.primary : art.highlight} ink={index % 2 ? art.paper : art.ink} rotate={index % 2 ? 4 : -4} size={24} width={300} opacity={open} />
          </React.Fragment>
        );
      })}
      <Label text={short(scene.title, 31)} x={80} y={95} color={art.ink} ink={art.paper} size={44} width={750} />
    </AbsoluteFill>
  );
};

const TimelineStrip: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const items = [scene.primaryMotif, scene.secondaryMotif, ...scene.supportVisuals].filter(Boolean).slice(0, 5);
  return (
    <AbsoluteFill>
      <BigWord text={scene.title} art={art} x={390} y={80} size={112} opacity={0.1} rotate={90} />
      <div style={{position: 'absolute', left: 210, top: 190, width: 16, height: 1420, background: art.ink}} />
      <div style={{position: 'absolute', left: 215, top: 205, width: 6, height: 1390 * clamp(progress), background: art.primary, boxShadow: `0 0 0 5px ${art.highlight}66`}} />
      {items.map((item, index) => {
        const y = 250 + index * 280;
        const visible = enter(progress, index * 0.12, 0.22);
        return (
          <div key={`${item}-${index}`} style={{position: 'absolute', left: 170, top: y, opacity: visible}}>
            <div style={{position: 'absolute', left: 0, top: 45, width: 95, height: 8, background: index % 2 ? art.secondary : art.primary}} />
            <div style={{position: 'absolute', left: 20, top: 20, width: 55, height: 55, borderRadius: '50%', background: index % 2 ? art.secondary : art.highlight, border: `7px solid ${art.ink}`}} />
            <Torn x={115} y={-30} w={690} h={180} rotate={index % 2 ? 2 : -2} background={index % 2 ? `${art.secondary}dd` : `${art.paper}ee`} border={art.ink}>
              <div style={{padding: '28px 34px', width: 430, fontFamily: 'Arial Black, Arial', fontWeight: 1000, fontSize: 31, lineHeight: 0.94, color: index % 2 ? art.paper : art.ink, textTransform: 'uppercase'}}>{short(item, 35)}</div>
              <div style={{position: 'absolute', right: 30, top: 25, fontFamily: 'Georgia, serif', fontSize: 70, fontWeight: 900, color: index % 2 ? art.highlight : art.primary}}>0{index + 1}</div>
            </Torn>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const ComparisonScale: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const divide = interpolate(progress, [0, 1], [46, 54]);
  const leftScale = 0.72 + enter(progress, 0.12, 0.3) * 0.22;
  const rightScale = 0.55 + enter(progress, 0.44, 0.3) * 0.52;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, right: `${100 - divide}%`, background: `${art.secondary}cc`, clipPath: 'polygon(0 0,100% 0,85% 100%,0 100%)'}} />
      <div style={{position: 'absolute', inset: 0, left: `${divide - 8}%`, background: `${art.highlight}b8`, clipPath: 'polygon(15% 0,100% 0,100% 100%,0 100%)'}} />
      <div style={{position: 'absolute', left: 20, top: 420, transform: `scale(${leftScale}) rotate(-7deg)`}}><SubjectGlyph scene={scene} art={art} progress={progress} size={570} variant={1} /></div>
      <div style={{position: 'absolute', left: 520, top: 760, transform: `scale(${rightScale}) rotate(8deg)`}}><SubjectGlyph scene={scene} art={art} progress={progress} size={520} variant={4} /></div>
      <Label text={short(scene.primaryMotif, 29)} x={65} y={250} color={art.ink} ink={art.paper} rotate={-3} size={38} width={460} />
      <Label text={short(scene.secondaryMotif, 29)} x={565} y={1340} color={art.primary} ink={art.paper} rotate={3} size={38} width={445} opacity={enter(progress, 0.5, 0.2)} />
      <div style={{position: 'absolute', left: 420, top: 110, fontFamily: 'Arial Black, Arial', fontSize: 104, color: art.ink, transform: 'rotate(-4deg)'}}>VS</div>
    </AbsoluteFill>
  );
};

const MapRoute: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const path = clamp(progress * 1.18);
  const points = [{x:120,y:1280},{x:280,y:1020},{x:225,y:760},{x:520,y:590},{x:730,y:360},{x:930,y:610}];
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 80, background: `${art.paper}d8`, border: `8px solid ${art.ink}`, clipPath: 'polygon(2% 0,97% 2%,100% 97%,4% 100%,0 8%)', transform: 'rotate(-1.2deg)'}}>
        <svg width="100%" height="100%" viewBox="0 0 920 1700">
          <path d="M55 210 L260 90 L430 200 L640 100 L850 280 L790 630 L900 930 L710 1200 L470 1110 L280 1450 L70 1260 Z" fill={`${art.highlight}18`} stroke={art.ink} strokeWidth="9" />
          <path d="M40 1300 C180 1100 130 880 390 740 C570 640 590 390 850 560" fill="none" stroke={art.primary} strokeWidth="19" strokeDasharray="28 18" pathLength="1" strokeDashoffset={1 - path} />
          {points.map((point, index) => <g key={index} transform={`translate(${point.x - 80} ${point.y - 40}) scale(${enter(progress, index * 0.1, 0.2)})`}><circle r={index === 3 ? 36 : 25} fill={index % 2 ? art.secondary : art.highlight} stroke={art.ink} strokeWidth="8" /><circle r="8" fill={art.ink} /></g>)}
        </svg>
      </div>
      <Label text={short(scene.title, 31)} x={75} y={95} color={art.primary} ink={art.paper} size={43} width={760} rotate={-2} />
      <Label text={short(scene.kicker, 36)} x={590} y={1490} color={art.ink} ink={art.paper} rotate={4} width={390} opacity={enter(progress, 0.65, 0.2)} />
    </AbsoluteFill>
  );
};

const SpreadNetwork: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const nodes = [
    [540,860],[210,420],[855,390],[170,1050],[885,1120],[410,250],[685,1450],[320,1510],[905,720],
  ];
  const spread = clamp(progress * 1.15);
  return (
    <AbsoluteFill>
      <BigWord text={scene.primaryMotif} art={art} x={-70} y={190} size={150} opacity={0.09} rotate={-8} />
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        {nodes.slice(1).map(([x, y], index) => {
          const visible = enter(spread, 0.1 + index * 0.08, 0.2);
          return <line key={index} x1="540" y1="860" x2={x} y2={y} stroke={index % 2 ? art.primary : art.secondary} strokeWidth="9" strokeDasharray="18 14" opacity={visible} />;
        })}
        {nodes.map(([x, y], index) => {
          const visible = enter(spread, index * 0.07, 0.2);
          return <g key={index} transform={`translate(${x} ${y}) scale(${0.2 + visible * (index === 0 ? 1.15 : 0.72)})`}><circle r={index === 0 ? 125 : 85} fill={index % 3 === 0 ? art.highlight : index % 2 ? art.primary : art.secondary} stroke={art.ink} strokeWidth="12" /><circle r={index === 0 ? 42 : 25} fill={art.ink} /></g>;
        })}
      </svg>
      <Label text={short(scene.title, 29)} x={65} y={90} color={art.ink} ink={art.paper} size={43} width={790} />
      <Label text={short(scene.secondaryMotif, 30)} x={640} y={1565} color={art.highlight} ink={art.ink} rotate={3} width={350} opacity={enter(progress, 0.62, 0.2)} />
    </AbsoluteFill>
  );
};

const EvidenceBoard: React.FC<GrammarProps> = ({scene, art, progress}) => {
  const cards = [
    {x:80,y:250,w:510,h:350,r:-5,text:scene.primaryMotif},
    {x:550,y:170,w:430,h:480,r:4,text:scene.secondaryMotif},
    {x:120,y:780,w:390,h:520,r:3,text:scene.supportVisuals[0]},
    {x:500,y:760,w:510,h:360,r:-4,text:scene.supportVisuals[1] ?? scene.props[0]},
    {x:400,y:1250,w:570,h:300,r:2,text:scene.kicker},
  ];
  return (
    <AbsoluteFill>
      {cards.map((card, index) => {
        const visible = enter(progress, 0.05 + index * 0.11, 0.2);
        return (
          <React.Fragment key={index}>
            <Torn x={card.x} y={card.y} w={card.w} h={card.h} rotate={card.r} background={index % 2 ? `${art.paper}f2` : `${art.highlight}dc`} border={art.ink} opacity={visible}>
              {index < 2 ? <div style={{position: 'absolute', right: -30, bottom: -45}}><SubjectGlyph scene={scene} art={art} progress={progress} size={260} variant={index} /></div> : null}
              <div style={{position: 'absolute', left: 28, top: 30, width: card.w * 0.7, fontFamily: index === 4 ? 'Georgia, serif' : 'Arial Black, Arial', fontSize: index === 4 ? 34 : 30, fontWeight: 900, lineHeight: 0.98, color: art.ink, textTransform: index === 4 ? 'none' : 'uppercase'}}>{short(card.text || '', index === 4 ? 62 : 34)}</div>
              <div style={{position: 'absolute', left: 25, bottom: 18, fontFamily: 'monospace', fontSize: 18, fontWeight: 900, color: art.ink, opacity: 0.54}}>EVIDENCE 0{index + 1}</div>
            </Torn>
            <Tape x={card.x + card.w * 0.35} y={card.y - 14} rotate={card.r * -0.5} color={index % 2 ? art.secondary : art.primary} width={125} />
          </React.Fragment>
        );
      })}
      <svg width="1080" height="1920" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <path d="M330 600 C450 700 640 620 740 700 S700 1010 610 1110 S540 1320 690 1410" fill="none" stroke={art.primary} strokeWidth="8" opacity={enter(progress, 0.48, 0.3)} />
      </svg>
    </AbsoluteFill>
  );
};

const renderGrammar = (grammar: ScenePlan['sceneGrammar'], props: GrammarProps) => {
  switch (grammar) {
    case 'macro-field': return <MacroField {...props} />;
    case 'selection-field': return <SelectionField {...props} />;
    case 'mechanism-cutaway': return <MechanismCutaway {...props} />;
    case 'cause-chain': return <CauseChain {...props} />;
    case 'exploded-object': return <ExplodedObject {...props} />;
    case 'timeline-strip': return <TimelineStrip {...props} />;
    case 'comparison-scale': return <ComparisonScale {...props} />;
    case 'map-route': return <MapRoute {...props} />;
    case 'spread-network': return <SpreadNetwork {...props} />;
    case 'evidence-board': return <EvidenceBoard {...props} />;
    case 'hero-poster':
    default:
      return <HeroPoster {...props} />;
  }
};

const cameraTransform = (scene: ScenePlan, progress: number) => {
  switch (scene.cameraMove) {
    case 'pull-out': return `scale(${1.08 - progress * 0.08})`;
    case 'pan-left': return `translateX(${35 - progress * 70}px) scale(1.035)`;
    case 'pan-right': return `translateX(${-35 + progress * 70}px) scale(1.035)`;
    case 'orbit': return `scale(${1.02 + progress * 0.035}) rotate(${progress * 1.8 - 0.9}deg)`;
    case 'drift-up': return `translateY(${28 - progress * 56}px) scale(1.025)`;
    case 'drift-down': return `translateY(${-28 + progress * 56}px) scale(1.025)`;
    case 'snap-zoom': return `scale(${1 + enter(progress, 0.48, 0.08) * 0.055})`;
    case 'push-in':
    default:
      return `scale(${1 + progress * 0.06})`;
  }
};

const SceneIntro: React.FC<{scene: ScenePlan; art: Art; frame: number; totalFrames: number}> = ({scene, art, frame, totalFrames}) => {
  const intro = interpolate(frame, [0, 9], [1, 0], {extrapolateRight: 'clamp'});
  const outro = interpolate(frame, [totalFrames - 8, totalFrames - 1], [0, 1], {extrapolateLeft: 'clamp'});
  const color = scene.id % 2 ? art.primary : art.secondary;
  return (
    <>
      <AbsoluteFill style={{pointerEvents: 'none', background: color, opacity: intro * 0.88, clipPath: `polygon(0 0,${100 - intro * 84}% 0,${80 - intro * 80}% 100%,0 100%)`}} />
      <AbsoluteFill style={{pointerEvents: 'none', background: art.ink, opacity: outro * 0.82, clipPath: `circle(${outro * 95}% at ${scene.id % 2 ? 18 : 82}% 50%)`}} />
    </>
  );
};

const Scene: React.FC<{scene: ScenePlan; index: number}> = ({scene, index}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, totalFrames - 1));
  const art = artFor(scene);
  const grammar = fallbackGrammar(scene, index);
  const intro = spring({frame, fps, config: {damping: 18, stiffness: 105, mass: 0.8}});
  const backgroundLight = /^#(?:[0-7][0-9a-f]|8[0-9a-f])/i.test(art.paper);

  return (
    <AbsoluteFill style={{background: art.paper, overflow: 'hidden', color: art.ink}}>
      <AbsoluteFill style={{background: backgroundLight ? `linear-gradient(145deg, ${art.paper}, ${art.highlight}22)` : `radial-gradient(circle at 55% 42%, ${art.secondary}44, ${art.paper} 68%)`}} />
      <div style={{position: 'absolute', inset: -55, transform: cameraTransform(scene, progress), transformOrigin: scene.compositionBias === 'left' ? '35% 50%' : scene.compositionBias === 'right' ? '70% 50%' : '50% 50%', opacity: intro}}>
        {renderGrammar(grammar, {scene, art, progress, index})}
      </div>
      <div style={{position: 'absolute', left: 58, bottom: 62, fontFamily: 'monospace', fontSize: 18, letterSpacing: 3, fontWeight: 900, color: art.ink, opacity: 0.46}}>
        NEO/V4 · {String(scene.id).padStart(2, '0')} · {grammar.toUpperCase()}
      </div>
      <Grain ink={art.ink} />
      <SceneIntro scene={scene} art={art} frame={frame} totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

export const AutoShortV4: React.FC = () => (
  <AbsoluteFill style={{background: plan.palette.paper}}>
    <Audio src={staticFile('auto-factory/audio/final.wav')} />
    {plan.scenes.map((scene, index) => (
      <Sequence
        key={scene.id}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
      >
        <Scene scene={scene} index={index} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

export const AUTO_FACTORY_V4_FRAMES = Math.round(plan.duration * plan.fps);
