import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
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
const P = plan.palette;

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const enterAt = (progress: number, at: number, width = 0.16) => clamp((progress - at) / width);
const accent = (scene: ScenePlan) => ({
  red: P.red,
  teal: P.teal,
  gold: P.gold,
  blue: P.blue,
}[scene.accent]);

type PaperProps = React.PropsWithChildren<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  dark?: boolean;
  opacity?: number;
}>;

const Paper: React.FC<PaperProps> = ({
  x,
  y,
  w,
  h,
  rotate = 0,
  dark = false,
  opacity = 1,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width: w,
      height: h,
      background: dark ? P.ink : '#eee1c2',
      color: dark ? '#fff5dd' : P.ink,
      border: `7px solid ${P.ink}`,
      boxShadow: '15px 20px 0 rgba(30,22,16,.22)',
      transform: `rotate(${rotate}deg)`,
      opacity,
      clipPath: 'polygon(1% 2%,98% 0,100% 95%,96% 100%,3% 98%,0 8%)',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

type TagProps = {
  text: string;
  x: number;
  y: number;
  color?: string;
  rotation?: number;
  opacity?: number;
  width?: number;
};

const Tag: React.FC<TagProps> = ({
  text,
  x,
  y,
  color,
  rotation = 0,
  opacity = 1,
  width = 310,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      width,
      padding: '13px 19px 11px',
      background: color ?? '#f4e8c8',
      color: color ? '#fff7e4' : P.ink,
      border: `4px solid ${P.ink}`,
      borderRadius: 10,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 950,
      fontSize: 25,
      lineHeight: 1.02,
      transform: `rotate(${rotation}deg)`,
      boxShadow: '7px 9px 0 rgba(32,24,18,.2)',
      opacity,
    }}
  >
    {text}
  </div>
);

const Texture: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          opacity: 0.1,
          backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 6px,rgba(40,30,20,.2) 7px)',
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          opacity: 0.15,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27140%27 height=%27140%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.8%27 numOctaves=%272%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25 filter=%27url(%23n)%27 opacity=%27.4%27/%3E%3C/svg%3E")',
          backgroundPosition: `${frame % 21}px ${frame % 17}px`,
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 43%,transparent 50%,rgba(21,17,13,.38) 100%)',
        }}
      />
    </>
  );
};

type BacteriumProps = {
  x: number;
  y: number;
  scale?: number;
  color: string;
  resistant?: boolean;
  dead?: number;
  rotation?: number;
};

const Bacterium: React.FC<BacteriumProps> = ({
  x,
  y,
  scale = 1,
  color,
  resistant = false,
  dead = 0,
  rotation = 0,
}) => (
  <g
    transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}
    opacity={1 - dead * 0.72}
  >
    <rect
      x="-55"
      y="-28"
      width="110"
      height="56"
      rx="28"
      fill={dead ? '#b4aa96' : color}
      stroke={P.ink}
      strokeWidth="8"
    />
    {resistant ? (
      <path
        d="M-18 -42 L0 -68 L18 -42 M-18 42 L0 68 L18 42"
        fill="none"
        stroke={P.gold}
        strokeWidth="8"
        strokeLinecap="round"
      />
    ) : null}
    {dead > 0 ? (
      <path d="M-35 -20 L35 20 M35 -20 L-35 20" stroke={P.red} strokeWidth="9" />
    ) : null}
  </g>
);

type DrawingProps = {scene: ScenePlan; progress: number};

const MicrobeField: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const kill = enterAt(progress, 0.38, 0.26);
  const survivor = enterAt(progress, 0.62, 0.18);
  const points: Array<[number, number, number]> = [
    [120, 170, -10], [270, 130, 12], [430, 180, -4], [580, 125, 9],
    [180, 330, 4], [350, 320, -12], [530, 330, 7], [115, 500, 8],
    [290, 510, -7], [475, 490, 13], [620, 520, -3],
  ];
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <ellipse cx="380" cy="370" rx="320" ry="300" fill="#e8ddc1" stroke={P.ink} strokeWidth="12" />
      <ellipse
        cx="380"
        cy="370"
        rx={70 + progress * 220}
        ry={65 + progress * 205}
        fill="none"
        stroke={P.red}
        strokeWidth="13"
        opacity={0.25 + progress * 0.35}
      />
      {points.map(([x, y, rotation], index) => (
        <Bacterium
          key={`${x}-${y}`}
          x={x}
          y={y}
          rotation={rotation}
          scale={index % 3 === 0 ? 0.82 : 0.7}
          color={index === 6 ? sceneAccent : index % 2 ? P.teal : P.blue}
          resistant={index === 6}
          dead={index === 6 ? 0 : kill}
        />
      ))}
      <g transform={`translate(380 370) scale(${0.5 + survivor * 0.65})`} opacity={survivor}>
        <circle r="80" fill="none" stroke={P.gold} strokeWidth="12" strokeDasharray="18 12" />
        <text y="12" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="25" fill={P.ink}>
          {scene.props[0].slice(0, 18)}
        </text>
      </g>
    </svg>
  );
};

