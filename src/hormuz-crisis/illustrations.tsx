import React from 'react';

const ink = '#263234';
const sea = '#5f8589';
const seaDark = '#345f63';
const sand = '#d7c49f';
const paper = '#eee4c9';
const red = '#9c3e35';
const gold = '#a98235';

export const HormuzMap: React.FC<{
  routeProgress?: number;
  blocked?: number;
}> = ({routeProgress = 1, blocked = 0}) => (
  <svg width="780" height="620" viewBox="0 0 780 620">
    <rect width="780" height="620" rx="18" fill="#91aaa8" />
    <path
      d="M0 0 H780 V130 C680 180 640 258 550 290 C470 318 422 330 352 385 C270 450 162 477 0 470 Z"
      fill={sand}
      stroke={ink}
      strokeWidth="8"
    />
    <path
      d="M0 620 V500 C138 498 245 465 340 398 C422 341 486 330 565 308 C655 282 710 230 780 190 V620 Z"
      fill="#cab58f"
      stroke={ink}
      strokeWidth="8"
    />
    <path
      d="M520 0 C570 72 632 118 780 138"
      fill="none"
      stroke="#6f8e91"
      strokeWidth="36"
      opacity=".45"
    />
    <text x="105" y="120" fontSize="48" fontWeight="900" fill={ink}>İRAN</text>
    <text x="520" y="538" fontSize="48" fontWeight="900" fill={ink}>UMMAN</text>
    <text x="35" y="555" fontSize="28" fontWeight="800" fill={seaDark}>BASRA KÖRFEZİ</text>
    <text x="505" y="96" fontSize="28" fontWeight="800" fill={seaDark}>UMMAN KÖRFEZİ</text>
    <path
      d="M95 408 C185 398 256 390 333 365 C415 338 470 319 548 292 C612 270 670 228 728 176"
      fill="none"
      stroke="#f4ecd4"
      strokeWidth="22"
      strokeLinecap="round"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - routeProgress}
    />
    <path
      d="M95 430 C188 420 264 411 342 386 C424 358 482 338 558 310 C625 286 680 246 735 196"
      fill="none"
      stroke={gold}
      strokeWidth="7"
      strokeDasharray="16 13"
      pathLength="1"
      strokeDashoffset={1 - routeProgress}
    />
    <g opacity={blocked}>
      <line x1="426" y1="294" x2="508" y2="392" stroke={red} strokeWidth="18" strokeLinecap="round" />
      <line x1="508" y1="294" x2="426" y2="392" stroke={red} strokeWidth="18" strokeLinecap="round" />
      <circle cx="467" cy="343" r="79" fill="none" stroke={red} strokeWidth="12" />
    </g>
  </svg>
);

export const Tanker: React.FC<{
  width?: number;
  direction?: 'left' | 'right';
  color?: string;
}> = ({width = 360, direction = 'right', color = '#2f474b'}) => {
  const height = width * 0.33;
  return (
    <svg width={width} height={height} viewBox="0 0 360 118" style={{transform: direction === 'left' ? 'scaleX(-1)' : undefined}}>
      <path d="M20 68 H312 L345 83 L320 104 H58 L18 88 Z" fill={color} stroke="#1e292b" strokeWidth="5" />
      <rect x="76" y="42" width="168" height="28" rx="5" fill="#c7aa73" stroke="#1e292b" strokeWidth="4" />
      <rect x="88" y="50" width="36" height="12" fill="#8d6d3e" />
      <rect x="136" y="50" width="36" height="12" fill="#8d6d3e" />
      <rect x="184" y="50" width="36" height="12" fill="#8d6d3e" />
      <rect x="257" y="27" width="42" height="43" rx="4" fill="#e7dfc8" stroke="#1e292b" strokeWidth="4" />
      <rect x="268" y="36" width="20" height="10" fill="#52787d" />
      <rect x="276" y="8" width="8" height="22" fill="#1e292b" />
      <line x1="280" y1="10" x2="313" y2="27" stroke="#1e292b" strokeWidth="4" />
      <path d="M42 105 C98 113 255 113 330 104" fill="none" stroke="#eff5ec" strokeWidth="5" opacity=".65" />
    </svg>
  );
};

export const PatrolBoat: React.FC<{width?: number}> = ({width = 190}) => (
  <svg width={width} height={width * 0.42} viewBox="0 0 190 80">
    <path d="M8 48 H154 L182 58 L163 72 H38 Z" fill="#394d50" stroke="#202b2d" strokeWidth="4" />
    <path d="M65 26 H132 L150 48 H51 Z" fill="#d9d3bf" stroke="#202b2d" strokeWidth="4" />
    <rect x="84" y="32" width="23" height="11" fill="#5f8589" />
    <rect x="114" y="32" width="19" height="11" fill="#5f8589" />
    <line x1="112" y1="25" x2="112" y2="8" stroke="#202b2d" strokeWidth="4" />
    <path d="M10 74 C54 78 131 78 178 71" fill="none" stroke="#f2ead1" strokeWidth="4" />
  </svg>
);

