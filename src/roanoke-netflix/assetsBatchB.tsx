import React from 'react';
import type {LayerProps} from './assetsBatchA';

const base = (style?: React.CSSProperties, opacity = 1): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  opacity,
  ...style,
});

export const CompassRose: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(540 960)">
      <circle r="310" fill="rgba(232,214,174,.82)" stroke="#2c2014" strokeWidth="14"/>
      <circle r="250" fill="none" stroke="#2c2014" strokeWidth="8" strokeDasharray="15 14"/>
      <path d="M0-300L62-45 0 0-62-45zM300 0L45 62 0 0 45-62zM0 300L-62 45 0 0 62 45zM-300 0L-45-62 0 0-45 62z" fill="#2a1c11"/>
      <path d="M0-215L28-28 0 0-28-28zM215 0L28 28 0 0 28-28zM0 215L-28 28 0 0 28 28zM-215 0L-28-28 0 0-28 28z" fill="#d0462f"/>
      <text x="-28" y="-340" fontFamily="Georgia" fontWeight="900" fontSize="68" fill="#21150d">N</text>
      <text x="-25" y="392" fontFamily="Georgia" fontWeight="900" fontSize="68" fill="#21150d">S</text>
      <text x="340" y="24" fontFamily="Georgia" fontWeight="900" fontSize="68" fill="#21150d">E</text>
      <text x="-398" y="24" fontFamily="Georgia" fontWeight="900" fontSize="68" fill="#21150d">W</text>
    </g>
  </svg>
);

export const StormLayer: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)} preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="stormNoiseB"><feTurbulence type="fractalNoise" baseFrequency=".006" numOctaves="5" seed="44"/><feColorMatrix values=".35 0 0 0 0 .35 0 0 0 0 .4 0 0 0 0 0 0 0 .92 0"/></filter>
      <linearGradient id="stormGradB" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#171a20" stopOpacity=".96"/><stop offset=".7" stopColor="#45505a" stopOpacity=".62"/><stop offset="1" stopColor="#15161a" stopOpacity=".9"/></linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#stormGradB)"/>
    <rect width="1080" height="1120" filter="url(#stormNoiseB)" opacity=".92"/>
    <path d="M210 0L420 640H325L470 1120 710 405H585L760 0z" fill="#fff1bd" opacity=".5"/>
    {Array.from({length: 26}, (_, i) => <path key={i} d={`M${(i * 83) % 1180 - 80} 780l-230 650`} stroke="#dce6e8" strokeOpacity=".28" strokeWidth="8"/>)}
  </svg>
);

