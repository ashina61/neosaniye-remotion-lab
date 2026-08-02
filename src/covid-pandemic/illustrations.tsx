import React from 'react';

export const VirusMicroscope: React.FC<{size?: number}> = ({size = 360}) => (
  <svg width={size} height={size} viewBox="0 0 360 360">
    <g fill="none" stroke="#71352f" strokeWidth="8" strokeLinecap="round">
      {Array.from({length: 18}).map((_, index) => {
        const angle = (Math.PI * 2 * index) / 18;
        const x1 = 180 + Math.cos(angle) * 92;
        const y1 = 180 + Math.sin(angle) * 92;
        const x2 = 180 + Math.cos(angle) * 126;
        const y2 = 180 + Math.sin(angle) * 126;
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </g>
    {Array.from({length: 18}).map((_, index) => {
      const angle = (Math.PI * 2 * index) / 18;
      const x = 180 + Math.cos(angle) * 132;
      const y = 180 + Math.sin(angle) * 132;
      return <circle key={index} cx={x} cy={y} r="13" fill="#a14b43" stroke="#71352f" strokeWidth="4" />;
    })}
    <circle cx="180" cy="180" r="94" fill="#b75d54" stroke="#71352f" strokeWidth="9" />
    {[
      [136,140,15], [205,123,12], [233,184,17], [180,219,13], [122,207,11], [170,169,10], [211,235,9],
    ].map(([cx, cy, r], index) => (
      <circle key={index} cx={cx} cy={cy} r={r} fill="#dd968a" opacity=".9" />
    ))}
  </svg>
);

export const DecemberCalendar: React.FC = () => (
  <svg width="390" height="320" viewBox="0 0 390 320">
    <path d="M24 34 L366 18 L378 286 L36 302 Z" fill="#eee4ca" stroke="#66513a" strokeWidth="5" />
    <rect x="56" y="62" width="278" height="54" fill="#315d60" />
    <text x="195" y="100" textAnchor="middle" fontFamily="Georgia" fontWeight="700" fontSize="31" fill="#f7f0dc">ARALIK 2019</text>
    {Array.from({length: 4}).map((_, row) =>
      Array.from({length: 7}).map((__, col) => {
        const n = row * 7 + col + 1;
        const x = 70 + col * 39;
        const y = 152 + row * 36;
        return <text key={`${row}-${col}`} x={x} y={y} fontFamily="Arial" fontSize="20" fill="#3c3429">{n}</text>;
      }),
    )}
    <circle cx="304" cy="249" r="26" fill="none" stroke="#9b332d" strokeWidth="7" />
  </svg>
);

export const WorldSpreadMap: React.FC<{routeProgress?: number}> = ({routeProgress = 1}) => (
  <svg width="900" height="590" viewBox="0 0 900 590">
    <path d="M34 70 L842 25 L875 520 L64 558 Z" fill="#e9dfc5" stroke="#66513a" strokeWidth="5" />
    <g fill="#5d8887" stroke="#365c5e" strokeWidth="4">
      <path d="M120 190 L185 125 L282 146 L315 212 L254 258 L143 245 Z" />
      <path d="M315 250 L380 224 L420 270 L392 350 L330 378 L292 317 Z" />
      <path d="M445 165 L522 112 L640 128 L712 190 L682 248 L574 244 L505 215 Z" />
      <path d="M596 280 L667 258 L741 314 L706 396 L621 404 L575 347 Z" />
      <path d="M723 425 L786 399 L823 437 L781 475 L724 468 Z" />
    </g>
    <g fill="none" stroke="#98352f" strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - routeProgress}>
      <path d="M630 215 C560 148 454 128 340 181 C250 221 187 250 130 318" />
      <path d="M628 218 C701 218 760 258 794 327" />
      <path d="M626 219 C600 310 534 376 462 426" />
    </g>
    {[[630,215],[130,318],[794,327],[462,426]].map(([cx,cy], index) => (
      <circle key={index} cx={cx} cy={cy} r={index === 0 ? 14 : 11} fill="#98352f" />
    ))}
  </svg>
);

export const WhoDocument: React.FC = () => (
  <svg width="410" height="380" viewBox="0 0 410 380">
    <path d="M22 20 L386 33 L374 356 L36 342 Z" fill="#f0e6ce" stroke="#66513a" strokeWidth="5" />
    <circle cx="203" cy="94" r="38" fill="none" stroke="#355f62" strokeWidth="6" />
    <path d="M203 60 L203 128 M169 94 L237 94" stroke="#355f62" strokeWidth="5" />
    <text x="203" y="168" textAnchor="middle" fontFamily="Georgia" fontWeight="700" fontSize="28" fill="#2b2923">11 MART 2020</text>
    <text x="203" y="224" textAnchor="middle" fontFamily="Georgia" fontWeight="900" fontSize="46" fill="#92332e">PANDEMİ</text>
    <path d="M72 264 L334 264 M72 292 L306 292 M72 320 L267 320" stroke="#6b5b47" strokeWidth="5" opacity=".55" />
  </svg>
);

export const EmptyStreet: React.FC = () => (
  <svg width="900" height="650" viewBox="0 0 900 650">
    <rect x="0" y="390" width="900" height="260" fill="#5d6868" />
    <polygon points="360,390 540,390 780,650 120,650" fill="#7d8180" />
    <path d="M450 420 L450 630" stroke="#e4d9b8" strokeWidth="10" strokeDasharray="28 30" />
    {[
      [25,180,150,210], [195,130,145,260], [380,190,155,200], [570,112,135,278], [732,170,138,220],
    ].map(([x,y,w,h], index) => (
      <g key={index}>
        <rect x={x} y={y} width={w} height={h} fill={index % 2 ? '#68787b' : '#7d7771'} stroke="#433b34" strokeWidth="4" />
        {Array.from({length: 3}).map((_, row) => Array.from({length: 2}).map((__, col) => (
          <rect key={`${row}-${col}`} x={x + 24 + col * 52} y={y + 35 + row * 48} width="26" height="30" fill="#d9c886" opacity=".62" />
        )))}
      </g>
    ))}
    <rect x="345" y="318" width="210" height="70" fill="#292b2b" />
    <text x="450" y="365" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="34" fill="#f0e6ce">KAPALI</text>
  </svg>
);

export const MaskCloseup: React.FC = () => (
  <svg width="390" height="390" viewBox="0 0 390 390">
    <ellipse cx="195" cy="182" rx="96" ry="116" fill="#e8c5a6" stroke="#765943" strokeWidth="5" />
    <path d="M106 166 Q195 115 284 166 L270 244 Q195 282 120 244 Z" fill="#edf4f4" stroke="#567a7d" strokeWidth="6" />
    <path d="M122 187 L268 187 M128 214 L262 214" stroke="#89a7a8" strokeWidth="4" />
    <path d="M108 178 Q60 171 50 218 M282 178 Q330 171 340 218" fill="none" stroke="#567a7d" strokeWidth="6" />
    <circle cx="160" cy="145" r="8" fill="#332b23" />
    <circle cx="230" cy="145" r="8" fill="#332b23" />
    <path d="M145 110 Q195 72 245 110" fill="none" stroke="#4e3a2c" strokeWidth="18" strokeLinecap="round" />
  </svg>
);

export const ICUScene: React.FC<{monitorProgress?: number}> = ({monitorProgress = 1}) => (
  <svg width="950" height="720" viewBox="0 0 950 720">
    <rect x="52" y="72" width="846" height="592" rx="28" fill="#dfe7e6" stroke="#596d70" strokeWidth="5" />
    <rect x="110" y="394" width="548" height="118" rx="24" fill="#f6f5ef" stroke="#687a7d" strokeWidth="6" />
    <rect x="142" y="352" width="210" height="86" rx="32" fill="#e8d8c5" stroke="#756050" strokeWidth="5" />
    <path d="M334 399 Q430 300 544 389 L606 460 L345 460 Z" fill="#9bb7b7" stroke="#506f72" strokeWidth="5" />
    <rect x="646" y="152" width="178" height="146" rx="16" fill="#1d2b2d" stroke="#62777a" strokeWidth="6" />
    <path d="M668 232 L698 232 L714 195 L742 262 L764 218 L803 218" fill="none" stroke="#7fd2b5" strokeWidth="8" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - monitorProgress} />
    <circle cx="790" cy="180" r="8" fill="#e26358" />
    <rect x="696" y="318" width="80" height="174" rx="18" fill="#f0f3ef" stroke="#687a7d" strokeWidth="5" />
    <rect x="714" y="350" width="44" height="67" fill="#8bc4be" />
    <path d="M739 318 C734 276 694 260 662 292 C636 318 650 347 682 357" fill="none" stroke="#87999a" strokeWidth="8" />
    <g transform="translate(64 58)">
      <circle cx="106" cy="146" r="46" fill="#e1bfa1" stroke="#755b45" strokeWidth="4" />
      <path d="M63 205 Q106 176 149 205 L174 384 L38 384 Z" fill="#eaf3f2" stroke="#59777a" strokeWidth="5" />
      <rect x="59" y="128" width="94" height="42" rx="12" fill="#f7fbfb" stroke="#6d8b8d" strokeWidth="4" />
      <path d="M43 251 L0 333 M169 251 L214 333" stroke="#eaf3f2" strokeWidth="28" strokeLinecap="round" />
      <path d="M44 96 Q106 48 168 96" fill="none" stroke="#384149" strokeWidth="22" strokeLinecap="round" />
    </g>
  </svg>
);

export const VaccineLab: React.FC<{chartProgress?: number; syringeShift?: number}> = ({chartProgress = 1, syringeShift = 0}) => (
  <svg width="950" height="710" viewBox="0 0 950 710">
    <rect x="80" y="128" width="222" height="394" rx="32" fill="#eef5f4" stroke="#577477" strokeWidth="6" />
    <rect x="124" y="84" width="134" height="70" rx="12" fill="#6e8587" stroke="#43595b" strokeWidth="5" />
    <rect x="115" y="268" width="152" height="164" rx="12" fill="#7ab6ad" opacity=".9" />
    <text x="191" y="330" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="34" fill="#1f3e3f">COVID-19</text>
    <text x="191" y="375" textAnchor="middle" fontFamily="Arial" fontWeight="700" fontSize="28" fill="#1f3e3f">AŞI</text>
    <g transform={`translate(${syringeShift} 0)`}>
      <rect x="356" y="275" width="324" height="92" rx="22" fill="#f4f8f8" stroke="#58777a" strokeWidth="6" />
      <rect x="514" y="290" width="112" height="62" fill="#82bbb2" />
      <rect x="680" y="302" width="132" height="40" fill="#f4f8f8" stroke="#58777a" strokeWidth="6" />
      <path d="M812 322 L902 322" stroke="#4b5558" strokeWidth="6" />
      <path d="M332 320 L356 320" stroke="#4b5558" strokeWidth="11" />
      {Array.from({length: 6}).map((_, index) => <path key={index} d={`M${405 + index * 42} 290 L${405 + index * 42} 352`} stroke="#6a8587" strokeWidth="3" />)}
    </g>
    <rect x="344" y="456" width="472" height="170" fill="#eee4ca" stroke="#685440" strokeWidth="5" />
    <path d="M382 579 L460 540 L536 551 L621 486 L700 503 L778 470" fill="none" stroke="#315d60" strokeWidth="8" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - chartProgress} />
    <path d="M378 598 L790 598 M378 598 L378 478" stroke="#665848" strokeWidth="4" />
  </svg>
);