export const OilBarrel: React.FC<{size?: number; label?: string}> = ({size = 145, label = 'OIL'}) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 145 181">
    <ellipse cx="72" cy="24" rx="51" ry="17" fill="#344b4f" stroke="#202b2d" strokeWidth="5" />
    <rect x="21" y="24" width="102" height="132" fill="#46666a" stroke="#202b2d" strokeWidth="5" />
    <ellipse cx="72" cy="156" rx="51" ry="17" fill="#2e4447" stroke="#202b2d" strokeWidth="5" />
    <path d="M22 55 H122 M22 124 H122" stroke="#202b2d" strokeWidth="6" />
    <circle cx="72" cy="90" r="30" fill="#d8c49e" stroke="#202b2d" strokeWidth="4" />
    <text x="72" y="99" textAnchor="middle" fontSize="27" fontWeight="900" fill="#202b2d">{label}</text>
  </svg>
);

export const Gauge20: React.FC<{progress?: number}> = ({progress = 1}) => {
  const angle = -120 + 240 * progress;
  const rad = (angle * Math.PI) / 180;
  const x = 160 + Math.cos(rad) * 92;
  const y = 153 + Math.sin(rad) * 92;
  return (
    <svg width="320" height="235" viewBox="0 0 320 235">
      <path d="M45 155 A115 115 0 0 1 275 155" fill="none" stroke="#3a5559" strokeWidth="30" strokeLinecap="round" />
      <path d="M45 155 A115 115 0 0 1 275 155" fill="none" stroke={red} strokeWidth="30" strokeLinecap="round" pathLength="1" strokeDasharray={`${progress} 1`} />
      <line x1="160" y1="153" x2={x} y2={y} stroke={ink} strokeWidth="10" strokeLinecap="round" />
      <circle cx="160" cy="153" r="15" fill={gold} stroke={ink} strokeWidth="5" />
      <text x="160" y="211" textAnchor="middle" fontSize="48" fontWeight="900" fill={ink}>%20</text>
    </svg>
  );
};

export const StraitMeasure: React.FC<{progress?: number}> = ({progress = 1}) => (
  <svg width="530" height="235" viewBox="0 0 530 235">
    <path d="M45 100 H485" stroke={red} strokeWidth="7" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M45 64 V136 M485 64 V136" stroke={red} strokeWidth="7" />
    <path d="M45 100 L80 82 M45 100 L80 118 M485 100 L450 82 M485 100 L450 118" stroke={red} strokeWidth="7" fill="none" />
    <text x="265" y="69" textAnchor="middle" fontSize="44" fontWeight="900" fill={ink}>34 KM</text>
    <rect x="106" y="148" width="134" height="45" fill={seaDark} />
    <rect x="291" y="148" width="134" height="45" fill={seaDark} />
    <text x="173" y="180" textAnchor="middle" fontSize="25" fontWeight="900" fill="#f7eed7">3,2 KM</text>
    <text x="358" y="180" textAnchor="middle" fontSize="25" fontWeight="900" fill="#f7eed7">3,2 KM</text>
  </svg>
);

export const ClosureBarrier: React.FC<{closeProgress?: number}> = ({closeProgress = 1}) => {
  const rotation = -78 + 78 * closeProgress;
  return (
    <svg width="690" height="260" viewBox="0 0 690 260">
      <rect x="60" y="165" width="65" height="70" rx="8" fill="#394d50" stroke="#202b2d" strokeWidth="6" />
      <g transform={`rotate(${rotation} 105 174)`}>
        <rect x="96" y="148" width="520" height="48" rx="8" fill="#e5ddc7" stroke="#202b2d" strokeWidth="6" />
        {[140, 240, 340, 440, 540].map((x) => (
          <rect key={x} x={x} y="151" width="54" height="42" fill={red} />
        ))}
      </g>
      <circle cx="105" cy="174" r="23" fill={gold} stroke="#202b2d" strokeWidth="6" />
    </svg>
  );
};

export const PriceChart: React.FC<{progress?: number}> = ({progress = 1}) => (
  <svg width="470" height="330" viewBox="0 0 470 330">
    <rect x="8" y="8" width="454" height="314" rx="18" fill={paper} stroke={ink} strokeWidth="6" />
    <path d="M65 255 H420 M65 255 V55" stroke={ink} strokeWidth="5" />
    <path
      d="M76 238 C120 231 145 216 178 223 C222 232 241 188 274 176 C307 164 323 121 351 108 C376 96 392 62 416 48"
      fill="none"
      stroke={red}
      strokeWidth="10"
      strokeLinecap="round"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - progress}
    />
    <text x="79" y="47" fontSize="31" fontWeight="900" fill={ink}>PETROL FİYATI</text>
    <text x="326" y="287" fontSize="23" fontWeight="800" fill={ink}>ZAMAN</text>
  </svg>
);

