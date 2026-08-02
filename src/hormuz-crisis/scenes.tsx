import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  Cutout,
  FadeToBlack,
  Label,
  PaperStage,
  SceneAudio,
  Tape,
  progress,
  smooth,
  useCardSpring,
  usePaperFrame,
} from './engine';
import {
  AlertSeal,
  ClosureBarrier,
  Gauge20,
  HormuzMap,
  NegotiationTable,
  OilBarrel,
  PatrolBoat,
  PipelineBypass,
  PriceChart,
  RadioCard,
  Tanker,
  WorldImpact,
} from './illustrations';

const ink = '#263234';
const paper = '#eee4c9';
const red = '#9c3e35';
const teal = '#345f63';
const gold = '#a98235';

const SafeHeadline: React.FC<{
  title: string;
  subtitle: string;
  subtitleColor?: 'red' | 'teal' | 'gold' | 'paper';
  titleSize?: number;
}> = ({title, subtitle, subtitleColor = 'red', titleSize = 62}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <Tape style={{left: 48, top: 76, transform: 'rotate(-12deg)'}} />
    <Label
      big
      style={{
        left: 78,
        top: 110,
        fontSize: titleSize,
        transform: 'rotate(-1.4deg)',
        maxWidth: 900,
      }}
    >
      {title}
    </Label>
    <Label
      color={subtitleColor}
      style={{
        left: 96,
        top: 226,
        fontSize: 31,
        transform: 'rotate(1.4deg)',
      }}
    >
      {subtitle}
    </Label>
  </AbsoluteFill>
);

const RadarConsole: React.FC<{frame: number; blocked?: number}> = ({frame, blocked = 0}) => {
  const angle = (frame * 2.4) % 360;
  const rad = (angle * Math.PI) / 180;
  return (
    <svg width="760" height="650" viewBox="0 0 760 650">
      <rect x="8" y="8" width="744" height="634" rx="28" fill="#263638" stroke="#1b2527" strokeWidth="10" />
      <rect x="42" y="42" width="520" height="520" rx="260" fill="#183034" stroke="#9eb1aa" strokeWidth="6" />
      {[82, 162, 242].map((radius) => (
        <circle key={radius} cx="302" cy="302" r={radius} fill="none" stroke="#668f8a" strokeWidth="4" strokeDasharray="12 9" opacity=".7" />
      ))}
      <path d="M112 338 C180 310 236 300 298 264 C360 228 410 206 485 158" fill="none" stroke="#d8c49e" strokeWidth="24" strokeLinecap="round" opacity=".6" />
      <path d="M115 357 C182 330 244 322 309 286 C371 251 425 229 500 180" fill="none" stroke={gold} strokeWidth="8" strokeDasharray="16 12" />
      <line x1="302" y1="302" x2={302 + Math.cos(rad) * 242} y2={302 + Math.sin(rad) * 242} stroke="#d76455" strokeWidth="10" strokeLinecap="round" opacity=".9" />
      <circle cx="421" cy="228" r={12 + blocked * 13} fill={red} />
      <circle cx="421" cy="228" r={30 + blocked * 22} fill="none" stroke={red} strokeWidth="7" opacity={0.85} />
      <line x1="389" y1="195" x2="453" y2="259" stroke={red} strokeWidth="12" strokeLinecap="round" opacity={blocked} />
      <line x1="453" y1="195" x2="389" y2="259" stroke={red} strokeWidth="12" strokeLinecap="round" opacity={blocked} />
      <rect x="590" y="62" width="126" height="196" rx="15" fill="#e9dfc3" stroke="#151d1f" strokeWidth="6" />
      <text x="653" y="104" textAnchor="middle" fontSize="27" fontWeight="900" fill={ink}>VHF</text>
      <path d="M610 136 H696 M610 166 H696 M610 196 H680" stroke="#7f725d" strokeWidth="5" strokeDasharray="10 8" />
      <circle cx="654" cy="224" r="13" fill={red} />
      <rect x="590" y="292" width="126" height="270" rx="15" fill="#1b292b" stroke="#151d1f" strokeWidth="6" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index}>
          <circle cx={620 + (index % 2) * 61} cy={333 + Math.floor(index / 2) * 82} r="22" fill={index === 0 ? red : '#6d8581'} stroke="#d8c49e" strokeWidth="4" />
          <rect x={603 + (index % 2) * 61} y={370 + Math.floor(index / 2) * 82} width="35" height="8" fill="#d8c49e" opacity=".65" />
        </g>
      ))}
      <text x="302" y="608" textAnchor="middle" fontSize="30" fontWeight="900" fill="#e9dfc3">HÜRMÜZ TRAFİK KONTROLÜ</text>
    </svg>
  );
};

