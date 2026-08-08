import React from 'react';

export type LayerProps = {
  style?: React.CSSProperties;
  opacity?: number;
};

const base = (style?: React.CSSProperties, opacity = 1): React.CSSProperties => ({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  opacity,
  ...style,
});

export const MuseumWall: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)} preserveAspectRatio="xMidYMid slice">
    <defs>
      <filter id="wallNoiseA"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="17"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .18"/></feComponentTransfer></filter>
      <linearGradient id="wallGradA" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#e9ddc2"/><stop offset="1" stopColor="#c7b38d"/></linearGradient>
    </defs>
    <rect width="1080" height="1920" fill="url(#wallGradA)"/>
    <rect width="1080" height="1920" filter="url(#wallNoiseA)" opacity=".7"/>
    <path d="M0 330H1080M0 1010H1080M255 0V1920M805 0V1920" stroke="#6b5739" strokeOpacity=".12" strokeWidth="4"/>
    <path d="M50 1420c220-90 420-40 610-150 145-84 262-68 420-20" fill="none" stroke="#5b462e" strokeOpacity=".09" strokeWidth="18"/>
  </svg>
);

export const OrnateFrame: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <defs>
      <linearGradient id="goldA" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#5e3e12"/><stop offset=".35" stopColor="#e7bd58"/><stop offset=".63" stopColor="#8a5d1c"/><stop offset="1" stopColor="#f0d27a"/></linearGradient>
      <filter id="shadowA"><feDropShadow dx="0" dy="26" stdDeviation="24" floodOpacity=".5"/></filter>
    </defs>
    <g filter="url(#shadowA)">
      <rect x="155" y="290" width="770" height="1120" rx="28" fill="none" stroke="url(#goldA)" strokeWidth="52"/>
      <rect x="180" y="315" width="720" height="1070" rx="18" fill="none" stroke="#2c1c0d" strokeOpacity=".8" strokeWidth="8"/>
      <path d="M155 380c-72-34-92-94-44-132 52-40 113 9 116 69M925 380c72-34 92-94 44-132-52-40-113 9-116 69M155 1320c-72 34-92 94-44 132 52 40 113-9 116-69M925 1320c72 34 92 94 44 132-52 40-113-9-116-69" fill="none" stroke="#d6aa43" strokeWidth="20" strokeLinecap="round"/>
      <circle cx="155" cy="290" r="28" fill="#e4bd5d"/><circle cx="925" cy="290" r="28" fill="#e4bd5d"/><circle cx="155" cy="1410" r="28" fill="#e4bd5d"/><circle cx="925" cy="1410" r="28" fill="#e4bd5d"/>
    </g>
  </svg>
);

export const RoanokeIslandMap: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <defs>
      <filter id="roughMapA"><feTurbulence type="fractalNoise" baseFrequency=".018" numOctaves="4" seed="4" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="11"/></filter>
      <radialGradient id="paperMapA"><stop stopColor="#ead8ad"/><stop offset="1" stopColor="#aa8350"/></radialGradient>
    </defs>
    <rect x="115" y="225" width="850" height="1260" rx="22" fill="url(#paperMapA)" stroke="#291b10" strokeWidth="10" transform="rotate(-2 540 855)"/>
    <g filter="url(#roughMapA)" transform="translate(0 10)">
      <path d="M275 495c145-95 268-64 350-4 76 56 145 49 220 14-24 116-69 216-165 278-83 54-123 121-142 224-23 129-105 239-228 305 38-121 48-231 5-336-48-119-89-256-40-481z" fill="#7d724a" stroke="#302916" strokeWidth="16"/>
      <path d="M248 1045c98-70 177-70 270-11 93 58 190 43 287-31" fill="none" stroke="#294d51" strokeWidth="26" strokeLinecap="round" opacity=".72"/>
      <path d="M340 605c52 30 90 84 99 141M520 795c82 17 129 82 142 164M420 1160c55-43 122-54 189-22" fill="none" stroke="#392c17" strokeWidth="9" strokeDasharray="22 15"/>
      <circle cx="475" cy="930" r="18" fill="#e04329"/><path d="M475 930L720 710" stroke="#e04329" strokeWidth="8" strokeDasharray="18 14"/>
      <text x="500" y="885" fontFamily="Georgia" fontWeight="700" fontSize="44" fill="#21170e">ROANOKE</text>
      <text x="700" y="665" fontFamily="Georgia" fontStyle="italic" fontSize="34" fill="#21170e">Croatoan</text>
      <path d="M300 1330c180 58 350 36 510-35" fill="none" stroke="#2c2115" strokeWidth="6"/>
    </g>
  </svg>
);

