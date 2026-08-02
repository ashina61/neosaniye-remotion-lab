import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  Cutout,
  FadeToBlack,
  Label,
  PaperStage,
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
const sea = '#6f9194';
const darkSea = '#213638';

const Headline: React.FC<{
  title: string;
  subtitle: string;
  titleSize?: number;
  subtitleColor?: 'red' | 'teal' | 'gold' | 'paper';
}> = ({title, subtitle, titleSize = 60, subtitleColor = 'red'}) => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <Tape style={{left: 46, top: 72, transform: 'rotate(-11deg)'}} />
    <Label
      big
      style={{
        left: 76,
        top: 108,
        fontSize: titleSize,
        maxWidth: 915,
        transform: 'rotate(-1.2deg)',
      }}
    >
      {title}
    </Label>
    <Label
      color={subtitleColor}
      style={{left: 96, top: 222, fontSize: 30, transform: 'rotate(1deg)'}}
    >
      {subtitle}
    </Label>
  </AbsoluteFill>
);

const DetailedTanker: React.FC<{
  width?: number;
  direction?: 'left' | 'right';
  accent?: string;
}> = ({width = 820, direction = 'right', accent = '#bd9b61'}) => (
  <svg
    width={width}
    height={width * 0.46}
    viewBox="0 0 840 388"
    style={{transform: direction === 'left' ? 'scaleX(-1)' : undefined}}
  >
    <path d="M-20 202 H688 L840 273 L758 350 H112 L-28 301 Z" fill="#2d4549" stroke="#172326" strokeWidth="10" />
    <path d="M42 177 H614 V230 H42 Z" fill={accent} stroke="#172326" strokeWidth="8" />
    {[86, 202, 318, 434].map((x) => (
      <g key={x}>
        <rect x={x} y="146" width="82" height="33" rx="7" fill="#8f6938" stroke="#172326" strokeWidth="6" />
        <circle cx={x + 41} cy="146" r="20" fill="#ded0aa" stroke="#172326" strokeWidth="5" />
        <line x1={x + 41} y1="126" x2={x + 41} y2="101" stroke="#172326" strokeWidth="6" />
      </g>
    ))}
    <path d="M100 136 C220 82 392 82 574 134" fill="none" stroke="#263234" strokeWidth="13" />
    <path d="M120 136 V94 M244 114 V70 M368 105 V63 M500 118 V76" stroke="#263234" strokeWidth="9" />
    <rect x="618" y="58" width="120" height="143" rx="8" fill="#e8dfc7" stroke="#172326" strokeWidth="9" />
    <rect x="640" y="84" width="76" height="30" fill="#567d82" stroke="#172326" strokeWidth="5" />
    <rect x="648" y="128" width="28" height="23" fill={red} />
    <rect x="688" y="128" width="28" height="23" fill={red} />
    <line x1="680" y1="58" x2="680" y2="16" stroke="#172326" strokeWidth="9" />
    <line x1="680" y1="21" x2="758" y2="64" stroke="#172326" strokeWidth="7" />
    <path d="M39 338 C184 371 624 376 788 342" fill="none" stroke="#f4ecd4" strokeWidth="15" opacity=".78" />
    <path d="M48 363 C190 391 618 395 766 365" fill="none" stroke="#9bb2ae" strokeWidth="8" opacity=".75" />
  </svg>
);