const TankerBow: React.FC<{width?: number; direction?: 'left' | 'right'}> = ({width = 780, direction = 'right'}) => (
  <svg width={width} height={width * 0.47} viewBox="0 0 820 385" style={{transform: direction === 'left' ? 'scaleX(-1)' : undefined}}>
    <path d="M-30 198 H670 L820 270 L742 348 H120 L-25 300 Z" fill="#2e4549" stroke="#172326" strokeWidth="10" />
    <path d="M58 180 H590 V225 H58 Z" fill="#bd9b61" stroke="#172326" strokeWidth="8" />
    {[95, 205, 315, 425].map((x) => (
      <g key={x}>
        <rect x={x} y="150" width="76" height="30" rx="7" fill="#8f6938" stroke="#172326" strokeWidth="6" />
        <circle cx={x + 38} cy="150" r="18" fill="#d8c49e" stroke="#172326" strokeWidth="5" />
      </g>
    ))}
    <path d="M110 140 C210 85 380 85 560 135" fill="none" stroke="#263234" strokeWidth="13" />
    <path d="M122 140 V96 M236 119 V78 M356 108 V68 M480 119 V77" stroke="#263234" strokeWidth="9" />
    <rect x="594" y="63" width="116" height="135" rx="8" fill="#e8dfc7" stroke="#172326" strokeWidth="9" />
    <rect x="616" y="89" width="72" height="28" fill="#567d82" stroke="#172326" strokeWidth="5" />
    <rect x="626" y="128" width="25" height="22" fill="#9c3e35" />
    <rect x="662" y="128" width="25" height="22" fill="#9c3e35" />
    <line x1="654" y1="63" x2="654" y2="20" stroke="#172326" strokeWidth="9" />
    <line x1="654" y1="24" x2="733" y2="68" stroke="#172326" strokeWidth="7" />
    <path d="M42 337 C170 368 612 373 772 342" fill="none" stroke="#f4ecd4" strokeWidth="14" opacity=".75" />
    <path d="M52 360 C180 387 610 391 750 363" fill="none" stroke="#9bb2ae" strokeWidth="7" opacity=".7" />
  </svg>
);

const NavigationLane: React.FC<{progress?: number; opacity?: number}> = ({progress = 1, opacity = .72}) => (
  <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, opacity}}>
    <path d="M190 1690 L460 920" stroke="#f0e6ca" strokeWidth="18" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M890 1690 L620 920" stroke="#f0e6ca" strokeWidth="18" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M540 1660 V955" stroke={gold} strokeWidth="8" strokeDasharray="26 20" pathLength="1" strokeDashoffset={1 - progress} />
    {[1180, 1360, 1540].map((y, index) => (
      <g key={y} opacity={progress}>
        <circle cx={315 - index * 32} cy={y} r="17" fill={red} stroke={ink} strokeWidth="5" />
        <circle cx={765 + index * 32} cy={y} r="17" fill={teal} stroke={ink} strokeWidth="5" />
      </g>
    ))}
  </svg>
);

const ApproxMeasure: React.FC<{progress: number}> = ({progress}) => (
  <svg width="620" height="255" viewBox="0 0 620 255">
    <path d="M54 112 H566" stroke={red} strokeWidth="8" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M54 73 V151 M566 73 V151" stroke={red} strokeWidth="8" />
    <path d="M54 112 L94 90 M54 112 L94 134 M566 112 L526 90 M566 112 L526 134" stroke={red} strokeWidth="8" fill="none" />
    <text x="310" y="75" textAnchor="middle" fontSize="48" fontWeight="900" fill={ink}>≈ 34 KM</text>
    <rect x="120" y="170" width="160" height="50" rx="8" fill={teal} />
    <rect x="340" y="170" width="160" height="50" rx="8" fill={teal} />
    <text x="200" y="205" textAnchor="middle" fontSize="26" fontWeight="900" fill="#f7eed7">GİDİŞ 3,2 KM</text>
    <text x="420" y="205" textAnchor="middle" fontSize="26" fontWeight="900" fill="#f7eed7">DÖNÜŞ 3,2 KM</text>
  </svg>
);