const SelectionProcess: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const eliminate = enterAt(progress, 0.32, 0.25);
  const grow = enterAt(progress, 0.62, 0.2);
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <rect x="45" y="70" width="300" height="560" rx="20" fill="#e9ddbf" stroke={P.ink} strokeWidth="10" />
      <rect x="415" y="70" width="300" height="560" rx="20" fill="#e9ddbf" stroke={P.ink} strokeWidth="10" />
      <path d="M350 350 H410" stroke={P.red} strokeWidth="14" />
      <polygon points="410,350 375,325 375,375" fill={P.red} />
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Bacterium
          key={`left-${index}`}
          x={120 + (index % 2) * 140}
          y={170 + Math.floor(index / 2) * 150}
          scale={0.62}
          color={index === 4 ? sceneAccent : P.teal}
          resistant={index === 4}
          dead={index === 4 ? 0 : eliminate}
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6].map((index) => (
        <Bacterium
          key={`right-${index}`}
          x={485 + (index % 2) * 140}
          y={150 + Math.floor(index / 2) * 120}
          scale={0.42 + grow * 0.2}
          color={sceneAccent}
          resistant
          rotation={index % 2 ? 9 : -7}
        />
      ))}
      <text x="195" y="690" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={P.ink}>ÖNCE</text>
      <text x="565" y="690" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={P.ink}>SONRA</text>
    </svg>
  );
};

const GeneTransfer: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const transfer = enterAt(progress, 0.25, 0.5);
  const ringX = 250 + 260 * transfer;
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <Bacterium x={210} y={360} scale={1.5} color={P.teal} resistant />
      <Bacterium x={550} y={360} scale={1.5} color={sceneAccent} />
      <path
        d="M285 350 C360 260 440 260 500 350"
        fill="none"
        stroke={P.red}
        strokeWidth="10"
        strokeDasharray="18 12"
        pathLength="1"
        strokeDashoffset={1 - transfer}
      />
      <g transform={`translate(${ringX} ${305 - Math.sin(transfer * Math.PI) * 60})`}>
        <circle r="44" fill="none" stroke={P.gold} strokeWidth="13" />
        <circle r="19" fill="none" stroke={P.ink} strokeWidth="6" />
      </g>
      <text x="380" y="585" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="32" fill={P.ink}>
        {scene.heroVisual.slice(0, 32).toLocaleUpperCase('tr-TR')}
      </text>
    </svg>
  );
};

const BeforeAfter: React.FC<DrawingProps> = ({scene, progress}) => {
  const reveal = enterAt(progress, 0.18, 0.25);
  const sceneAccent = accent(scene);
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <path d="M60 70 H700 V650 H60 Z" fill="#e9ddbf" stroke={P.ink} strokeWidth="11" />
      <line x1="380" y1="70" x2="380" y2="650" stroke={P.ink} strokeWidth="10" />
      <text x="210" y="130" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={P.ink}>ÖNCE</text>
      <text x="550" y="130" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="30" fill={sceneAccent}>SONRA</text>
      <g transform="translate(210 360)">
        <circle r="130" fill="#d6c8a9" stroke={P.ink} strokeWidth="9" />
        <path d="M-80 40 C-20 -60 55 -80 90 20" fill="none" stroke={P.teal} strokeWidth="16" />
      </g>
      <g transform={`translate(550 360) scale(${0.5 + reveal * 0.5})`} opacity={reveal}>
        <circle r="130" fill="#d6c8a9" stroke={P.ink} strokeWidth="9" />
        <path d="M-90 50 C-35 -75 50 -90 95 35" fill="none" stroke={sceneAccent} strokeWidth="18" />
        <path d="M-95 -25 L95 65" stroke={P.red} strokeWidth="12" strokeDasharray="18 11" />
      </g>
      <text x="380" y="710" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="27" fill={P.ink}>
        {scene.heroVisual.slice(0, 38)}
      </text>
    </svg>
  );
};