const RadarBoard: React.FC<{frame: number; blocked: number}> = ({frame, blocked}) => {
  const angle = (frame * 2.15) % 360;
  const rad = (angle * Math.PI) / 180;
  return (
    <svg width="770" height="650" viewBox="0 0 770 650">
      <rect x="8" y="8" width="754" height="634" rx="28" fill="#263638" stroke="#172326" strokeWidth="10" />
      <circle cx="305" cy="306" r="248" fill="#173035" stroke="#9eb1aa" strokeWidth="6" />
      {[82, 164, 244].map((radius) => (
        <circle key={radius} cx="305" cy="306" r={radius} fill="none" stroke="#668f8a" strokeWidth="4" strokeDasharray="13 10" opacity=".72" />
      ))}
      <path d="M116 356 C188 327 244 316 306 280 C372 242 424 219 500 170" fill="none" stroke="#d8c49e" strokeWidth="24" strokeLinecap="round" opacity=".58" />
      <path d="M120 376 C193 347 252 338 318 301 C382 265 439 241 516 191" fill="none" stroke={gold} strokeWidth="8" strokeDasharray="18 14" />
      <line x1="305" y1="306" x2={305 + Math.cos(rad) * 244} y2={306 + Math.sin(rad) * 244} stroke="#d76455" strokeWidth="10" strokeLinecap="round" opacity=".9" />
      <circle cx="433" cy="231" r={13 + blocked * 12} fill={red} />
      <circle cx="433" cy="231" r={30 + blocked * 24} fill="none" stroke={red} strokeWidth="7" opacity=".85" />
      <g opacity={blocked}>
        <line x1="398" y1="196" x2="468" y2="266" stroke={red} strokeWidth="12" strokeLinecap="round" />
        <line x1="468" y1="196" x2="398" y2="266" stroke={red} strokeWidth="12" strokeLinecap="round" />
      </g>
      <rect x="590" y="58" width="132" height="205" rx="16" fill="#e8dfc7" stroke="#151d1f" strokeWidth="6" />
      <text x="656" y="101" textAnchor="middle" fontSize="27" fontWeight="900" fill={ink}>VHF 16</text>
      <path d="M612 137 H700 M612 170 H700 M612 203 H684" stroke="#7f725d" strokeWidth="5" strokeDasharray="10 8" />
      <circle cx="656" cy="232" r="13" fill={red} />
      <rect x="590" y="296" width="132" height="270" rx="16" fill="#1b292b" stroke="#151d1f" strokeWidth="6" />
      {[0, 1, 2, 3].map((index) => (
        <g key={index}>
          <circle cx={620 + (index % 2) * 66} cy={338 + Math.floor(index / 2) * 84} r="23" fill={index === 0 ? red : '#6d8581'} stroke="#d8c49e" strokeWidth="4" />
          <rect x={602 + (index % 2) * 66} y={376 + Math.floor(index / 2) * 84} width="38" height="8" fill="#d8c49e" opacity=".65" />
        </g>
      ))}
      <text x="305" y="608" textAnchor="middle" fontSize="30" fontWeight="900" fill="#e9dfc3">HÜRMÜZ TRAFİK KONTROLÜ</text>
    </svg>
  );
};

const ControlStrip: React.FC<{pulse: number}> = ({pulse}) => (
  <svg width="980" height="300" viewBox="0 0 980 300">
    <path d="M30 110 H950 V260 H30 Z" fill="#263638" stroke="#172326" strokeWidth="9" />
    <rect x="68" y="142" width="260" height="72" rx="12" fill="#e8dfc7" stroke="#172326" strokeWidth="6" />
    <text x="198" y="188" textAnchor="middle" fontSize="26" fontWeight="900" fill={ink}>NAVTEX / VHF UYARISI</text>
    {[394, 478, 562, 646].map((x, index) => (
      <g key={x}>
        <circle cx={x} cy="178" r={22 + (index === 0 ? pulse * 5 : 0)} fill={index === 0 ? red : '#668f8a'} stroke="#d8c49e" strokeWidth="5" />
        <rect x={x - 26} y="224" width="52" height="8" fill="#d8c49e" opacity=".7" />
      </g>
    ))}
    <path d="M724 148 H914 M724 180 H890 M724 212 H920" stroke="#d8c49e" strokeWidth="6" strokeDasharray="14 10" />
    <path d="M118 108 C220 50 390 47 512 95" fill="none" stroke={red} strokeWidth="8" strokeDasharray="16 12" />
  </svg>
);