const OilTerminal: React.FC<{progress: number}> = ({progress}) => (
  <svg width="620" height="360" viewBox="0 0 620 360">
    <path d="M35 212 H580" stroke="#6d5230" strokeWidth="54" strokeLinecap="round" opacity=".25" />
    <path d="M35 212 H580" stroke={teal} strokeWidth="28" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    {[80, 212, 344, 476].map((x) => (
      <g key={x}>
        <circle cx={x} cy="212" r="38" fill={paper} stroke={ink} strokeWidth="7" />
        <path d={`M${x - 18} 212 H${x + 18} M${x} 194 V230`} stroke={red} strokeWidth="7" strokeLinecap="round" />
      </g>
    ))}
    <rect x="72" y="62" width="160" height="112" rx="28" fill="#46666a" stroke={ink} strokeWidth="7" />
    <ellipse cx="152" cy="62" rx="80" ry="25" fill="#344b4f" stroke={ink} strokeWidth="7" />
    <rect x="382" y="48" width="150" height="126" rx="26" fill="#5d4e42" stroke={ink} strokeWidth="7" />
    <ellipse cx="457" cy="48" rx="75" ry="24" fill="#47392f" stroke={ink} strokeWidth="7" />
    <path d="M233 113 C292 92 339 92 382 112" fill="none" stroke={gold} strokeWidth="16" strokeLinecap="round" />
    <text x="310" y="322" textAnchor="middle" fontSize="31" fontWeight="900" fill={ink}>TANKER → TERMİNAL → BORU HATTI</text>
  </svg>
);

const TreatyDocuments: React.FC<{progress: number}> = ({progress}) => (
  <svg width="520" height="300" viewBox="0 0 520 300">
    <g transform={`translate(${(1 - progress) * -130} 0) rotate(-5 170 150)`}>
      <path d="M38 35 H275 L310 70 V264 H38 Z" fill={paper} stroke={ink} strokeWidth="7" />
      <path d="M275 35 V70 H310" fill="#d9c8a5" stroke={ink} strokeWidth="7" />
      <path d="M72 98 H270 M72 136 H252 M72 174 H264 M72 212 H225" stroke="#8f7d62" strokeWidth="6" />
      <circle cx="244" cy="229" r="27" fill="none" stroke={red} strokeWidth="7" />
    </g>
    <g transform={`translate(${(1 - progress) * 150} 0) rotate(7 370 150)`}>
      <rect x="280" y="62" width="205" height="206" rx="16" fill="#e8dfc7" stroke={ink} strokeWidth="7" />
      <path d="M315 115 H448 M315 154 H448 M315 193 H420" stroke="#8f7d62" strokeWidth="6" />
      <path d="M324 236 C350 216 376 250 406 224 C430 205 446 213 466 221" fill="none" stroke={teal} strokeWidth="8" />
    </g>
    <path d={`M228 267 H${228 + progress * 116}`} stroke={gold} strokeWidth="12" strokeLinecap="round" />
  </svg>
);

export const Scene1ClosureAlert: React.FC = () => {
  const {frame, stepped} = usePaperFrame();
  const consoleIn = useCardSpring(0, 18, 92);
  const sealIn = useCardSpring(70, 16, 118);
  const radioIn = useCardSpring(42, 18, 104);
  const blocked = smooth(progress(frame, 58, 126));
  const patrolShift = Math.sin(stepped * 0.1) * 18;
  const camera = interpolate(frame, [0, 225], [1.0, 1.045]);

  return (
    <PaperStage tone="warning">
      <SceneAudio scene={1} sfx={[{from: 18, src: 'radio-alert.wav', volume: 0.28}]} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <Cutout
          accent="red"
          style={{
            left: 92,
            top: 335,
            opacity: consoleIn,
            transform: `translateY(${interpolate(consoleIn, [0, 1], [520, 0])}px) rotate(-1deg) scale(1.06)`,
          }}
        >
          <RadarConsole frame={frame} blocked={blocked} />
        </Cutout>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M785 1180 C850 1260 890 1310 930 1415" fill="none" stroke={red} strokeWidth="7" strokeDasharray="16 12" />
          <circle cx="930" cy="1415" r="13" fill={red} />
        </svg>
        <Cutout
          style={{
            right: 48,
            top: 1130,
            opacity: radioIn,
            transform: `translateX(${interpolate(radioIn, [0, 1], [430, 0])}px) rotate(5deg) scale(.92)`,
          }}
        >
          <RadioCard pulse={(Math.sin(frame * 0.22) + 1) / 2} />
        </Cutout>
        <div style={{position: 'absolute', left: -210, bottom: -58, transform: 'rotate(-3deg)'}}>
          <TankerBow width={860} />
        </div>
        <div style={{position: 'absolute', right: 42, bottom: 194, transform: `translateX(${patrolShift}px) rotate(-5deg)`}}>
          <PatrolBoat width={285} />
        </div>
        <div
          style={{
            position: 'absolute',
            right: 72,
            top: 342,
            opacity: sealIn,
            transform: `scale(${interpolate(sealIn, [0, 1], [1.55, 1])}) rotate(${interpolate(sealIn, [0, 1], [-18, 7])}deg)`,
          }}
        >
          <AlertSeal text="İLAN" />
        </div>
      </AbsoluteFill>
      <SafeHeadline title="HÜRMÜZ KRİZİ" subtitle="İRAN KAPANMA İLAN ETTİ" />
    </PaperStage>
  );
};

