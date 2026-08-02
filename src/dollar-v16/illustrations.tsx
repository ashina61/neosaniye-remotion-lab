import React from 'react';
import {colors} from './engine';

const stroke = colors.ink;

export const DollarNote: React.FC<{width?: number; serial?: string}> = ({width = 520, serial = 'B 1944 1971'}) => (
  <svg width={width} height={width * 0.44} viewBox="0 0 760 334">
    <path d="M15 30 L735 12 L747 302 L26 322 Z" fill="#b8c6a4" stroke={stroke} strokeWidth="10" />
    <path d="M46 60 L704 43 L716 274 L56 292 Z" fill="#dfe4c6" stroke="#4e6552" strokeWidth="5" />
    <circle cx="380" cy="166" r="92" fill="#bdcda9" stroke="#506852" strokeWidth="8" />
    <circle cx="380" cy="166" r="64" fill="#edf0d9" stroke="#506852" strokeWidth="5" />
    <text x="380" y="188" textAnchor="middle" fontSize="112" fontWeight="900" fill="#355744">$</text>
    <text x="83" y="112" fontSize="76" fontWeight="900" fill="#355744">1</text>
    <text x="640" y="245" fontSize="76" fontWeight="900" fill="#355744">1</text>
    <text x="380" y="77" textAnchor="middle" fontSize="31" fontWeight="900" fill="#355744">UNITED STATES DOLLAR</text>
    <text x="380" y="275" textAnchor="middle" fontSize="24" fontWeight="900" fill="#355744">{serial}</text>
    {[0, 1, 2, 3, 4].map((i) => (
      <path key={i} d={`M${115 + i * 118} 96 C${90 + i * 118} 145 ${90 + i * 118} 206 ${115 + i * 118} 248`} fill="none" stroke="#789078" strokeWidth="3" />
    ))}
  </svg>
);

export const PoundNote: React.FC<{width?: number}> = ({width = 390}) => (
  <svg width={width} height={width * 0.48} viewBox="0 0 620 298">
    <path d="M16 34 L600 12 L610 266 L30 286 Z" fill="#c9b6cf" stroke={stroke} strokeWidth="9" />
    <path d="M43 61 L574 42 L581 238 L54 258 Z" fill="#e5d7e9" stroke="#6d5377" strokeWidth="5" />
    <circle cx="310" cy="150" r="70" fill="#d2c1d7" stroke="#6d5377" strokeWidth="7" />
    <text x="310" y="177" textAnchor="middle" fontSize="94" fontWeight="900" fill="#6b4e75">£</text>
    <text x="95" y="110" fontSize="48" fontWeight="900" fill="#6b4e75">LONDON</text>
    <text x="390" y="224" fontSize="30" fontWeight="900" fill="#6b4e75">STERLING</text>
  </svg>
);

export const GoldBars: React.FC<{width?: number; shine?: number}> = ({width = 430, shine = 0}) => (
  <svg width={width} height={width * 0.72} viewBox="0 0 600 430">
    <defs>
      <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f6df7a" />
        <stop offset=".45" stopColor="#b98724" />
        <stop offset="1" stopColor="#6f4a12" />
      </linearGradient>
    </defs>
    {[
      [55, 250],
      [205, 250],
      [355, 250],
      [125, 145],
      [275, 145],
      [198, 45],
    ].map(([x, y], i) => (
      <g key={i} transform={`translate(${x} ${y})`}>
        <path d="M0 44 L38 0 H170 L204 44 L172 104 H28 Z" fill="url(#gold)" stroke={stroke} strokeWidth="7" />
        <path d="M38 0 L28 104 M170 0 L172 104" stroke="#6f4a12" strokeWidth="4" opacity=".55" />
        <text x="100" y="67" textAnchor="middle" fontSize="24" fontWeight="900" fill="#3e2b12">GOLD</text>
      </g>
    ))}
    <path d="M92 63 L415 330" stroke="#fff6bd" strokeWidth="30" opacity={shine * 0.75} />
  </svg>
);