const SeaCorridor: React.FC<{progress: number; traffic: number}> = ({progress, traffic}) => (
  <svg width="1040" height="900" viewBox="0 0 1040 900">
    <path d="M0 60 C250 170 330 220 444 365 C510 447 530 512 520 900 H0 Z" fill="#d5c39d" stroke={ink} strokeWidth="8" />
    <path d="M1040 45 C830 155 710 231 605 368 C547 445 523 519 520 900 H1040 Z" fill="#c8b48d" stroke={ink} strokeWidth="8" />
    <path d="M444 364 C492 420 512 492 520 900" fill="none" stroke="#f3ead2" strokeWidth="20" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M605 365 C558 425 534 497 520 900" fill="none" stroke="#f3ead2" strokeWidth="20" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M520 440 V900" fill="none" stroke={gold} strokeWidth="8" strokeDasharray="27 22" pathLength="1" strokeDashoffset={1 - progress} />
    <path d="M456 347 H596" stroke={red} strokeWidth="8" strokeDasharray="14 10" opacity={traffic} />
    <g transform={`translate(${70 + traffic * 120} ${650 - traffic * 110}) rotate(-7)`}>
      <path d="M0 58 H245 L306 88 L274 126 H46 L-8 102 Z" fill="#30494d" stroke="#172326" strokeWidth="7" />
      <rect x="64" y="30" width="130" height="30" rx="5" fill="#bd9b61" stroke="#172326" strokeWidth="5" />
      <rect x="205" y="15" width="45" height="45" fill="#e7dfc8" stroke="#172326" strokeWidth="5" />
    </g>
    <g transform={`translate(${690 - traffic * 95} ${730 - traffic * 150}) rotate(8)`}>
      <path d="M0 55 H210 L264 82 L236 116 H38 L-7 94 Z" fill="#3c5458" stroke="#172326" strokeWidth="7" />
      <rect x="58" y="29" width="110" height="27" rx="5" fill="#9c3e35" stroke="#172326" strokeWidth="5" />
      <rect x="174" y="14" width="39" height="42" fill="#e7dfc8" stroke="#172326" strokeWidth="5" />
    </g>
    <text x="112" y="112" fontSize="42" fontWeight="900" fill={ink}>İRAN</text>
    <text x="800" y="116" fontSize="42" fontWeight="900" fill={ink}>UMMAN</text>
  </svg>
);

const MeasureCard: React.FC<{progress: number}> = ({progress}) => (
  <svg width="580" height="240" viewBox="0 0 580 240">
    <path d="M55 105 H525" stroke={red} strokeWidth="8" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - progress} />
    <path d="M55 66 V146 M525 66 V146" stroke={red} strokeWidth="8" />
    <path d="M55 105 L95 83 M55 105 L95 127 M525 105 L485 83 M525 105 L485 127" stroke={red} strokeWidth="8" fill="none" />
    <text x="290" y="68" textAnchor="middle" fontSize="48" fontWeight="900" fill={ink}>≈ 34 KM</text>
    <rect x="102" y="166" width="164" height="51" rx="8" fill={teal} />
    <rect x="314" y="166" width="164" height="51" rx="8" fill={teal} />
    <text x="184" y="201" textAnchor="middle" fontSize="25" fontWeight="900" fill="#f7eed7">GİDİŞ 3,2 KM</text>
    <text x="396" y="201" textAnchor="middle" fontSize="25" fontWeight="900" fill="#f7eed7">DÖNÜŞ 3,2 KM</text>
  </svg>
);

const TerminalNetwork: React.FC<{flow: number}> = ({flow}) => (
  <svg width="900" height="650" viewBox="0 0 900 650">
    <path d="M62 420 H835" stroke="#6d5230" strokeWidth="68" strokeLinecap="round" opacity=".24" />
    <path d="M62 420 H835" stroke={teal} strokeWidth="34" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - flow} />
    {[110, 290, 470, 650, 810].map((x) => (
      <g key={x}>
        <circle cx={x} cy="420" r="43" fill={paper} stroke={ink} strokeWidth="8" />
        <path d={`M${x - 20} 420 H${x + 20} M${x} 400 V440`} stroke={red} strokeWidth="8" strokeLinecap="round" />
      </g>
    ))}
    <rect x="72" y="128" width="210" height="165" rx="38" fill="#46666a" stroke={ink} strokeWidth="8" />
    <ellipse cx="177" cy="128" rx="105" ry="32" fill="#344b4f" stroke={ink} strokeWidth="8" />
    <rect x="352" y="105" width="205" height="188" rx="38" fill="#5d4e42" stroke={ink} strokeWidth="8" />
    <ellipse cx="454" cy="105" rx="102" ry="31" fill="#47392f" stroke={ink} strokeWidth="8" />
    <rect x="640" y="142" width="172" height="151" rx="34" fill="#48656a" stroke={ink} strokeWidth="8" />
    <ellipse cx="726" cy="142" rx="86" ry="28" fill="#30484c" stroke={ink} strokeWidth="8" />
    <path d="M282 208 C318 184 333 177 352 179 M557 180 C602 170 623 176 640 190" fill="none" stroke={gold} strokeWidth="17" strokeLinecap="round" />
    <path d="M168 340 C258 320 327 328 404 352 C500 381 587 342 708 330" fill="none" stroke={gold} strokeWidth="13" strokeDasharray="19 14" pathLength="1" strokeDashoffset={1 - flow} />
    <text x="450" y="575" textAnchor="middle" fontSize="34" fontWeight="900" fill={ink}>TANKER → TERMİNAL → BORU HATTI</text>
  </svg>
);