export const SailingShip: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(80 570)">
      <path d="M185 680h650l-95 155H320z" fill="#24170e" stroke="#d2b06f" strokeWidth="10"/>
      <path d="M305 680l-66-84h580l-30 84" fill="#56351c"/>
      <path d="M495 90v605M710 250v445M315 315v380" stroke="#25180d" strokeWidth="16"/>
      <path d="M505 120c-105 80-164 180-176 303 68 18 126 20 176 0zM520 135c132 65 210 151 235 261-96 35-174 40-235 20zM720 275c86 50 132 111 148 184-62 19-111 20-148 5zM325 340c-66 37-105 88-116 151 49 16 88 18 116 7z" fill="#dbc79e" stroke="#2e2114" strokeWidth="8"/>
      <path d="M160 865c145-42 281-36 410 14 135 52 263 52 385 0" fill="none" stroke="#b7d5d0" strokeOpacity=".75" strokeWidth="24" strokeLinecap="round"/>
      <path d="M125 910c180-35 330-18 450 33 127 54 244 59 350 15" fill="none" stroke="#7eaaa8" strokeOpacity=".55" strokeWidth="15" strokeLinecap="round"/>
    </g>
  </svg>
);

export const ColonyStockade: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(0 440)">
      <path d="M0 1120V560l70-54 70 54 70-54 70 54 70-54 70 54 70-54 70 54 70-54 70 54 70-54 70 54 70-54 70 54 70-54 70 54v560z" fill="#2d2118"/>
      <path d="M100 1120V670h880v450" fill="#5f472f" stroke="#20170f" strokeWidth="18"/>
      <path d="M155 670L540 390l385 280" fill="#4e3826" stroke="#1d140d" strokeWidth="18"/>
      <rect x="420" y="785" width="240" height="335" fill="#201712"/>
      <rect x="185" y="755" width="150" height="190" fill="#c99b53" opacity=".28"/><rect x="745" y="755" width="150" height="190" fill="#c99b53" opacity=".28"/>
      <path d="M0 1120h1080" stroke="#0d0907" strokeWidth="30"/>
    </g>
  </svg>
);

export const ColonistGroup: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g fill="#18110c" stroke="#d7c296" strokeOpacity=".18" strokeWidth="5">
      <g transform="translate(155 860)"><circle cx="90" cy="80" r="58"/><path d="M20 380c4-170 39-242 70-242s66 72 70 242z"/><path d="M28 190l-75 160M152 190l78 160" stroke="#18110c" strokeWidth="44"/></g>
      <g transform="translate(350 790) scale(1.12)"><circle cx="90" cy="80" r="58"/><path d="M20 380c4-170 39-242 70-242s66 72 70 242z"/><path d="M28 190l-75 160M152 190l78 160" stroke="#18110c" strokeWidth="44"/></g>
      <g transform="translate(575 855) scale(.95)"><circle cx="90" cy="80" r="58"/><path d="M20 380c4-170 39-242 70-242s66 72 70 242z"/><path d="M28 190l-75 160M152 190l78 160" stroke="#18110c" strokeWidth="44"/></g>
      <g transform="translate(760 820) scale(1.05)"><circle cx="90" cy="80" r="58"/><path d="M20 380c4-170 39-242 70-242s66 72 70 242z"/><path d="M28 190l-75 160M152 190l78 160" stroke="#18110c" strokeWidth="44"/></g>
    </g>
  </svg>
);