export const Scene2Geography: React.FC = () => {
  const frame = useCurrentFrame();
  const mapIn = useCardSpring(0, 18, 92);
  const measureIn = useCardSpring(55, 17, 105);
  const route = smooth(progress(frame, 20, 145));
  const measure = smooth(progress(frame, 72, 165));
  const cameraX = interpolate(frame, [0, 225], [20, -18]);
  const cameraScale = interpolate(frame, [0, 225], [1.0, 1.035]);

  return (
    <PaperStage tone="cool">
      <SceneAudio scene={2} />
      <AbsoluteFill style={{transform: `translateX(${cameraX}px) scale(${cameraScale})`, transformOrigin: '50% 58%'}}>
        <NavigationLane progress={route} opacity={0.5} />
        <Cutout
          style={{
            left: 42,
            top: 335,
            opacity: mapIn,
            transform: `translateY(${interpolate(mapIn, [0, 1], [500, 0])}px) rotate(-1deg) scale(1.18)`,
          }}
        >
          <HormuzMap routeProgress={route} blocked={0} />
        </Cutout>
        <Cutout
          accent="red"
          style={{
            left: 72,
            top: 1110,
            opacity: measureIn,
            transform: `translateX(${interpolate(measureIn, [0, 1], [-560, 0])}px) rotate(-3deg)`,
          }}
        >
          <ApproxMeasure progress={measure} />
        </Cutout>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M502 1065 C470 1125 425 1160 365 1195" fill="none" stroke={red} strokeWidth="7" strokeLinecap="round" />
          <path d="M354 1180 L365 1195 L345 1198" fill="none" stroke={red} strokeWidth="7" strokeLinecap="round" />
        </svg>
        <div style={{position: 'absolute', right: -250, bottom: -92, transform: 'rotate(4deg)'}}>
          <TankerBow width={810} direction="left" />
        </div>
      </AbsoluteFill>
      <SafeHeadline title="DÜNYANIN DAR KAPISI" subtitle="İRAN · UMMAN · YAKLAŞIK EN DAR BÖLÜM" titleSize={58} subtitleColor="teal" />
    </PaperStage>
  );
};