const TurnbackBoard: React.FC<{close: number; turn: number; pulse: number}> = ({close, turn, pulse}) => (
  <svg width="1000" height="1060" viewBox="0 0 1000 1060">
    <rect width="1000" height="1060" rx="28" fill={darkSea} />
    <path d="M155 980 C160 720 285 565 430 455" fill="none" stroke="#e8dfc7" strokeWidth="19" strokeLinecap="round" />
    <path d="M845 980 C840 720 715 565 570 455" fill="none" stroke="#e8dfc7" strokeWidth="19" strokeLinecap="round" />
    <path d="M500 950 V500" stroke={gold} strokeWidth="8" strokeDasharray="27 22" />
    <g transform="translate(150 395) scale(1.05)">
      <ClosureBarrier closeProgress={close} />
    </g>
    <path d="M286 782 C195 715 165 615 226 535" fill="none" stroke={red} strokeWidth="12" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - turn} />
    <path d="M714 792 C806 720 837 620 777 539" fill="none" stroke={red} strokeWidth="12" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - turn} />
    <path d="M210 545 L229 531 L237 556 M791 549 L774 535 L766 560" fill="none" stroke={red} strokeWidth="10" strokeLinecap="round" opacity={turn} />
    <g transform={`translate(${88 - turn * 110} ${750 - turn * 120}) rotate(${-6 - turn * 12})`}>
      <Tanker width={410} direction="left" color="#2d4549" />
    </g>
    <g transform={`translate(${600 + turn * 105} ${840 - turn * 150}) rotate(${6 + turn * 13})`}>
      <Tanker width={350} direction="right" color="#3d565a" />
    </g>
    <g transform="translate(66 75)">
      <rect width="310" height="175" rx="18" fill={paper} stroke={ink} strokeWidth="7" />
      <text x="28" y="48" fontSize="29" fontWeight="900" fill={ink}>31 TEMMUZ</text>
      <text x="28" y="92" fontSize="30" fontWeight="900" fill={red}>2 DURDURULDU</text>
      <text x="28" y="133" fontSize="30" fontWeight="900" fill={teal}>4 GERİ ÇEVRİLDİ</text>
    </g>
    <g transform="translate(700 82)">
      <circle cx="105" cy="105" r={68 + pulse * 10} fill="none" stroke={red} strokeWidth="8" opacity=".8" />
      <circle cx="105" cy="105" r="46" fill="#17292c" stroke="#e8dfc7" strokeWidth="5" />
      <path d="M105 72 V138 M72 105 H138" stroke={red} strokeWidth="11" strokeLinecap="round" />
    </g>
  </svg>
);

const MarketChain: React.FC<{chart: number; pipe: number; roll: number}> = ({chart, pipe, roll}) => (
  <svg width="1000" height="1180" viewBox="0 0 1000 1180">
    <g transform="translate(70 55) scale(1.65)">
      <PriceChart progress={Math.max(0.12, chart)} />
    </g>
    <path d="M555 560 C630 650 676 724 691 814" fill="none" stroke={red} strokeWidth="14" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - chart} />
    <path d="M678 791 L692 817 L708 793" fill="none" stroke={red} strokeWidth="11" opacity={chart} />
    <g transform={`translate(${160 + roll * 350} 685) rotate(${roll * 210})`}>
      <OilBarrel size={190} label="$" />
    </g>
    <g transform="translate(80 820) scale(1.55)">
      <PipelineBypass progress={pipe} />
    </g>
    <path d="M130 1050 C280 1015 360 1022 510 1080 C670 1142 780 1100 918 1040" fill="none" stroke={gold} strokeWidth="13" strokeDasharray="20 15" opacity={pipe} />
  </svg>
);

