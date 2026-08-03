import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import planJson from '../../public/auto-factory/plan.json';
import {FactoryPlanSchema, type ScenePlan} from './schema';

const plan = FactoryPlanSchema.parse(planJson);
const P = plan.palette;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const appear = (progress: number, at: number, width = 0.18) => clamp((progress - at) / width);
const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9çğıöşü]+/gi, ' ');
const label = (value: string, max = 22) => {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(1, max - 1)).trim()}…`;
};

const paletteFor = (world: string) => {
  if (world.includes('ai') || world.includes('digital')) return {a: P.teal, b: P.blue, c: '#b75491'};
  if (world.includes('biology')) return {a: P.teal, b: '#82a93f', c: P.red};
  if (world.includes('atmospheric') || world.includes('nature')) return {a: P.blue, b: P.teal, c: P.gold};
  if (world.includes('historical') || world.includes('history')) return {a: P.red, b: P.gold, c: '#7b5a36'};
  if (world.includes('economy')) return {a: P.gold, b: P.teal, c: P.red};
  if (world.includes('geopolitical')) return {a: P.red, b: P.blue, c: P.gold};
  if (world.includes('mystery')) return {a: P.red, b: '#596b75', c: P.gold};
  if (world.includes('space')) return {a: P.blue, b: P.gold, c: P.teal};
  return {a: P.teal, b: P.red, c: P.gold};
};

type IconProps = {
  motif: string;
  x: number;
  y: number;
  scale?: number;
  color: string;
  progress: number;
  index?: number;
  showLabel?: boolean;
};

const MotifIcon: React.FC<IconProps> = ({motif, x, y, scale = 1, color, progress, index = 0, showLabel = true}) => {
  const key = normalize(motif);
  const pulse = 1 + Math.sin((progress * 5 + index) * Math.PI) * 0.025;
  const transform = `translate(${x} ${y}) scale(${scale * pulse})`;
  const ink = P.ink;
  let shape: React.ReactNode;

  if (/prompt|text|instruction|code|document|ledger|dossier|page|treaty|contract/.test(key)) {
    shape = (
      <g>
        <rect x="-86" y="-72" width="172" height="144" rx="12" fill="#f4e8c8" stroke={ink} strokeWidth="8" />
        <rect x="-66" y="-50" width="62" height="18" rx="5" fill={color} />
        <path d="M-66 -10 H62 M-66 20 H48 M-66 50 H18" stroke={ink} strokeWidth="8" strokeLinecap="round" />
      </g>
    );
  } else if (/neural|network|model|attention|weights|nodes|alliance|payment/.test(key)) {
    const nodes = [[-72,-48],[-72,48],[0,-66],[0,0],[0,66],[72,-42],[72,42]];
    shape = (
      <g>
        {nodes.slice(0, 2).flatMap((from, fromIndex) => nodes.slice(2, 5).map((to, toIndex) => (
          <line key={`${fromIndex}-${toIndex}`} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={ink} strokeWidth="5" opacity=".55" />
        )))}
        {nodes.slice(2, 5).flatMap((from, fromIndex) => nodes.slice(5).map((to, toIndex) => (
          <line key={`b-${fromIndex}-${toIndex}`} x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={color} strokeWidth="5" opacity=".75" />
        )))}
        {nodes.map(([nx, ny], nodeIndex) => <circle key={nodeIndex} cx={nx} cy={ny} r={15 + (nodeIndex % 2) * 3} fill={nodeIndex > 4 ? color : '#f0e2bd'} stroke={ink} strokeWidth="6" />)}
      </g>
    );
  } else if (/noise|pixel|image|canvas|frame|resolution|feature map|color channel|variation/.test(key)) {
    shape = (
      <g>
        <rect x="-82" y="-82" width="164" height="164" rx="8" fill="#e8dcbd" stroke={ink} strokeWidth="8" />
        {Array.from({length: 25}, (_, cell) => {
          const cx = -64 + (cell % 5) * 32;
          const cy = -64 + Math.floor(cell / 5) * 32;
          const active = ((cell * 7 + index * 3) % 9) / 9 < progress;
          return <rect key={cell} x={cx} y={cy} width="26" height="26" fill={active ? (cell % 3 === 0 ? color : P.blue) : '#b9aa89'} opacity={0.45 + progress * 0.5} />;
        })}
      </g>
    );
  } else if (/chip|gpu|processor|circuit|memory|sensor|server/.test(key)) {
    shape = (
      <g>
        <rect x="-68" y="-68" width="136" height="136" rx="18" fill={color} stroke={ink} strokeWidth="9" />
        <rect x="-35" y="-35" width="70" height="70" rx="8" fill="#f1e3be" stroke={ink} strokeWidth="7" />
        {[-48,-16,16,48].map((v) => <React.Fragment key={v}><line x1={v} y1="-96" x2={v} y2="-68" stroke={ink} strokeWidth="7" /><line x1={v} y1="68" x2={v} y2="96" stroke={ink} strokeWidth="7" /><line x1="-96" y1={v} x2="-68" y2={v} stroke={ink} strokeWidth="7" /><line x1="68" y1={v} x2="96" y2={v} stroke={ink} strokeWidth="7" /></React.Fragment>)}
      </g>
    );
  } else if (/bacter|microbe|infection|strain|colony|cell membrane/.test(key)) {
    shape = (
      <g>
        {[-52, 0, 52].map((dx, i) => (
          <g key={dx} transform={`translate(${dx} ${(i % 2) * 38 - 18}) rotate(${i % 2 ? 12 : -8})`}>
            <rect x="-42" y="-22" width="84" height="44" rx="22" fill={i === 1 ? color : P.teal} stroke={ink} strokeWidth="7" />
            {i === 1 ? <path d="M-12 -31 L0 -48 L12 -31 M-12 31 L0 48 L12 31" fill="none" stroke={P.gold} strokeWidth="6" /> : null}
          </g>
        ))}
      </g>
    );
  } else if (/dna|gene|mutation|plasmid/.test(key)) {
    shape = /plasmid/.test(key) ? (
      <g><circle r="67" fill="none" stroke={color} strokeWidth="13" /><circle r="32" fill="none" stroke={ink} strokeWidth="7" /><path d="M-44 -51 L-20 -72 M42 52 L65 30" stroke={P.red} strokeWidth="8" /></g>
    ) : (
      <g>
        <path d="M-58 -82 C48 -58 -48 58 58 82 M58 -82 C-48 -58 48 58 -58 82" fill="none" stroke={color} strokeWidth="11" />
        {[-55,-28,0,28,55].map((yy, i) => <line key={yy} x1={i % 2 ? -36 : -48} y1={yy} x2={i % 2 ? 36 : 48} y2={yy} stroke={ink} strokeWidth="7" />)}
      </g>
    );
  } else if (/spider/.test(key)) {
    shape = (
      <g>
        <ellipse cx="0" cy="18" rx="38" ry="50" fill={color} stroke={ink} strokeWidth="8" />
        <circle cx="0" cy="-35" r="28" fill="#e8d9b8" stroke={ink} strokeWidth="8" />
        {[-1,1].flatMap((side) => [-48,-20,18,48].map((yy, i) => <path key={`${side}-${i}`} d={`M${side * 22} ${yy / 2} Q${side * 70} ${yy - 22} ${side * 94} ${yy}`} fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" />))}
      </g>
    );
  } else if (/silk|web|thread|wind|air current|electric field|charge/.test(key)) {
    shape = (
      <g>
        {[-60,-30,0,30,60].map((dx, i) => <path key={dx} d={`M${dx} 78 C${dx - 26} 20 ${dx + 35} -22 ${dx + (i % 2 ? -8 : 14)} -82`} fill="none" stroke={i === 2 ? color : ink} strokeWidth={i === 2 ? 10 : 6} strokeDasharray={/electric|charge/.test(key) ? '13 9' : undefined} />)}
        <path d="M-85 48 Q0 4 85 48" fill="none" stroke={P.gold} strokeWidth="7" opacity=".8" />
      </g>
    );
  } else if (/cloud|sky|atmosphere|weather/.test(key)) {
    shape = (
      <g>
        <path d="M-82 35 C-92 -10 -50 -35 -18 -20 C-4 -68 69 -63 75 -10 C108 -4 107 52 68 58 H-55 C-82 58 -96 47 -82 35 Z" fill={color} stroke={ink} strokeWidth="8" />
        <path d="M-62 82 C-20 62 28 62 66 82" fill="none" stroke={P.blue} strokeWidth="8" strokeLinecap="round" />
      </g>
    );
  } else if (/caravan|camel|merchant/.test(key)) {
    shape = (
      <g>
        <path d="M-78 30 Q-58 -28 -18 -20 Q10 -58 42 -20 Q70 -18 80 18 L64 42 H-58 Z" fill={color} stroke={ink} strokeWidth="8" />
        <path d="M-50 40 V82 M45 38 V82 M70 18 Q98 -2 83 -35" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round" />
        <circle cx="78" cy="-43" r="15" fill="#eadbb9" stroke={ink} strokeWidth="6" />
      </g>
    );
  } else if (/route|map|path|border|trajectory|orbit|lane/.test(key)) {
    shape = (
      <g>
        <path d="M-86 -55 L-22 -82 L20 -42 L82 -66 L68 5 L90 65 L28 82 L-24 52 L-82 78 L-68 10 Z" fill="#e7d9b6" stroke={ink} strokeWidth="8" />
        <path d="M-58 46 C-16 -52 24 48 67 -35" fill="none" stroke={color} strokeWidth="11" strokeDasharray="16 10" pathLength="1" strokeDashoffset={1 - progress} />
        <circle cx="-58" cy="46" r="10" fill={P.gold} stroke={ink} strokeWidth="5" /><circle cx="67" cy="-35" r="12" fill={P.red} stroke={ink} strokeWidth="5" />
      </g>
    );
  } else if (/coin|currency|price|bank|market/.test(key)) {
    shape = (
      <g>
        <circle r="76" fill={P.gold} stroke={ink} strokeWidth="9" />
        <circle r="52" fill="none" stroke={color} strokeWidth="8" strokeDasharray="12 8" />
        <path d="M-25 -35 H15 Q46 -35 35 -5 Q28 13 -8 13 H-25 M-8 13 Q38 13 31 43 Q25 63 -25 55" fill="none" stroke={ink} strokeWidth="10" strokeLinecap="round" />
      </g>
    );
  } else if (/ship|port|cargo/.test(key)) {
    shape = (
      <g>
        <path d="M-86 30 H84 L56 70 H-55 Z" fill={color} stroke={ink} strokeWidth="8" />
        <rect x="-48" y="-18" width="92" height="48" fill="#eadbb8" stroke={ink} strokeWidth="7" />
        <path d="M-15 -18 V-76 L45 -36 H-15" fill={P.gold} stroke={ink} strokeWidth="7" />
        <path d="M-95 88 Q-45 64 0 88 Q45 108 96 82" fill="none" stroke={P.blue} strokeWidth="9" />
      </g>
    );
  } else if (/planet|moon|orbit|space|star|satellite|rocket/.test(key)) {
    shape = (
      <g>
        <circle r="58" fill={color} stroke={ink} strokeWidth="8" />
        <ellipse rx="96" ry="35" fill="none" stroke={P.gold} strokeWidth="8" transform="rotate(-18)" />
        <circle cx="74" cy="-28" r="12" fill={P.red} stroke={ink} strokeWidth="5" />
        <circle cx="-22" cy="-18" r="9" fill="#e6d8b7" opacity=".55" />
      </g>
    );
  } else if (/animal|habitat|bird|insect|wing|migration|predator|life cycle/.test(key)) {
    shape = (
      <g>
        <path d="M-86 20 Q-42 -58 0 -14 Q42 -58 86 20 Q38 2 0 58 Q-38 2 -86 20 Z" fill={color} stroke={ink} strokeWidth="8" />
        <circle cx="0" cy="12" r="17" fill={P.gold} stroke={ink} strokeWidth="6" />
      </g>
    );
  } else {
    shape = (
      <g>
        <circle r="80" fill={color} stroke={ink} strokeWidth="9" />
        <path d="M-42 8 L-10 38 L50 -40" fill="none" stroke="#f7efd9" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }

  return (
    <g transform={transform} opacity={0.2 + progress * 0.8}>
      {shape}
      {showLabel ? (
        <g transform="translate(0 118)">
          <rect x="-118" y="-24" width="236" height="48" rx="8" fill="#f3e6c7" stroke={ink} strokeWidth="5" />
          <text y="8" textAnchor="middle" fontFamily="Arial" fontSize="20" fontWeight="900" fill={ink}>{label(motif).toUpperCase()}</text>
        </g>
      ) : null}
    </g>
  );
};

type SceneGraphicProps = {scene: ScenePlan; progress: number};

const SceneGraphic: React.FC<SceneGraphicProps> = ({scene, progress}) => {
  const colors = paletteFor(scene.visualWorld);
  const motifs = [scene.primaryMotif, scene.secondaryMotif, ...scene.mustShow].filter((value, index, all) => all.indexOf(value) === index).slice(0, 5);
  const action = scene.semanticAction;

  if (action === 'compare') {
    return (
      <svg width="760" height="760" viewBox="0 0 760 760">
        <rect x="34" y="58" width="330" height="610" rx="24" fill="#eadcba" stroke={P.ink} strokeWidth="10" />
        <rect x="396" y="58" width="330" height="610" rx="24" fill="#eadcba" stroke={P.ink} strokeWidth="10" />
        <MotifIcon motif={motifs[0]} x={199} y={320} scale={1.25} color={colors.a} progress={appear(progress, 0.04)} />
        <MotifIcon motif={motifs[1] || motifs[0]} x={561} y={320} scale={1.25} color={colors.b} progress={appear(progress, 0.25)} />
        <path d="M330 360 H430" stroke={colors.c} strokeWidth="14" strokeDasharray="18 12" />
        <text x="380" y="716" textAnchor="middle" fontFamily="Arial" fontSize="25" fontWeight="900" fill={P.ink}>{label(scene.heroVisual, 38).toUpperCase()}</text>
      </svg>
    );
  }

  if (action === 'spread' || action === 'connect') {
    const nodes = [[125,150],[380,100],[635,155],[115,555],[380,625],[645,545]];
    return (
      <svg width="760" height="760" viewBox="0 0 760 760">
        {nodes.map(([x, y], index) => {
          const visible = appear(progress, 0.18 + index * 0.08, 0.16);
          return <line key={`line-${index}`} x1="380" y1="360" x2={380 + (x - 380) * visible} y2={360 + (y - 360) * visible} stroke={index % 2 ? colors.b : colors.c} strokeWidth="8" strokeDasharray="14 10" />;
        })}
        <MotifIcon motif={motifs[0]} x={380} y={360} scale={1.08} color={colors.a} progress={appear(progress, 0.02)} />
        {nodes.map(([x, y], index) => <MotifIcon key={`${x}-${y}`} motif={motifs[(index % Math.max(1, motifs.length - 1)) + 1] || motifs[0]} x={x} y={y} scale={0.52} color={index % 2 ? colors.b : colors.c} progress={appear(progress, 0.2 + index * 0.08)} showLabel={false} index={index} />)}
      </svg>
    );
  }

  if (action === 'trace') {
    const points = [[110,565],[210,430],[350,485],[485,300],[650,185]];
    const draw = appear(progress, 0.08, 0.72);
    return (
      <svg width="760" height="760" viewBox="0 0 760 760">
        <path d="M72 90 L230 58 L345 132 L510 70 L690 145 L650 330 L700 540 L520 676 L355 610 L180 690 L58 540 L105 330 Z" fill="#e8d9b7" stroke={P.ink} strokeWidth="10" />
        <path d="M110 565 C180 490 250 430 350 485 C445 535 430 350 485 300 C550 240 605 230 650 185" fill="none" stroke={colors.a} strokeWidth="15" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
        {points.map(([x,y], index) => <MotifIcon key={index} motif={motifs[index % motifs.length]} x={x} y={y} scale={0.42} color={index % 2 ? colors.b : colors.c} progress={appear(progress, 0.12 + index * 0.11)} showLabel={false} index={index} />)}
        <text x="380" y="728" textAnchor="middle" fontFamily="Arial" fontSize="24" fontWeight="900" fill={P.ink}>{label(scene.primaryMotif, 38).toUpperCase()}</text>
      </svg>
    );
  }

  if (action === 'filter' || action === 'collapse') {
    const fade = appear(progress, 0.35, 0.35);
    return (
      <svg width="760" height="760" viewBox="0 0 760 760">
        {Array.from({length: 9}, (_, index) => {
          const x = 145 + (index % 3) * 235;
          const y = 150 + Math.floor(index / 3) * 215;
          const removed = index !== 4 && (index + scene.id) % 3 !== 0;
          return (
            <g key={index} opacity={removed ? 1 - fade * 0.72 : 1}>
              <MotifIcon motif={motifs[index % motifs.length]} x={x} y={y} scale={0.54 + (index === 4 ? 0.12 : 0)} color={index === 4 ? colors.a : index % 2 ? colors.b : colors.c} progress={appear(progress, index * 0.035)} showLabel={false} index={index} />
              {removed ? <path d={`M${x - 56} ${y - 56} L${x + 56} ${y + 56} M${x + 56} ${y - 56} L${x - 56} ${y + 56}`} stroke={P.red} strokeWidth="11" opacity={fade} /> : null}
            </g>
          );
        })}
        <text x="380" y="716" textAnchor="middle" fontFamily="Arial" fontSize="24" fontWeight="900" fill={P.ink}>{label(action === 'filter' ? scene.primaryMotif : scene.secondaryMotif, 38).toUpperCase()}</text>
      </svg>
    );
  }

  if (action === 'multiply') {
    const grow = appear(progress, 0.32, 0.48);
    return (
      <svg width="760" height="760" viewBox="0 0 760 760">
        <MotifIcon motif={motifs[0]} x={210} y={360} scale={1.1} color={colors.a} progress={appear(progress, 0.02)} />
        <path d="M310 360 H420" stroke={colors.c} strokeWidth="14" /><polygon points="430,360 395,334 395,386" fill={colors.c} />
        {[[515,210],[625,355],[510,520]].map(([x,y], index) => <MotifIcon key={index} motif={motifs[(index + 1) % motifs.length]} x={x} y={y} scale={0.42 + grow * 0.32} color={index % 2 ? colors.b : colors.a} progress={grow} showLabel={false} index={index} />)}
        <text x="555" y="650" textAnchor="middle" fontFamily="Arial" fontSize="23" fontWeight="900" fill={P.ink}>{label(scene.secondaryMotif, 32).toUpperCase()}</text>
      </svg>
    );
  }

  if (action === 'transform' || action === 'assemble') {
    return (
      <svg width="760" height="760" viewBox="0 0 760 760">
        {[0,1,2].map((index) => {
          const visible = appear(progress, 0.06 + index * 0.22, 0.18);
          const x = 145 + index * 235;
          return (
            <React.Fragment key={index}>
              <rect x={x - 108} y="182" width="216" height="360" rx="24" fill="#eadcba" stroke={P.ink} strokeWidth="9" opacity={0.25 + visible * 0.75} />
              <MotifIcon motif={motifs[index % motifs.length]} x={x} y={340} scale={0.78} color={index === 0 ? colors.a : index === 1 ? colors.b : colors.c} progress={visible} />
              {index < 2 ? <><line x1={x + 108} y1="360" x2={x + 122 + 72 * visible} y2="360" stroke={P.red} strokeWidth="12" /><polygon points={`${x + 202 * visible},360 ${x + 168 * visible},337 ${x + 168 * visible},383`} fill={P.red} /></> : null}
            </React.Fragment>
          );
        })}
        <text x="380" y="670" textAnchor="middle" fontFamily="Arial" fontSize="24" fontWeight="900" fill={P.ink}>{label(scene.heroVisual, 38).toUpperCase()}</text>
      </svg>
    );
  }

  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <circle cx="380" cy="340" r={150 + appear(progress, 0.2) * 22} fill="#e7d8b5" stroke={P.ink} strokeWidth="11" />
      <circle cx="380" cy="340" r={190 + appear(progress, 0.35) * 28} fill="none" stroke={colors.c} strokeWidth="9" strokeDasharray="18 12" opacity=".7" />
      <MotifIcon motif={motifs[0]} x={380} y={330} scale={1.22} color={colors.a} progress={appear(progress, 0.02)} />
      <MotifIcon motif={motifs[1] || motifs[0]} x={145} y={570} scale={0.55} color={colors.b} progress={appear(progress, 0.28)} />
      <MotifIcon motif={motifs[2] || motifs[0]} x={615} y={570} scale={0.55} color={colors.c} progress={appear(progress, 0.48)} />
      <path d="M220 525 C275 455 300 435 332 412 M540 525 C485 455 458 438 428 412" fill="none" stroke={P.red} strokeWidth="8" strokeDasharray="14 10" />
    </svg>
  );
};

const SemanticScene: React.FC<{scene: ScenePlan}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const total = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, total - 1));
  const intro = spring({frame, fps, config: {damping: 18, stiffness: 110, mass: 0.8}});
  const world = scene.visualWorld.replace(/-/g, ' ').toUpperCase();
  return (
    <div
      style={{
        position: 'absolute',
        left: 159,
        top: 364,
        width: 760,
        height: 760,
        overflow: 'hidden',
        background: 'linear-gradient(145deg,#efe2c2,#dfcea8)',
        opacity: intro,
      }}
    >
      <div style={{position: 'absolute', inset: 0, opacity: 0.12, backgroundImage: 'repeating-linear-gradient(135deg,transparent 0 18px,rgba(35,26,18,.35) 19px 20px)'}} />
      <SceneGraphic scene={scene} progress={progress} />
      <div style={{position: 'absolute', left: 18, bottom: 14, padding: '7px 11px', background: 'rgba(28,22,17,.8)', color: '#f5ead0', fontFamily: 'monospace', fontSize: 13, fontWeight: 800, letterSpacing: 1.4}}>
        {world} · {scene.semanticAction.toUpperCase()}
      </div>
    </div>
  );
};

export const SemanticSceneOverlay: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    {plan.scenes.map((scene) => (
      <Sequence
        key={`semantic-${scene.id}`}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
      >
        <SemanticScene scene={scene} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