const ObjectExploded: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const open = enterAt(progress, 0.15, 0.52);
  const pieces = [
    {x: 380, y: 360, label: scene.props[0]},
    {x: 170, y: 170, label: scene.props[1]},
    {x: 585, y: 170, label: scene.props[2] ?? scene.supportVisuals[0]},
    {x: 180, y: 565, label: scene.supportVisuals[1] ?? scene.props[0]},
    {x: 580, y: 565, label: scene.heroVisual},
  ];
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      {pieces.slice(1).map((piece, index) => {
        const x = 380 + (piece.x - 380) * open;
        const y = 360 + (piece.y - 360) * open;
        return (
          <g key={`${piece.x}-${piece.y}`}>
            <line x1="380" y1="360" x2={x} y2={y} stroke={index % 2 ? P.red : P.teal} strokeWidth="8" strokeDasharray="13 10" />
            <g transform={`translate(${x} ${y}) scale(${0.45 + open * 0.55})`}>
              <rect x="-92" y="-62" width="184" height="124" rx="18" fill={index % 2 ? P.gold : P.blue} stroke={P.ink} strokeWidth="8" />
              <text y="8" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="19" fill="#fff6df">
                {String(piece.label).slice(0, 15)}
              </text>
            </g>
          </g>
        );
      })}
      <g transform={`translate(380 360) scale(${0.7 + open * 0.25})`}>
        <circle r="115" fill="#efe2c4" stroke={P.ink} strokeWidth="12" />
        <circle r="62" fill={sceneAccent} stroke={P.ink} strokeWidth="9" />
        <path d="M-50 -5 C-15 -65 25 -60 60 5 C25 65 -20 65 -50 -5 Z" fill="none" stroke={P.gold} strokeWidth="12" />
      </g>
    </svg>
  );
};

const CauseEffect: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const connect = enterAt(progress, 0.25, 0.42);
  const result = enterAt(progress, 0.58, 0.2);
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <g transform="translate(190 350)">
        <rect x="-125" y="-145" width="250" height="290" rx="24" fill="#e8dbc0" stroke={P.ink} strokeWidth="11" />
        <Bacterium x={0} y={-35} scale={1.05} color={P.teal} />
        <rect x="-72" y="55" width="144" height="58" rx="26" fill={P.red} stroke={P.ink} strokeWidth="8" />
        <text y="92" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="20" fill="#fff6e1">
          {scene.props[0].slice(0, 13)}
        </text>
      </g>
      <line x1="325" y1="350" x2={325 + 125 * connect} y2="350" stroke={P.ink} strokeWidth="16" />
      <polygon points={`${450 * connect + 325 * (1 - connect)},350 ${405 * connect + 325 * (1 - connect)},318 ${405 * connect + 325 * (1 - connect)},382`} fill={P.ink} />
      <g transform={`translate(570 350) scale(${0.45 + result * 0.55})`} opacity={result}>
        <circle r="150" fill="#e8dbc0" stroke={P.ink} strokeWidth="11" />
        {[0, 1, 2, 3, 4].map((index) => (
          <Bacterium
            key={index}
            x={(index % 2 ? 45 : -45) + (index === 4 ? 45 : 0)}
            y={-75 + Math.floor(index / 2) * 75}
            scale={0.48}
            color={sceneAccent}
            resistant
            rotation={index % 2 ? 10 : -8}
          />
        ))}
      </g>
    </svg>
  );
};

const ProcessFlow: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const labels = [scene.props[0], scene.props[1], scene.props[2] ?? scene.heroVisual];
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      {labels.map((label, index) => {
        const visible = enterAt(progress, 0.08 + index * 0.22, 0.18);
        const x = 155 + index * 225;
        return (
          <g key={`${label}-${index}`} transform={`translate(${x} 350) scale(${0.5 + visible * 0.5})`} opacity={visible}>
            <circle r="100" fill={index === 1 ? sceneAccent : index === 2 ? P.gold : P.teal} stroke={P.ink} strokeWidth="10" />
            <text y="8" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="22" fill={index === 1 ? '#fff6e1' : P.ink}>
              {String(label).slice(0, 14)}
            </text>
          </g>
        );
      })}
      {[0, 1].map((index) => {
        const visible = enterAt(progress, 0.28 + index * 0.22, 0.2);
        const x1 = 255 + index * 225;
        return (
          <g key={index}>
            <line x1={x1} y1="350" x2={x1 + 125 * visible} y2="350" stroke={P.red} strokeWidth="13" />
            <polygon points={`${x1 + 125 * visible},350 ${x1 + 90 * visible},326 ${x1 + 90 * visible},374`} fill={P.red} />
          </g>
        );
      })}
    </svg>
  );
};