const Documents: React.FC<{progress: number}> = ({progress}) => (
  <svg width="570" height="330" viewBox="0 0 570 330">
    <g transform={`translate(${(1 - progress) * -150} 0) rotate(-5 180 160)`}>
      <path d="M34 32 H286 L324 70 V298 H34 Z" fill={paper} stroke={ink} strokeWidth="8" />
      <path d="M286 32 V70 H324" fill="#d9c8a5" stroke={ink} strokeWidth="8" />
      <path d="M72 102 H276 M72 146 H256 M72 190 H272 M72 234 H226" stroke="#8f7d62" strokeWidth="6" />
      <circle cx="252" cy="258" r="30" fill="none" stroke={red} strokeWidth="8" />
    </g>
    <g transform={`translate(${(1 - progress) * 165} 0) rotate(7 414 170)`}>
      <rect x="314" y="65" width="220" height="226" rx="17" fill="#e8dfc7" stroke={ink} strokeWidth="8" />
      <path d="M350 120 H495 M350 164 H495 M350 208 H464" stroke="#8f7d62" strokeWidth="6" />
      <path d="M360 260 C390 236 417 273 449 243 C474 220 496 234 516 244" fill="none" stroke={teal} strokeWidth="9" />
    </g>
    <path d={`M245 307 H${245 + progress * 130}`} stroke={gold} strokeWidth="13" strokeLinecap="round" />
  </svg>
);

export const Scene1ClosureAlertV8: React.FC = () => {
  const {frame, stepped} = usePaperFrame();
  const radarIn = useCardSpring(0, 18, 94);
  const stripIn = useCardSpring(48, 18, 106);
  const sealIn = useCardSpring(72, 16, 116);
  const blocked = smooth(progress(frame, 54, 132));
  const camera = interpolate(frame, [0, 225], [1, 1.035]);
  const patrol = Math.sin(stepped * 0.09) * 16;

  return (
    <PaperStage tone="warning">
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 57%'}}>
        <Cutout
          accent="red"
          style={{left: 76, top: 338, opacity: radarIn, transform: `translateY(${interpolate(radarIn, [0, 1], [480, 0])}px) rotate(-1deg) scale(1.08)`}}
        >
          <RadarBoard frame={frame} blocked={blocked} />
        </Cutout>
        <div style={{position: 'absolute', left: 52, top: 1125, opacity: stripIn, transform: `translateY(${interpolate(stripIn, [0, 1], [360, 0])}px) rotate(-2deg)`}}>
          <ControlStrip pulse={(Math.sin(frame * 0.22) + 1) / 2} />
        </div>
        <div style={{position: 'absolute', left: -205, bottom: -54, transform: 'rotate(-3deg)'}}>
          <DetailedTanker width={850} />
        </div>
        <div style={{position: 'absolute', right: 48, bottom: 205, transform: `translateX(${patrol}px) rotate(-5deg)`}}>
          <PatrolBoat width={290} />
        </div>
        <div style={{position: 'absolute', right: 66, top: 350, opacity: sealIn, transform: `scale(${interpolate(sealIn, [0, 1], [1.6, 1])}) rotate(${interpolate(sealIn, [0, 1], [-20, 7])}deg)`}}>
          <AlertSeal text="İLAN" />
        </div>
      </AbsoluteFill>
      <Headline title="HÜRMÜZ KRİZİ" subtitle="İRAN KAPANMA İLAN ETTİ" />
    </PaperStage>
  );
};

export const Scene2GeographyV8: React.FC = () => {
  const frame = useCurrentFrame();
  const mapIn = useCardSpring(0, 18, 94);
  const corridorIn = useCardSpring(44, 18, 104);
  const measureIn = useCardSpring(78, 17, 108);
  const route = smooth(progress(frame, 18, 150));
  const measure = smooth(progress(frame, 70, 170));
  const traffic = smooth(progress(frame, 65, 205));
  const camera = interpolate(frame, [0, 225], [1, 1.03]);

  return (
    <PaperStage tone="cool">
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <Cutout style={{left: 48, top: 340, opacity: mapIn, transform: `translateY(${interpolate(mapIn, [0, 1], [450, 0])}px) rotate(-1deg) scale(1.17)`}}>
          <HormuzMap routeProgress={route} blocked={0} />
        </Cutout>
        <div style={{position: 'absolute', left: 20, top: 905, opacity: corridorIn, transform: `translateY(${interpolate(corridorIn, [0, 1], [500, 0])}px) rotate(-1deg)`}}>
          <SeaCorridor progress={route} traffic={traffic} />
        </div>
        <Cutout accent="red" style={{right: 42, top: 1025, opacity: measureIn, transform: `translateX(${interpolate(measureIn, [0, 1], [520, 0])}px) rotate(3deg) scale(.9)`}}>
          <MeasureCard progress={measure} />
        </Cutout>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M537 1000 C540 1045 539 1080 530 1130" fill="none" stroke={red} strokeWidth="8" strokeDasharray="17 13" />
          <circle cx="530" cy="1130" r="13" fill={red} />
        </svg>
      </AbsoluteFill>
      <Headline title="DÜNYANIN DAR KAPISI" subtitle="İRAN · UMMAN · EN DAR BÖLÜM ≈ 34 KM" titleSize={57} subtitleColor="teal" />
    </PaperStage>
  );
};