export const SearchParty: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <defs><radialGradient id="torchGlowB"><stop stopColor="#ffd56a" stopOpacity=".9"/><stop offset="1" stopColor="#ff9b2f" stopOpacity="0"/></radialGradient></defs>
    <g transform="translate(85 850)">
      {[0, 220, 440, 660].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i % 2 ? 35 : 0}) scale(${1 - i * .04})`}>
          <circle cx="105" cy="85" r="57" fill="#17100c"/>
          <path d="M35 420c13-196 48-275 70-275 28 0 65 79 78 275z" fill="#17100c"/>
          <path d="M62 245l-92 180M150 245l100 160" stroke="#17100c" strokeWidth="46" strokeLinecap="round"/>
          <path d="M225 120v245" stroke="#4f301a" strokeWidth="16"/>
          <ellipse cx="225" cy="85" rx="160" ry="160" fill="url(#torchGlowB)"/>
          <path d="M205 84c22-62 46-78 66-8-8 32-27 55-48 62-18-11-27-28-18-54z" fill="#ffbe2e"/>
        </g>
      ))}
    </g>
  </svg>
);

export const RedThreadBoard: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <rect x="65" y="120" width="950" height="1660" rx="28" fill="#6f5435" stroke="#25170d" strokeWidth="18"/>
    <rect x="92" y="147" width="896" height="1606" rx="16" fill="#cbb88d"/>
    <g fill="#efe3c6" stroke="#2c2115" strokeWidth="6">
      <rect x="150" y="260" width="310" height="420" transform="rotate(-5 305 470)"/>
      <rect x="610" y="255" width="270" height="340" transform="rotate(4 745 425)"/>
      <rect x="530" y="1030" width="350" height="410" transform="rotate(-3 705 1235)"/>
      <rect x="145" y="1035" width="280" height="360" transform="rotate(6 285 1215)"/>
    </g>
    <g fill="#e04329"><circle cx="348" cy="485" r="18"/><circle cx="714" cy="430" r="18"/><circle cx="690" cy="1205" r="18"/><circle cx="295" cy="1210" r="18"/></g>
    <path d="M348 485L714 430 690 1205 295 1210 348 485M714 430L295 1210" fill="none" stroke="#bd2e24" strokeWidth="10"/>
    <text x="190" y="350" fontFamily="Georgia" fontWeight="900" fontSize="46" fill="#25180f">NO BODIES</text>
    <text x="650" y="350" fontFamily="Georgia" fontWeight="900" fontSize="42" fill="#25180f">CROATOAN</text>
    <text x="565" y="1120" fontFamily="Georgia" fontWeight="900" fontSize="42" fill="#25180f">STORM</text>
    <text x="175" y="1130" fontFamily="Georgia" fontWeight="900" fontSize="42" fill="#25180f">115 GONE</text>
  </svg>
);

export const NativeVillage: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(0 750)">
      <path d="M0 860V590c180-110 362-128 540-52 186 79 366 70 540-19v341z" fill="#1f1711"/>
      {[130, 390, 650, 870].map((x, i) => <g key={x} transform={`translate(${x} ${i % 2 ? 45 : 0})`}><path d="M-90 550L0 265 90 550z" fill="#735435" stroke="#1b120c" strokeWidth="12"/><path d="M0 265V550" stroke="#1b120c" strokeWidth="10"/></g>)}
      <path d="M85 605c165-66 305-61 455 1 150 62 295 65 455-1" fill="none" stroke="#b08b55" strokeWidth="18" opacity=".42"/>
      <circle cx="540" cy="220" r="125" fill="#ffbe2e" opacity=".32"/>
    </g>
  </svg>
);

export const AttackTheory: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(145 440) rotate(-8 395 520)">
      <rect width="790" height="1080" rx="28" fill="#d8c49a" stroke="#27190f" strokeWidth="16"/>
      <path d="M100 855L680 200M120 200l560 655" stroke="#4a2d1b" strokeWidth="34" strokeLinecap="round"/>
      <path d="M90 870l90-35-48-63zM690 190l-90 35 48 63zM110 190l90 35-48 63zM690 870l-90-35 48-63z" fill="#4a2d1b"/>
      <path d="M145 485c95-80 183-89 263-15 84-79 177-67 273 36-45 132-134 215-267 250-138-38-228-128-269-271z" fill="#8c2d25" opacity=".7"/>
      <text x="155" y="1000" fontFamily="Georgia" fontWeight="900" fontSize="78" fill="#24160e">KATLİAM?</text>
    </g>
  </svg>
);

export const ShipwreckTheory: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(120 510) rotate(5 420 500)">
      <rect width="840" height="1020" rx="30" fill="#d7c49e" stroke="#27190f" strokeWidth="16"/>
      <path d="M115 630h610l-70 130H225z" fill="#3b2718"/>
      <path d="M410 175v480M580 255v400" stroke="#2b1c12" strokeWidth="18"/>
      <path d="M420 190c-90 60-142 134-158 221 64 17 116 19 158 0zM435 205c111 48 176 111 195 192-79 28-144 31-195 14z" fill="#eee0be" stroke="#2b1c12" strokeWidth="8"/>
      <path d="M80 790c180-65 333-54 460 22 105 63 205 64 300 4" fill="none" stroke="#476f76" strokeWidth="34" strokeLinecap="round"/>
      <path d="M250 235L640 740" stroke="#b32f25" strokeWidth="26"/><path d="M640 235L250 740" stroke="#b32f25" strokeWidth="26"/>
      <text x="170" y="940" fontFamily="Georgia" fontWeight="900" fontSize="72" fill="#24160e">BATTI MI?</text>
    </g>
  </svg>
);

export const AntiqueClock: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(540 950)">
      <circle r="360" fill="#d7c399" stroke="#21150d" strokeWidth="30"/>
      <circle r="310" fill="#bca273" stroke="#52381e" strokeWidth="12"/>
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(a) * 260;
        const y = Math.sin(a) * 260 + 18;
        return <text key={i} x={x} y={y} textAnchor="middle" fontFamily="Georgia" fontWeight="900" fontSize="54" fill="#22160e">{i === 0 ? 12 : i}</text>;
      })}
      <path d="M0 0L-22-200" stroke="#21150d" strokeWidth="22" strokeLinecap="round"/>
      <path d="M0 0L180 80" stroke="#a93025" strokeWidth="16" strokeLinecap="round"/>
      <circle r="34" fill="#21150d"/>
      <path d="M-210-405h420l-48-98h-320z" fill="#2b1b10"/>
      <path d="M-170 390h340l70 190h-480z" fill="#2b1b10"/>
    </g>
  </svg>
);

export const InkQuestion: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <defs><filter id="inkRoughB"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="18"/></filter></defs>
    <g filter="url(#inkRoughB)">
      <text x="540" y="1260" textAnchor="middle" fontFamily="Georgia" fontWeight="900" fontSize="980" fill="#16100c" opacity=".94">?</text>
      <circle cx="540" cy="1520" r="95" fill="#e04329" opacity=".82"/>
    </g>
  </svg>
);

export const FogAndScratches: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={{...base(style, opacity), mixBlendMode: 'screen'}} preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="fogNoiseB"><feTurbulence type="fractalNoise" baseFrequency=".003 .012" numOctaves="3" seed="75"/><feGaussianBlur stdDeviation="24"/></filter>
    </defs>
    <rect width="1080" height="1920" filter="url(#fogNoiseB)" opacity=".34" fill="#ffffff"/>
    {Array.from({length: 17}, (_, i) => <path key={i} d={`M${70 + i * 61} ${-100 + (i % 4) * 170}l${-80 + (i % 3) * 35} 2150`} stroke="#fff2d5" strokeOpacity={0.07 + (i % 3) * 0.035} strokeWidth={i % 4 === 0 ? 5 : 2}/>) }
    <ellipse cx="330" cy="1020" rx="440" ry="210" fill="#e8edf0" opacity=".14"/>
    <ellipse cx="830" cy="1390" rx="530" ry="260" fill="#e8edf0" opacity=".12"/>
  </svg>
);