export const GlobeNetwork: React.FC<{width?: number; progress?: number; centerDollar?: boolean}> = ({
  width = 560,
  progress = 1,
  centerDollar = false,
}) => (
  <svg width={width} height={width} viewBox="0 0 600 600">
    <circle cx="300" cy="300" r="255" fill="#6f999b" stroke={stroke} strokeWidth="10" />
    {[110, 180, 230].map((r) => (
      <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="#cddfda" strokeWidth="4" opacity=".65" />
    ))}
    <path d="M65 300 H535 M300 45 V555 M100 160 C220 250 380 250 500 160 M100 440 C220 350 380 350 500 440" fill="none" stroke="#cddfda" strokeWidth="4" opacity=".65" />
    <path d="M108 238 L176 160 L258 176 L286 254 L218 294 L145 279 Z" fill="#e4d8b3" stroke="#455c5d" strokeWidth="6" />
    <path d="M340 142 L438 128 L497 211 L455 292 L382 282 L320 217 Z" fill="#e4d8b3" stroke="#455c5d" strokeWidth="6" />
    <path d="M346 342 L430 323 L487 407 L438 499 L356 468 L313 395 Z" fill="#e4d8b3" stroke="#455c5d" strokeWidth="6" />
    {[
      [132, 238, 300, 300],
      [420, 188, 300, 300],
      [418, 411, 300, 300],
      [190, 442, 300, 300],
      [300, 68, 300, 300],
    ].map(([x1, y1, x2, y2], i) => (
      <path key={i} d={`M${x1} ${y1} Q${(x1 + x2) / 2 + (i % 2 ? 50 : -50)} ${(y1 + y2) / 2} ${x2} ${y2}`} fill="none" stroke={i % 2 ? colors.red : colors.gold} strokeWidth="9" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    ))}
    {[132, 420, 418, 190, 300].map((x, i) => (
      <circle key={i} cx={x} cy={[238, 188, 411, 442, 68][i]} r="14" fill={i % 2 ? colors.red : colors.gold} stroke={stroke} strokeWidth="5" />
    ))}
    {centerDollar ? (
      <g>
        <circle cx="300" cy="300" r="76" fill="#dce5c7" stroke={stroke} strokeWidth="8" />
        <text x="300" y="333" textAnchor="middle" fontSize="112" fontWeight="900" fill="#365c46">$</text>
      </g>
    ) : null}
  </svg>
);

export const WarFactory: React.FC<{width?: number; smoke?: number}> = ({width = 650, smoke = 0}) => (
  <svg width={width} height={width * 0.62} viewBox="0 0 760 475">
    <rect x="38" y="198" width="674" height="228" rx="12" fill="#61787b" stroke={stroke} strokeWidth="10" />
    <path d="M38 198 L178 107 L178 198 L315 107 L315 198 L452 107 L452 198 L590 112 L590 198" fill="#768e91" stroke={stroke} strokeWidth="10" />
    {[92, 225, 360, 495, 630].map((x) => (
      <g key={x}>
        <rect x={x} y="252" width="76" height="84" fill="#e7d698" stroke={stroke} strokeWidth="7" />
        <path d={`M${x + 38} 252 V336`} stroke="#9b6b2a" strokeWidth="4" />
      </g>
    ))}
    <rect x="82" y="38" width="62" height="165" fill="#4c6063" stroke={stroke} strokeWidth="9" />
    <rect x="625" y="62" width="54" height="142" fill="#4c6063" stroke={stroke} strokeWidth="9" />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={112 + i * 14} cy={28 - i * 25 - smoke * 35} r={30 + i * 13 + smoke * 10} fill="#5a5c58" opacity={0.28 + smoke * 0.35} />
    ))}
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={652 + i * 10} cy={48 - i * 25 - smoke * 28} r={26 + i * 12 + smoke * 9} fill="#5a5c58" opacity={0.25 + smoke * 0.3} />
    ))}
    <path d="M24 426 H736" stroke="#3d4a4b" strokeWidth="18" />
    <path d="M108 400 H650" stroke="#d8c18b" strokeWidth="12" strokeDasharray="35 23" />
  </svg>
);