export const PipelineBypass: React.FC<{progress?: number}> = ({progress = 1}) => (
  <svg width="510" height="300" viewBox="0 0 510 300">
    <path d="M42 148 H463" stroke="#6d5230" strokeWidth="45" strokeLinecap="round" opacity=".25" />
    <path d="M42 148 H463" stroke={seaDark} strokeWidth="22" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    {[52, 158, 264, 370, 452].map((x) => (
      <circle key={x} cx={x} cy="148" r="27" fill={paper} stroke={ink} strokeWidth="5" />
    ))}
    <path d="M193 148 C210 94 247 69 294 58" fill="none" stroke={gold} strokeWidth="14" strokeLinecap="round" />
    <path d="M286 44 L313 58 L294 82" fill={gold} stroke={ink} strokeWidth="4" />
    <text x="255" y="258" textAnchor="middle" fontSize="30" fontWeight="900" fill={ink}>ALTERNATİF HATLAR SINIRLI</text>
  </svg>
);

export const RadioCard: React.FC<{pulse?: number}> = ({pulse = 0}) => (
  <svg width="300" height="205" viewBox="0 0 300 205">
    <rect x="7" y="8" width="286" height="188" rx="16" fill={paper} stroke={ink} strokeWidth="5" />
    <text x="28" y="42" fontSize="27" fontWeight="900" fill={ink}>VHF 16</text>
    <path d="M31 81 H267 M31 116 H267 M31 151 H220" stroke="#8e7b5e" strokeWidth="5" strokeDasharray="12 9" />
    <circle cx="247" cy="154" r={14 + pulse * 15} fill="none" stroke={red} strokeWidth="5" opacity={1 - pulse * 0.55} />
    <circle cx="247" cy="154" r="9" fill={red} />
  </svg>
);

export const NegotiationTable: React.FC<{openProgress?: number}> = ({openProgress = 0}) => (
  <svg width="720" height="420" viewBox="0 0 720 420">
    <rect x="115" y="238" width="490" height="95" rx="18" fill="#5e4a31" stroke={ink} strokeWidth="7" />
    <rect x="145" y="328" width="38" height="75" fill="#5e4a31" />
    <rect x="537" y="328" width="38" height="75" fill="#5e4a31" />
    <path d="M262 197 H458 V286 H262 Z" fill={paper} stroke={ink} strokeWidth="5" />
    <path d="M286 220 H435 M286 244 H418 M286 268 H390" stroke="#8d7b61" strokeWidth="4" />
    <circle cx="195" cy="160" r="55" fill="#d1b08c" stroke={ink} strokeWidth="5" />
    <path d="M131 262 C136 205 159 180 195 180 C234 180 257 208 262 262" fill="#394d50" stroke={ink} strokeWidth="5" />
    <circle cx="525" cy="160" r="55" fill="#d1b08c" stroke={ink} strokeWidth="5" />
    <path d="M458 262 C464 205 487 180 525 180 C563 180 588 208 592 262" fill="#684139" stroke={ink} strokeWidth="5" />
    <path d={`M326 303 H${326 + 155 * openProgress}`} stroke={gold} strokeWidth="12" strokeLinecap="round" />
    <circle cx={326 + 155 * openProgress} cy="303" r="13" fill={gold} stroke={ink} strokeWidth="4" />
  </svg>
);

export const WorldImpact: React.FC = () => (
  <svg width="460" height="340" viewBox="0 0 460 340">
    <circle cx="215" cy="170" r="130" fill="#77999a" stroke={ink} strokeWidth="7" />
    <path d="M115 104 C150 65 205 69 225 100 C203 127 158 128 123 145 Z" fill={paper} stroke={ink} strokeWidth="4" />
    <path d="M245 92 C299 87 337 117 326 150 C294 158 269 150 243 130 Z" fill={paper} stroke={ink} strokeWidth="4" />
    <path d="M126 192 C164 177 200 198 199 231 C179 259 149 267 122 243 Z" fill={paper} stroke={ink} strokeWidth="4" />
    <path d="M250 195 C287 179 325 193 343 224 C325 259 289 270 259 245 Z" fill={paper} stroke={ink} strokeWidth="4" />
    {[20, 95, 170, 245, 320].map((angle) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 215 + Math.cos(rad) * 145;
      const y1 = 170 + Math.sin(rad) * 145;
      const x2 = 215 + Math.cos(rad) * 195;
      const y2 = 170 + Math.sin(rad) * 195;
      return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke={red} strokeWidth="8" strokeLinecap="round" />;
    })}
  </svg>
);

export const AlertSeal: React.FC<{text?: string}> = ({text = 'KAPALI'}) => (
  <svg width="210" height="210" viewBox="0 0 210 210">
    <circle cx="105" cy="105" r="91" fill="none" stroke={red} strokeWidth="10" />
    <circle cx="105" cy="105" r="68" fill="none" stroke={red} strokeWidth="4" strokeDasharray="12 8" />
    <text x="105" y="118" textAnchor="middle" fontSize="42" fontWeight="900" fill={red}>{text}</text>
  </svg>
);