export const Scene3EnergyArteryV8: React.FC = () => {
  const frame = useCurrentFrame();
  const tankerIn = useCardSpring(0, 18, 94);
  const terminalIn = useCardSpring(50, 17, 106);
  const gaugeIn = useCardSpring(88, 17, 108);
  const flow = smooth(progress(frame, 64, 196));
  const gauge = smooth(progress(frame, 38, 164));
  const shipX = interpolate(frame, [0, 240], [-135, 28]);
  const camera = interpolate(frame, [0, 240], [1, 1.035]);

  return (
    <PaperStage>
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M-80 525 C250 430 560 625 1160 475 V1090 H-80 Z" fill={sea} opacity=".83" />
          <path d="M-90 752 C260 645 665 826 1170 658" fill="none" stroke="#e9e0c7" strokeWidth="23" opacity=".42" />
        </svg>
        <div style={{position: 'absolute', left: shipX, top: 410, opacity: tankerIn, transform: 'rotate(-2deg)'}}>
          <DetailedTanker width={920} />
        </div>
        <Cutout accent="teal" style={{left: 54, top: 990, opacity: terminalIn, transform: `translateY(${interpolate(terminalIn, [0, 1], [420, 0])}px) rotate(-2deg) scale(1.04)`}}>
          <TerminalNetwork flow={flow} />
        </Cutout>
        <Cutout accent="red" style={{right: 40, top: 1235, opacity: gaugeIn, transform: `translateX(${interpolate(gaugeIn, [0, 1], [380, 0])}px) rotate(4deg) scale(1.08)`}}>
          <Gauge20 progress={gauge} />
          <div style={{position: 'absolute', left: 76, bottom: 12, fontSize: 20, fontWeight: 900, color: ink}}>YAKLAŞIK KÜRESEL PAY</div>
        </Cutout>
        <div style={{position: 'absolute', left: 48, bottom: 48, transform: 'rotate(-5deg)'}}><OilBarrel size={184} /></div>
        <div style={{position: 'absolute', left: 205, bottom: 22, transform: 'rotate(4deg) scale(.9)'}}><OilBarrel size={174} /></div>
      </AbsoluteFill>
      <Headline title="PETROLÜN ANA DAMARI" subtitle="GÜNDE ≈ 20 MİLYON VARİL · ≈ %20" />
    </PaperStage>
  );
};

export const Scene4ShipsStoppedV8: React.FC = () => {
  const frame = useCurrentFrame();
  const boardIn = useCardSpring(0, 18, 94);
  const radioIn = useCardSpring(76, 18, 104);
  const close = smooth(progress(frame, 48, 126));
  const turn = smooth(progress(frame, 100, 218));
  const pulse = (Math.sin(frame * 0.18) + 1) / 2;
  const camera = interpolate(frame, [0, 240], [1, 1.025]);

  return (
    <PaperStage tone="dark">
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <Cutout accent="red" style={{left: 40, top: 350, opacity: boardIn, transform: `translateY(${interpolate(boardIn, [0, 1], [470, 0])}px) rotate(-1deg) scale(1.02)`}}>
          <TurnbackBoard close={close} turn={turn} pulse={pulse} />
        </Cutout>
        <Cutout accent="red" style={{right: 48, top: 1230, opacity: radioIn, transform: `translateX(${interpolate(radioIn, [0, 1], [430, 0])}px) rotate(5deg) scale(.86)`}}>
          <RadioCard pulse={pulse} />
        </Cutout>
      </AbsoluteFill>
      <Headline title="GEMİLER DURDU" subtitle="31 TEMMUZ · İRAN'IN AÇIKLAMASI" />
    </PaperStage>
  );
};