export const ShippingFleet: React.FC<{width?: number; travel?: number}> = ({width = 620, travel = 0}) => (
  <svg width={width} height={width * 0.54} viewBox="0 0 760 410">
    <path d="M0 305 C205 250 510 330 760 258 V410 H0 Z" fill="#71979a" />
    <path d="M0 326 C220 286 500 354 760 290" fill="none" stroke="#dce9e4" strokeWidth="12" opacity=".65" />
    {[0, 1, 2].map((i) => {
      const x = 42 + i * 230 + travel * (i % 2 ? -75 : 85);
      const y = 170 + i * 35;
      return (
        <g key={i} transform={`translate(${x} ${y}) scale(${i === 1 ? 1.08 : .82})`}>
          <path d="M0 65 H190 L244 102 L210 143 H28 L-12 118 Z" fill="#334e52" stroke={stroke} strokeWidth="7" />
          <rect x="135" y="14" width="58" height="54" fill="#eee4c9" stroke={stroke} strokeWidth="6" />
          <rect x="24" y="42" width="92" height="25" fill={i % 2 ? colors.red : colors.gold} stroke={stroke} strokeWidth="5" />
        </g>
      );
    })}
    <path d="M72 72 C270 9 491 42 688 22" fill="none" stroke={colors.red} strokeWidth="9" strokeDasharray="18 13" />
    <circle cx="72" cy="72" r="14" fill={colors.red} stroke={stroke} strokeWidth="5" />
    <circle cx="688" cy="22" r="14" fill={colors.red} stroke={stroke} strokeWidth="5" />
  </svg>
);

export const ConferenceTable: React.FC<{width?: number; stamp?: number}> = ({width = 650, stamp = 0}) => (
  <svg width={width} height={width * 0.65} viewBox="0 0 760 492">
    <ellipse cx="380" cy="332" rx="315" ry="98" fill="#6d4a2c" stroke={stroke} strokeWidth="11" />
    <ellipse cx="380" cy="304" rx="315" ry="98" fill="#9d7043" stroke={stroke} strokeWidth="11" />
    {[105, 212, 548, 655].map((x, i) => (
      <g key={x}>
        <circle cx={x} cy={145 + (i % 2) * 28} r="36" fill="#d2ad8c" stroke={stroke} strokeWidth="7" />
        <path d={`M${x - 52} ${190 + (i % 2) * 28} Q${x} ${162 + (i % 2) * 28} ${x + 52} ${190 + (i % 2) * 28} V272 H${x - 52} Z`} fill={i < 2 ? '#536d75' : '#69625c'} stroke={stroke} strokeWidth="7" />
      </g>
    ))}
    <g transform="translate(268 234) rotate(-4)">
      <rect width="225" height="132" rx="10" fill={colors.lightPaper} stroke={stroke} strokeWidth="7" />
      <text x="112" y="38" textAnchor="middle" fontSize="28" fontWeight="900" fill={stroke}>BRETTON WOODS</text>
      <path d="M24 61 H201 M24 83 H201 M24 105 H160" stroke="#8f7656" strokeWidth="5" />
      <circle cx="183" cy="105" r={18 + stamp * 16} fill="none" stroke={colors.red} strokeWidth="7" opacity={stamp} />
    </g>
    <path d="M78 425 H682" stroke="#4a3120" strokeWidth="24" strokeLinecap="round" />
  </svg>
);

export const DollarGoldMachine: React.FC<{width?: number; link?: number}> = ({width = 620, link = 1}) => (
  <svg width={width} height={width * 0.58} viewBox="0 0 760 444">
    <g transform="translate(30 78)">
      <rect width="250" height="264" rx="26" fill="#b9c9a9" stroke={stroke} strokeWidth="10" />
      <text x="125" y="174" textAnchor="middle" fontSize="160" fontWeight="900" fill="#355744">$</text>
    </g>
    <g transform="translate(480 92)">
      <path d="M0 96 L42 0 H210 L250 96 L210 236 H38 Z" fill="#d0a43e" stroke={stroke} strokeWidth="10" />
      <text x="125" y="144" textAnchor="middle" fontSize="43" fontWeight="900" fill="#4a3517">GOLD</text>
    </g>
    <path d="M286 207 H474" stroke="#4b3d2b" strokeWidth="28" strokeLinecap="round" />
    {[0, 1, 2, 3].map((i) => (
      <rect key={i} x={306 + i * 42} y="180" width="24" height="54" rx="8" fill={link > i / 4 ? colors.red : '#9a8c74'} stroke={stroke} strokeWidth="5" />
    ))}
    <path d="M310 116 C365 72 420 72 470 116" fill="none" stroke={colors.gold} strokeWidth="10" strokeDasharray="16 12" opacity={link} />
  </svg>
);