export const EmptyCabins: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(40 720)" stroke="#1c130d" strokeWidth="12">
      <g><path d="M60 380V170l190-130 190 130v210z" fill="#5f452e"/><path d="M60 170L250 40l190 130" fill="none"/><rect x="215" y="245" width="75" height="135" fill="#17100b"/></g>
      <g transform="translate(500 70) scale(.92)"><path d="M60 380V170l190-130 190 130v210z" fill="#4b3727"/><path d="M60 170L250 40l190 130" fill="none"/><rect x="215" y="245" width="75" height="135" fill="#17100b"/></g>
      <path d="M0 470c170-44 329-36 480 19 166 60 337 65 510 11" fill="none" stroke="#17100b" strokeWidth="36"/>
      <path d="M580 0c-38-120 52-173 2-290 112 90 73 182 125 270" fill="none" stroke="#c6b07b" strokeOpacity=".25" strokeWidth="18"/>
    </g>
  </svg>
);

export const CroatoanPost: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <defs><filter id="postRoughA"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="4" seed="23" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="9"/></filter></defs>
    <g filter="url(#postRoughA)" transform="rotate(1 540 960)">
      <path d="M290 1660L330 245l420 12 38 1403z" fill="#684829" stroke="#21160d" strokeWidth="20"/>
      <path d="M350 385c113-44 232-42 360 6M355 790c120-42 238-39 350 8M350 1205c120-42 242-39 368 10" fill="none" stroke="#3b2919" strokeWidth="13" opacity=".65"/>
      <text x="380" y="925" fontFamily="Georgia" fontWeight="900" fontSize="88" letterSpacing="7" fill="#1a1009" transform="rotate(-1 540 925)">CROATOAN</text>
      <path d="M385 955c150 28 287 26 414-7" fill="none" stroke="#c53d2c" strokeWidth="10" opacity=".75"/>
    </g>
  </svg>
);

export const JohnWhite: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(260 410)">
      <ellipse cx="280" cy="350" rx="150" ry="190" fill="#b18b64" stroke="#1b120c" strokeWidth="12"/>
      <path d="M138 300c10-195 285-258 330-15-88-80-223-84-330 15z" fill="#24170f"/>
      <path d="M120 625c25-151 109-224 160-224 58 0 152 75 184 224l90 650H42z" fill="#231811" stroke="#d1b173" strokeOpacity=".25" strokeWidth="10"/>
      <path d="M210 350c18 11 40 11 58 0M332 350c18 11 40 11 58 0" fill="none" stroke="#231811" strokeWidth="12" strokeLinecap="round"/>
      <path d="M278 390l-18 73 47 4" fill="none" stroke="#3b291a" strokeWidth="10"/>
      <path d="M205 510c46 35 103 35 150 0" fill="none" stroke="#3b291a" strokeWidth="10"/>
      <path d="M92 171h380l-48-100H145z" fill="#19110c"/><ellipse cx="280" cy="165" rx="255" ry="52" fill="#19110c"/>
      <path d="M187 557c16 110 59 161 93 161 39 0 84-54 102-166" fill="none" stroke="#d0b891" strokeWidth="34" opacity=".45"/>
    </g>
  </svg>
);

export const TornJournal: React.FC<LayerProps> = ({style, opacity}) => (
  <svg viewBox="0 0 1080 1920" style={base(style, opacity)}>
    <g transform="translate(120 310) rotate(-4 420 610)">
      <path d="M55 55l725 20 20 980-53 43-36-29-54 31-45-34-47 31-51-37-55 32-55-39-53 32-49-36-52 31-48-37-46 29-56-48z" fill="#e2d1aa" stroke="#2a1d12" strokeWidth="10"/>
      <path d="M120 210h560M120 315h560M120 420h560M120 525h560M120 630h560M120 735h560M120 840h470" stroke="#6a573d" strokeWidth="5" opacity=".42"/>
      <path d="M145 265c95-54 169-38 252 8 75 42 157 43 248-8M155 476c124-38 256-34 395 12M150 688c90-48 194-47 310 6" fill="none" stroke="#2b2116" strokeWidth="13" strokeLinecap="round" opacity=".72"/>
      <text x="145" y="160" fontFamily="Georgia" fontStyle="italic" fontWeight="700" fontSize="54" fill="#2b2015">The settlement was empty.</text>
      <circle cx="660" cy="905" r="82" fill="none" stroke="#a73527" strokeWidth="16" opacity=".72"/><path d="M610 900l34 35 78-91" fill="none" stroke="#a73527" strokeWidth="18"/>
    </g>
  </svg>
);