const EvidenceBoard: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const cards: Array<[number, number, number]> = [[75, 100, -5], [315, 70, 4], [500, 300, -3], [120, 390, 5]];
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      {cards.map(([x, y, rotation], index) => {
        const visible = enterAt(progress, 0.08 + index * 0.13, 0.18);
        return (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y + (1 - visible) * 100}) rotate(${rotation})`} opacity={visible}>
            <rect width="205" height="210" fill="#f0e3c3" stroke={P.ink} strokeWidth="8" />
            <rect x="20" y="20" width="165" height="95" fill={index % 2 ? P.blue : P.teal} opacity=".55" />
            <path d="M25 145 H170 M25 175 H135" stroke="#8e7654" strokeWidth="7" />
            <circle cx="102" cy="8" r="13" fill={index === 2 ? sceneAccent : P.red} stroke={P.ink} strokeWidth="5" />
          </g>
        );
      })}
      <path
        d="M177 108 C280 170 390 145 600 310 M220 500 C330 390 500 440 600 310"
        fill="none"
        stroke={P.red}
        strokeWidth="7"
        strokeDasharray="14 10"
        pathLength="1"
        strokeDashoffset={1 - enterAt(progress, 0.32, 0.4)}
      />
      <text x="385" y="700" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="24" fill={P.ink}>
        {scene.heroVisual.slice(0, 38)}
      </text>
    </svg>
  );
};

const MapEvolution: React.FC<DrawingProps> = ({scene, progress}) => {
  const sceneAccent = accent(scene);
  const route = enterAt(progress, 0.12, 0.7);
  const nodes: Array<[number, number]> = [[130, 320], [430, 360], [650, 245], [150, 500], [445, 530], [650, 475]];
  return (
    <svg width="760" height="760" viewBox="0 0 760 760">
      <path d="M80 145 L250 80 L370 145 L520 95 L690 190 L635 340 L690 520 L535 650 L360 590 L210 660 L75 525 L120 350 Z" fill="#e7dbbc" stroke={P.ink} strokeWidth="11" />
      <path d="M130 320 C250 190 355 290 430 360 C520 450 590 335 650 245" fill="none" stroke={sceneAccent} strokeWidth="14" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - route} />
      <path d="M150 500 C260 420 350 470 445 530 C535 585 600 530 650 475" fill="none" stroke={P.red} strokeWidth="10" strokeDasharray="18 12" pathLength="1" strokeDashoffset={1 - route} />
      {nodes.map(([x, y], index) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={12 + enterAt(progress, 0.18 + index * 0.07, 0.15) * 13} fill={index % 2 ? sceneAccent : P.gold} stroke={P.ink} strokeWidth="6" />
      ))}
      <text x="380" y="715" textAnchor="middle" fontFamily="Arial" fontWeight="900" fontSize="25" fill={P.ink}>
        {scene.heroVisual.slice(0, 38)}
      </text>
    </svg>
  );
};

const Drawing: React.FC<DrawingProps> = ({scene, progress}) => {
  switch (scene.visualKind) {
    case 'microbe-field':
    case 'biology':
      return <MicrobeField scene={scene} progress={progress} />;
    case 'selection-process':
      return <SelectionProcess scene={scene} progress={progress} />;
    case 'gene-transfer':
      return <GeneTransfer scene={scene} progress={progress} />;
    case 'before-after':
    case 'comparison':
      return <BeforeAfter scene={scene} progress={progress} />;
    case 'object-exploded':
    case 'mechanism':
      return <ObjectExploded scene={scene} progress={progress} />;
    case 'cause-effect':
      return <CauseEffect scene={scene} progress={progress} />;
    case 'evidence-board':
    case 'document':
    case 'archive-wall':
      return <EvidenceBoard scene={scene} progress={progress} />;
    case 'map-evolution':
    case 'map-route':
    case 'world-network':
      return <MapEvolution scene={scene} progress={progress} />;
    default:
      return <ProcessFlow scene={scene} progress={progress} />;
  }
};

type TransitionProps = {scene: ScenePlan; frame: number};

const SceneTransition: React.FC<TransitionProps> = ({scene, frame}) => {
  const progress = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  if (scene.transition === 'film-burn') {
    return (
      <AbsoluteFill
        style={{
          background: '#fff3c8',
          opacity: interpolate(frame, [0, 2, 8], [0.92, 0.3, 0], {extrapolateRight: 'clamp'}),
          mixBlendMode: 'screen',
        }}
      />
    );
  }
  if (scene.transition === 'split-shutter') {
    return (
      <>
        <div style={{position: 'absolute', inset: 0, bottom: '50%', background: P.ink, transform: `translateY(${-105 * progress}%)`}} />
        <div style={{position: 'absolute', inset: 0, top: '50%', background: P.ink, transform: `translateY(${105 * progress}%)`}} />
      </>
    );
  }
  if (scene.transition === 'match-zoom' || scene.transition === 'object-match') {
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle, transparent ${progress * 68}%, ${accent(scene)} ${progress * 68 + 3}%, ${P.ink} ${progress * 86 + 4}%)`,
          opacity: 1 - progress,
        }}
      />
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        inset: -100,
        background: '#efe2c3',
        clipPath: `polygon(0 0,${105 - progress * 115}% 0,${88 - progress * 115}% 100%,0 100%)`,
        borderRight: `18px solid ${accent(scene)}`,
      }}
    />
  );
};