export const MarshallFlow: React.FC<{width?: number; progress?: number}> = ({width = 670, progress = 1}) => (
  <svg width={width} height={width * 0.63} viewBox="0 0 760 478">
    <path d="M54 66 L294 22 L360 94 L348 234 L214 302 L74 240 Z" fill="#b9c9a9" stroke={stroke} strokeWidth="9" />
    <text x="203" y="161" textAnchor="middle" fontSize="70" fontWeight="900" fill="#355744">USA</text>
    <path d="M487 50 L694 80 L730 204 L642 320 L512 294 L448 180 Z" fill="#ded3b3" stroke={stroke} strokeWidth="9" />
    <text x="590" y="186" textAnchor="middle" fontSize="52" fontWeight="900" fill={stroke}>EUROPE</text>
    <path d="M315 145 C390 85 432 88 505 142" fill="none" stroke={colors.red} strokeWidth="16" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M494 120 L518 142 L488 153" fill="none" stroke={colors.red} strokeWidth="12" opacity={progress} />
    {[0, 1, 2, 3, 4].map((i) => (
      <g key={i} transform={`translate(${330 + i * 38 * progress} ${88 + Math.sin(i) * 20})`} opacity={progress}>
        <circle r="22" fill="#dce5c7" stroke={stroke} strokeWidth="5" />
        <text y="9" textAnchor="middle" fontSize="30" fontWeight="900" fill="#355744">$</text>
      </g>
    ))}
    <path d="M80 384 C250 328 488 418 700 338" fill="none" stroke={colors.teal} strokeWidth="24" opacity=".35" />
    <path d="M92 384 C260 340 486 424 686 348" fill="none" stroke={colors.gold} strokeWidth="8" strokeDasharray="22 17" />
    <rect x="110" y="335" width="115" height="62" fill="#405e61" stroke={stroke} strokeWidth="6" />
    <rect x="552" y="328" width="118" height="66" fill="#405e61" stroke={stroke} strokeWidth="6" />
  </svg>
);

export const BrokenChain: React.FC<{width?: number; breakProgress?: number}> = ({width = 620, breakProgress = 1}) => (
  <svg width={width} height={width * 0.44} viewBox="0 0 760 334">
    {[0, 1, 2, 3, 4].map((i) => {
      const gap = i >= 3 ? breakProgress * 68 : 0;
      const rot = i >= 3 ? breakProgress * (i % 2 ? 17 : -13) : 0;
      return (
        <g key={i} transform={`translate(${50 + i * 125 + gap} ${165 + (i % 2) * 4}) rotate(${rot})`}>
          <ellipse cx="0" cy="0" rx="72" ry="40" fill="none" stroke={i === 2 ? colors.red : '#66645d'} strokeWidth="24" />
        </g>
      );
    })}
    <path d="M380 54 L346 124 L396 135 L356 258 L445 143 L397 132 L446 61 Z" fill="#f4d35f" stroke={stroke} strokeWidth="8" opacity={breakProgress} />
  </svg>
);