export const Scene3EnergyArtery: React.FC = () => {
  const frame = useCurrentFrame();
  const tankerIn = useCardSpring(0, 18, 92);
  const terminalIn = useCardSpring(58, 17, 105);
  const gaugeIn = useCardSpring(95, 17, 108);
  const flow = smooth(progress(frame, 70, 190));
  const gauge = smooth(progress(frame, 42, 165));
  const push = interpolate(frame, [0, 240], [1.0, 1.045]);
  const shipX = interpolate(frame, [0, 240], [-120, 40]);

  return (
    <PaperStage>
      <SceneAudio scene={3} sfx={[{from: 25, src: 'ship-horn.wav', volume: 0.18}]} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 58%'}}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M-80 560 C230 470 540 650 1160 500 V1480 H-80 Z" fill="#708f92" opacity=".8" />
          <path d="M-70 745 C260 650 630 820 1150 675" fill="none" stroke="#e9e0c7" strokeWidth="22" opacity=".38" />
        </svg>
        <div style={{position: 'absolute', left: shipX, top: 430, opacity: tankerIn, transform: 'rotate(-2deg)'}}>
          <TankerBow width={900} />
        </div>
        <Cutout
          accent="teal"
          style={{
            left: 66,
            top: 1040,
            opacity: terminalIn,
            transform: `translateY(${interpolate(terminalIn, [0, 1], [420, 0])}px) rotate(-2deg)`,
          }}
        >
          <OilTerminal progress={flow} />
        </Cutout>
        <Cutout
          accent="red"
          style={{
            right: 58,
            top: 1180,
            opacity: gaugeIn,
            transform: `translateX(${interpolate(gaugeIn, [0, 1], [360, 0])}px) rotate(5deg) scale(1.08)`,
          }}
        >
          <Gauge20 progress={gauge} />
          <div style={{position: 'absolute', left: 82, bottom: 12, fontSize: 20, fontWeight: 900, color: ink}}>YAKLAŞIK PAY</div>
        </Cutout>
        <div style={{position: 'absolute', left: 62, bottom: 64, transform: 'rotate(-5deg)'}}><OilBarrel size={178} /></div>
        <div style={{position: 'absolute', left: 214, bottom: 35, transform: 'rotate(4deg) scale(.88)'}}><OilBarrel size={168} /></div>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M274 1648 C360 1595 420 1518 495 1438" fill="none" stroke={gold} strokeWidth="12" strokeLinecap="round" />
          <path d="M479 1442 L500 1434 L496 1457" fill="none" stroke={gold} strokeWidth="9" />
        </svg>
      </AbsoluteFill>
      <SafeHeadline title="PETROLÜN ANA DAMARI" subtitle="GÜNDE ≈ 20 MİLYON VARİL · ≈ %20" titleSize={60} />
    </PaperStage>
  );
};

export const Scene4ShipsStopped: React.FC = () => {
  const frame = useCurrentFrame();
  const barrierIn = useCardSpring(18, 17, 110);
  const radioIn = useCardSpring(72, 18, 104);
  const close = smooth(progress(frame, 62, 132));
  const turn = smooth(progress(frame, 105, 210));
  const camera = interpolate(frame, [0, 240], [1.0, 1.035]);

  return (
    <PaperStage tone="dark">
      <SceneAudio scene={4} sfx={[{from: 83, src: 'gate-lock.wav', volume: 0.3}]} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <NavigationLane progress={1 - turn * .48} opacity={0.56} />
        <div
          style={{
            position: 'absolute',
            left: 90,
            top: 520,
            opacity: barrierIn,
            transform: `translateY(${interpolate(barrierIn, [0, 1], [500, 0])}px) rotate(-2deg) scale(1.28)`,
          }}
        >
          <ClosureBarrier closeProgress={close} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: interpolate(turn, [0, 1], [46, -360]),
            bottom: 206,
            transform: `rotate(${interpolate(turn, [0, 1], [-2, -16])}deg)`,
          }}
        >
          <TankerBow width={720} direction="left" />
        </div>
        <div
          style={{
            position: 'absolute',
            right: interpolate(turn, [0, 1], [35, -245]),
            bottom: 78,
            transform: `rotate(${interpolate(turn, [0, 1], [4, 17])}deg) scale(.76)`,
          }}
        >
          <Tanker width={520} />
        </div>
        <Cutout
          accent="red"
          style={{
            right: 56,
            top: 1125,
            opacity: radioIn,
            transform: `translateX(${interpolate(radioIn, [0, 1], [430, 0])}px) rotate(5deg)`,
          }}
        >
          <RadioCard pulse={smooth(progress(frame % 45, 0, 44))} />
        </Cutout>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M782 1270 C745 1190 705 1125 648 1042" fill="none" stroke={red} strokeWidth="8" strokeDasharray="18 13" />
          <circle cx="648" cy="1042" r="13" fill={red} />
        </svg>
      </AbsoluteFill>
      <SafeHeadline title="GEMİLER DURDU" subtitle="31 TEMMUZ · İRAN'IN AÇIKLAMASI" subtitleColor="red" />
      <Label color="paper" style={{left: 96, top: 300, fontSize: 27, transform: 'rotate(-1deg)'}}>2 DURDURULDU · 4 GERİ ÇEVRİLDİ</Label>
    </PaperStage>
  );
};