const Scene: React.FC<{scene: ScenePlan}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const totalFrames = Math.max(1, Math.round(scene.duration * fps));
  const progress = clamp(frame / Math.max(1, totalFrames - 1));
  const intro = spring({frame, fps, config: {damping: 16, stiffness: 115, mass: 0.75}});
  const beatOne = enterAt(progress, scene.beats[0]?.at ?? 0.16, 0.13);
  const beatTwo = enterAt(progress, scene.beats[1]?.at ?? 0.48, 0.13);
  const zoom = interpolate(progress, [0, 1], [1, 1.055]);
  const sceneAccent = accent(scene);
  const spokenClaim = scene.sceneGoal
    .replace(/^Show exactly how:\s*/i, '')
    .replace(/^Illustrate only this spoken claim:\s*/i, '');

  return (
    <AbsoluteFill style={{background: P.paper, overflow: 'hidden'}}>
      {scene.asset ? (
        <Img
          src={staticFile(scene.asset)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.2,
            filter: 'sepia(.45) contrast(1.08)',
            transform: `scale(${1.08 + progress * 0.06})`,
          }}
        />
      ) : null}
      <AbsoluteFill style={{background: 'linear-gradient(145deg,rgba(255,249,227,.72),rgba(147,119,80,.12))'}} />
      <Tag text={scene.title} x={70} y={82} color={sceneAccent} rotation={-1.2} opacity={intro} width={430} />
      <Tag text={scene.kicker.slice(0, 46)} x={90} y={175} rotation={1} opacity={intro} width={520} />
      <div style={{position: 'absolute', left: 80, top: 275, fontFamily: 'monospace', fontWeight: 800, fontSize: 18, letterSpacing: 2, color: P.ink, opacity: 0.52}}>
        NEO/V3 · {String(scene.id).padStart(2, '0')} · {scene.shotType.toUpperCase()}
      </div>
      <Paper x={125} y={330} w={830} h={850} rotate={scene.id % 2 ? -0.8 : 0.8} opacity={intro}>
        <div style={{position: 'absolute', left: 34, top: 34, width: 760, height: 760, transform: `scale(${zoom})`, transformOrigin: '50% 52%'}}>
          <Drawing scene={scene} progress={progress} />
        </div>
      </Paper>
      <Tag text={scene.supportVisuals[0]} x={65} y={1220} color={P.teal} rotation={-3} opacity={beatOne} width={310} />
      <Tag text={scene.supportVisuals[1] ?? scene.props[1]} x={650} y={1310} color={P.gold} rotation={3} opacity={beatTwo} width={320} />
      <div
        style={{
          position: 'absolute',
          left: 90,
          right: 90,
          top: 1460,
          minHeight: 165,
          padding: '28px 32px',
          background: 'rgba(239,226,193,.9)',
          border: `5px solid ${P.ink}`,
          fontFamily: 'Georgia, serif',
          fontSize: 30,
          lineHeight: 1.18,
          color: P.ink,
          boxShadow: '12px 16px 0 rgba(30,22,16,.18)',
        }}
      >
        {spokenClaim}
      </div>
      <Texture />
      <SceneTransition scene={scene} frame={frame} />
    </AbsoluteFill>
  );
};

export const AutoShortV3: React.FC = () => (
  <AbsoluteFill style={{background: P.paper}}>
    <Audio src={staticFile('auto-factory/audio/final.wav')} />
    {plan.scenes.map((scene) => (
      <Sequence
        key={scene.id}
        from={Math.round(scene.start * plan.fps)}
        durationInFrames={Math.max(1, Math.round(scene.duration * plan.fps))}
      >
        <Scene scene={scene} />
      </Sequence>
    ))}
    <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(circle at center,transparent 58%,rgba(20,16,12,.3) 100%)'}} />
  </AbsoluteFill>
);

export const AUTO_FACTORY_V3_FRAMES = Math.round(plan.duration * plan.fps);