export const LegacyPanels: React.FC = () => (
  <svg width="950" height="760" viewBox="0 0 950 760">
    <g>
      <rect x="36" y="42" width="404" height="285" rx="18" fill="#e8ddbd" stroke="#65513e" strokeWidth="5" />
      <rect x="92" y="94" width="292" height="166" rx="12" fill="#354f52" />
      <circle cx="238" cy="160" r="42" fill="#d9b99d" />
      <rect x="192" y="203" width="92" height="36" rx="12" fill="#86a5a4" />
      <path d="M74 278 L406 278" stroke="#8a7253" strokeWidth="8" />
      <text x="238" y="309" textAnchor="middle" fontFamily="Georgia" fontSize="27" fontWeight="700" fill="#30291f">UZAKTAN ÇALIŞMA</text>
    </g>
    <g>
      <rect x="510" y="42" width="404" height="285" rx="18" fill="#e8ddbd" stroke="#65513e" strokeWidth="5" />
      <rect x="564" y="90" width="296" height="172" rx="12" fill="#f4f1e6" stroke="#637477" strokeWidth="5" />
      <path d="M596 128 L694 128 M596 164 L822 164 M596 200 L780 200" stroke="#527274" strokeWidth="8" />
      <circle cx="805" cy="118" r="26" fill="#9c3a34" />
      <text x="712" y="309" textAnchor="middle" fontFamily="Georgia" fontSize="27" fontWeight="700" fill="#30291f">DİJİTAL EĞİTİM</text>
    </g>
    <g>
      <rect x="36" y="408" width="404" height="285" rx="18" fill="#e8ddbd" stroke="#65513e" strokeWidth="5" />
      <path d="M100 570 L202 570 L202 526 L304 526 L304 484 L372 484" fill="none" stroke="#4b6f72" strokeWidth="16" />
      <rect x="96" y="586" width="286" height="54" rx="10" fill="#8d5f3f" />
      <circle cx="146" cy="648" r="20" fill="#292b2b" />
      <circle cx="332" cy="648" r="20" fill="#292b2b" />
      <text x="238" y="679" textAnchor="middle" fontFamily="Georgia" fontSize="25" fontWeight="700" fill="#30291f">TEDARİK ZİNCİRİ</text>
    </g>
    <g>
      <rect x="510" y="408" width="404" height="285" rx="18" fill="#e8ddbd" stroke="#65513e" strokeWidth="5" />
      <rect x="676" y="500" width="72" height="126" rx="12" fill="#f4ebd0" stroke="#705d45" strokeWidth="5" />
      <path d="M712 494 C678 454 738 424 714 386 C758 430 762 466 712 494 Z" fill="#d18d3c" stroke="#8d4d2e" strokeWidth="4" />
      <ellipse cx="712" cy="640" rx="92" ry="18" fill="#4b3c30" opacity=".25" />
      <text x="712" y="679" textAnchor="middle" fontFamily="Georgia" fontSize="25" fontWeight="700" fill="#30291f">KAYIPLARIN HAFIZASI</text>
    </g>
  </svg>
);