export const Scene5MarketShock: React.FC = () => {
  const frame = useCurrentFrame();
  const chartIn = useCardSpring(0, 18, 92);
  const pipeIn = useCardSpring(58, 17, 106);
  const barrelIn = useCardSpring(35, 18, 108);
  const chart = smooth(progress(frame, 28, 150));
  const pipe = smooth(progress(frame, 92, 205));
  const camera = interpolate(frame, [0, 240], [1.0, 1.04]);
  const barrelRoll = interpolate(smooth(progress(frame, 65, 188)), [0, 1], [0, 280]);

  return (
    <PaperStage tone="warning">
      <SceneAudio scene={5} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <Cutout
          accent="red"
          style={{
            left: 70,
            top: 350,
            opacity: chartIn,
            transform: `translateX(${interpolate(chartIn, [0, 1], [-590, 0])}px) rotate(-2deg) scale(1.35)`,
          }}
        >
          <PriceChart progress={chart} />
        </Cutout>
        <div
          style={{
            position: 'absolute',
            left: 118 + barrelRoll,
            top: 1015,
            opacity: barrelIn,
            transform: `rotate(${barrelRoll * 0.34}deg) scale(1.12)`,
          }}
        >
          <OilBarrel size={188} label="$" />
        </div>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M390 1115 C485 1160 535 1240 560 1330" fill="none" stroke={red} strokeWidth="11" strokeLinecap="round" />
          <path d="M548 1313 L562 1333 L574 1311" fill="none" stroke={red} strokeWidth="9" />
        </svg>
        <Cutout
          accent="teal"
          style={{
            left: 96,
            top: 1290,
            opacity: pipeIn,
            transform: `translateY(${interpolate(pipeIn, [0, 1], [420, 0])}px) rotate(1deg) scale(1.22)`,
          }}
        >
          <PipelineBypass progress={pipe} />
        </Cutout>
        <div style={{position: 'absolute', right: -245, bottom: -72, transform: 'rotate(-5deg)'}}>
          <TankerBow width={700} direction="left" />
        </div>
      </AbsoluteFill>
      <SafeHeadline title="DÜNYA FİYATI HİSSETTİ" subtitle="PETROL YÜKSELDİ · ALTERNATİF HATLAR SINIRLI" titleSize={53} />
    </PaperStage>
  );
};

export const Scene6Diplomacy: React.FC = () => {
  const frame = useCurrentFrame();
  const worldIn = useCardSpring(0, 18, 90);
  const tableIn = useCardSpring(55, 17, 104);
  const docsIn = useCardSpring(100, 18, 108);
  const finalIn = useCardSpring(145, 18, 110);
  const open = smooth(progress(frame, 92, 190));
  const zoom = interpolate(frame, [0, 215], [1.0, 1.035], {
    extrapolateRight: 'clamp',
  });
  const dim = interpolate(frame, [210, 285, 330], [0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <PaperStage tone="cool">
      <SceneAudio scene={6} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 58%'}}>
        <Cutout
          style={{
            left: 62,
            top: 365,
            opacity: worldIn,
            transform: `translateX(${interpolate(worldIn, [0, 1], [-520, 0])}px) rotate(-3deg) scale(1.18)`,
          }}
        >
          <WorldImpact />
        </Cutout>
        <Cutout
          accent="gold"
          style={{
            right: 32,
            top: 610,
            opacity: tableIn,
            transform: `translateX(${interpolate(tableIn, [0, 1], [620, 0])}px) rotate(2deg) scale(1.02)`,
          }}
        >
          <NegotiationTable openProgress={open} />
        </Cutout>
        <Cutout
          accent="teal"
          style={{
            left: 86,
            top: 1195,
            opacity: docsIn,
            transform: `translateY(${interpolate(docsIn, [0, 1], [400, 0])}px) rotate(-2deg)`,
          }}
        >
          <TreatyDocuments progress={open} />
        </Cutout>
        <div style={{position: 'absolute', right: -185, bottom: -55, transform: 'rotate(4deg)'}}>
          <TankerBow width={670} />
        </div>
        <Label
          color="red"
          style={{
            left: 92,
            bottom: 112,
            opacity: finalIn,
            transform: `translateY(${interpolate(finalIn, [0, 1], [160, 0])}px) rotate(-2deg)`,
            fontSize: 38,
          }}
        >
          TEK BOĞAZ · KÜRESEL ETKİ
        </Label>
      </AbsoluteFill>
      <SafeHeadline title="ŞİMDİ NE OLACAK?" subtitle="YENİDEN AÇILMA GÖRÜŞMELERİ" titleSize={60} subtitleColor="teal" />
      <AbsoluteFill style={{opacity: dim * 0.16, backgroundColor: '#132023', pointerEvents: 'none'}} />
      <FadeToBlack from={285} to={330} />
    </PaperStage>
  );
};