export const Scene5MarketShockV8: React.FC = () => {
  const frame = useCurrentFrame();
  const chainIn = useCardSpring(0, 18, 94);
  const tankerIn = useCardSpring(105, 18, 106);
  const chart = smooth(progress(frame, 12, 142));
  const pipe = smooth(progress(frame, 86, 212));
  const roll = smooth(progress(frame, 56, 180));
  const camera = interpolate(frame, [0, 240], [1, 1.03]);

  return (
    <PaperStage tone="warning">
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 58%'}}>
        <Cutout accent="red" style={{left: 34, top: 335, opacity: chainIn, transform: `translateY(${interpolate(chainIn, [0, 1], [470, 0])}px) rotate(-1deg) scale(1.01)`}}>
          <MarketChain chart={chart} pipe={pipe} roll={roll} />
        </Cutout>
        <div style={{position: 'absolute', right: -250, bottom: -70, opacity: tankerIn, transform: `translateX(${interpolate(tankerIn, [0, 1], [390, 0])}px) rotate(-5deg)`}}>
          <DetailedTanker width={710} direction="left" />
        </div>
      </AbsoluteFill>
      <Headline title="DÜNYA FİYATI HİSSETTİ" subtitle="PETROL YÜKSELDİ · ALTERNATİF HATLAR SINIRLI" titleSize={53} />
    </PaperStage>
  );
};

export const Scene6DiplomacyV8: React.FC = () => {
  const frame = useCurrentFrame();
  const worldIn = useCardSpring(0, 18, 92);
  const tableIn = useCardSpring(48, 17, 104);
  const docsIn = useCardSpring(96, 17, 108);
  const finalIn = useCardSpring(145, 18, 110);
  const open = smooth(progress(frame, 86, 184));
  const zoom = interpolate(frame, [0, 205], [1, 1.03], {extrapolateRight: 'clamp'});
  const holdDim = interpolate(frame, [255, 300, 330], [0, 0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <PaperStage tone="cool">
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 57%'}}>
        <Cutout style={{left: 46, top: 350, opacity: worldIn, transform: `translateX(${interpolate(worldIn, [0, 1], [-520, 0])}px) rotate(-3deg) scale(1.15)`}}>
          <WorldImpact />
        </Cutout>
        <Cutout accent="gold" style={{right: 22, top: 575, opacity: tableIn, transform: `translateX(${interpolate(tableIn, [0, 1], [650, 0])}px) rotate(2deg) scale(1.03)`}}>
          <NegotiationTable openProgress={open} />
        </Cutout>
        <Cutout accent="teal" style={{left: 64, top: 1175, opacity: docsIn, transform: `translateY(${interpolate(docsIn, [0, 1], [390, 0])}px) rotate(-2deg)`}}>
          <Documents progress={open} />
        </Cutout>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d="M250 870 C400 840 545 904 690 865 C805 834 858 749 909 661" fill="none" stroke={gold} strokeWidth="13" strokeDasharray="22 16" pathLength="1" strokeDashoffset={1 - open} />
          <path d="M892 672 L912 657 L917 682" fill="none" stroke={gold} strokeWidth="10" opacity={open} />
        </svg>
        <div style={{position: 'absolute', right: -170, bottom: -50, transform: 'rotate(4deg)'}}>
          <DetailedTanker width={660} />
        </div>
        <Label color="red" style={{left: 86, bottom: 102, opacity: finalIn, transform: `translateY(${interpolate(finalIn, [0, 1], [170, 0])}px) rotate(-2deg)`, fontSize: 38}}>
          TEK BOĞAZ · KÜRESEL ETKİ
        </Label>
      </AbsoluteFill>
      <Headline title="ŞİMDİ NE OLACAK?" subtitle="YENİDEN AÇILMA GÖRÜŞMELERİ" titleSize={60} subtitleColor="teal" />
      <AbsoluteFill style={{opacity: holdDim * 0.14, backgroundColor: '#132023', pointerEvents: 'none'}} />
      <FadeToBlack from={300} to={330} />
    </PaperStage>
  );
};