export const OilBarrels: React.FC<{width?: number; rotate?: number}> = ({width = 390, rotate = 0}) => (
  <svg width={width} height={width * 0.78} viewBox="0 0 520 405" style={{transform: `rotate(${rotate}deg)`}}>
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${35 + i * 150} ${110 - (i % 2) * 70})`}>
        <ellipse cx="70" cy="30" rx="64" ry="25" fill="#383d3e" stroke={stroke} strokeWidth="7" />
        <rect x="6" y="30" width="128" height="205" fill="#4b5353" stroke={stroke} strokeWidth="7" />
        <ellipse cx="70" cy="235" rx="64" ry="25" fill="#303637" stroke={stroke} strokeWidth="7" />
        <path d="M12 80 H128 M12 180 H128" stroke="#a06f2f" strokeWidth="8" />
        <path d="M70 93 C36 139 34 171 70 203 C106 171 104 139 70 93 Z" fill={colors.red} />
      </g>
    ))}
  </svg>
);

export const BankNetwork: React.FC<{width?: number; pulse?: number}> = ({width = 620, pulse = 0}) => (
  <svg width={width} height={width * 0.65} viewBox="0 0 760 494">
    {[
      [102, 280],
      [260, 96],
      [478, 94],
      [646, 274],
      [380, 355],
    ].map(([x, y], i) => (
      <g key={i}>
        <path d={`M380 245 L${x} ${y}`} stroke={i % 2 ? colors.gold : colors.teal} strokeWidth="9" strokeDasharray="16 11" opacity={0.55 + pulse * 0.4} />
        <circle cx={x} cy={y} r={45 + pulse * (i === 0 ? 8 : 2)} fill={i === 0 ? '#dce5c7' : colors.lightPaper} stroke={stroke} strokeWidth="7" />
        <text x={x} y={y + 12} textAnchor="middle" fontSize="38" fontWeight="900" fill={i === 0 ? '#355744' : stroke}>{i === 0 ? '$' : i + 1}</text>
      </g>
    ))}
    <g>
      <circle cx="380" cy="245" r="86" fill="#dce5c7" stroke={stroke} strokeWidth="10" />
      <text x="380" y="280" textAnchor="middle" fontSize="115" fontWeight="900" fill="#355744">$</text>
    </g>
  </svg>
);

export const TreasuryBond: React.FC<{width?: number; rise?: number}> = ({width = 420, rise = 1}) => (
  <svg width={width} height={width * 0.67} viewBox="0 0 620 416">
    <path d="M20 28 H598 V388 H20 Z" fill={colors.lightPaper} stroke={stroke} strokeWidth="9" />
    <path d="M52 70 H568 M52 108 H568" stroke="#a38c69" strokeWidth="5" />
    <text x="310" y="95" textAnchor="middle" fontSize="42" fontWeight="900" fill={stroke}>U.S. TREASURY</text>
    <text x="310" y="165" textAnchor="middle" fontSize="82" fontWeight="900" fill="#355744">BOND</text>
    <path d="M62 330 L160 292 L238 307 L320 246 L398 255 L540 160" fill="none" stroke={colors.red} strokeWidth="10" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - rise} />
    <circle cx="540" cy="160" r="14" fill={colors.red} stroke={stroke} strokeWidth="5" opacity={rise} />
  </svg>
);

export const SwiftTerminal: React.FC<{width?: number; progress?: number}> = ({width = 430, progress = 1}) => (
  <svg width={width} height={width * 0.74} viewBox="0 0 620 458">
    <rect x="20" y="20" width="580" height="360" rx="30" fill="#263b3f" stroke={stroke} strokeWidth="10" />
    <rect x="60" y="58" width="500" height="246" rx="12" fill="#122528" stroke="#789693" strokeWidth="6" />
    <text x="310" y="108" textAnchor="middle" fontSize="37" fontWeight="900" fill="#b8d7cc">GLOBAL PAYMENT</text>
    {[0, 1, 2, 3].map((i) => (
      <g key={i} opacity={progress}>
        <circle cx={120 + i * 126} cy={170 + (i % 2) * 56} r="26" fill={i === 2 ? colors.red : colors.gold} />
        {i < 3 ? <path d={`M${146 + i * 126} ${170 + (i % 2) * 56} L${220 + i * 126} ${170 + ((i + 1) % 2) * 56}`} stroke="#b8d7cc" strokeWidth="8" strokeDasharray="12 10" /> : null}
      </g>
    ))}
    <text x="310" y="277" textAnchor="middle" fontSize="66" fontWeight="900" fill="#dce5c7">$</text>
    <rect x="130" y="380" width="360" height="42" rx="15" fill="#5c777a" stroke={stroke} strokeWidth="6" />
  </svg>
);

export const DollarOrbit: React.FC<{width?: number; rotation?: number}> = ({width = 700, rotation = 0}) => (
  <svg width={width} height={width} viewBox="0 0 700 700">
    <circle cx="350" cy="350" r="280" fill="#6f999b" stroke={stroke} strokeWidth="10" />
    <path d="M110 325 C190 160 420 100 584 232 C665 300 630 470 506 548 C355 643 140 545 110 325 Z" fill="#e0d5b3" stroke="#455c5d" strokeWidth="7" />
    {[0, 1, 2].map((i) => (
      <ellipse key={i} cx="350" cy="350" rx={310 - i * 44} ry={135 + i * 36} fill="none" stroke={i % 2 ? colors.red : colors.gold} strokeWidth="8" strokeDasharray="18 15" transform={`rotate(${rotation + i * 58} 350 350)`} />
    ))}
    <circle cx="350" cy="350" r="104" fill="#dce5c7" stroke={stroke} strokeWidth="10" />
    <text x="350" y="394" textAnchor="middle" fontSize="145" fontWeight="900" fill="#355744">$</text>
    {[
      [92, 318],
      [603, 246],
      [562, 536],
      [188, 602],
      [340, 48],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="29" fill={i % 2 ? colors.red : colors.gold} stroke={stroke} strokeWidth="6" />
    ))}
  </svg>
);
