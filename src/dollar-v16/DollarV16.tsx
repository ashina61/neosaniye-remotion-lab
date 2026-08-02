import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {
  Cutout,
  DrawLine,
  Headline,
  Label,
  Pop,
  SceneShell,
  Tape,
  colors,
  progress,
  smooth,
  usePop,
  useSteppedFrame,
} from './engine';
import {
  BankNetwork,
  BrokenChain,
  ConferenceTable,
  DollarGoldMachine,
  DollarNote,
  DollarOrbit,
  GlobeNetwork,
  GoldBars,
  MarshallFlow,
  OilBarrels,
  PoundNote,
  ShippingFleet,
  SwiftTerminal,
  TreasuryBond,
  WarFactory,
} from './illustrations';

export const DOLLAR_V16_FRAMES = 1395;

const Stamp: React.FC<{text: string; progressValue: number}> = ({text, progressValue}) => (
  <div
    style={{
      width: 230,
      height: 230,
      borderRadius: '50%',
      border: `13px solid ${colors.red}`,
      outline: `5px solid ${colors.red}`,
      outlineOffset: -26,
      color: colors.red,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial Black, sans-serif',
      fontSize: 43,
      fontWeight: 900,
      textTransform: 'uppercase',
      transform: `scale(${interpolate(progressValue, [0, 1], [1.9, 1])}) rotate(${interpolate(progressValue, [0, 1], [-18, 8])}deg)`,
      opacity: progressValue,
      background: 'rgba(244,236,215,.82)',
      boxShadow: '12px 14px 0 rgba(40,28,20,.22)',
    }}
  >
    {text}
  </div>
);

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stepped = useSteppedFrame();
  const note = usePop(0, 12, 0.65);
  const globe = usePop(7, 13, 0.72);
  const gold = usePop(16, 12, 0.7);
  const oil = usePop(24, 13, 0.72);
  const question = smooth(progress(frame, 0, 9));
  const answer = smooth(progress(frame, 28, 53));
  const zoom = interpolate(frame, [0, 89], [1.0, 1.11]);
  const shake = frame > 26 && frame < 33 ? Math.sin(frame * 3.2) * 8 : 0;

  return (
    <SceneShell duration={90} tone="dark" transition="flash">
      <AbsoluteFill style={{transform: `translateX(${shake}px) scale(${zoom})`, transformOrigin: '50% 52%'}}>
        <div style={{position: 'absolute', left: 146, top: 316, opacity: globe, transform: `rotate(${stepped * 0.15}deg) scale(${interpolate(globe, [0, 1], [.55, 1.05])})`}}>
          <GlobeNetwork width={760} progress={smooth(progress(frame, 10, 58))} centerDollar />
        </div>
        <Cutout style={{left: 50, top: 745, opacity: note, transform: `translateX(${interpolate(note, [0, 1], [-620, 0])}px) rotate(-7deg) scale(1.25)`}}>
          <DollarNote width={640} serial="THE WORLD'S MONEY" />
        </Cutout>
        <Cutout style={{right: 34, top: 1030, opacity: gold, transform: `translateX(${interpolate(gold, [0, 1], [470, 0])}px) rotate(7deg) scale(.82)`}}>
          <GoldBars width={390} shine={(Math.sin(frame * .22) + 1) / 2} />
        </Cutout>
        <Cutout style={{left: 74, top: 1190, opacity: oil, transform: `translateY(${interpolate(oil, [0, 1], [450, 0])}px) rotate(-5deg) scale(.72)`}}>
          <OilBarrels width={380} rotate={Math.sin(stepped * .08) * 2} />
        </Cutout>
        <DrawLine path="M113 1368 C310 1246 488 1132 670 942" from={31} to={55} color={colors.red} width={12} />
        <DrawLine path="M945 1185 C846 1087 766 1036 672 945" from={36} to={61} color={colors.gold} width={11} />
      </AbsoluteFill>
      <Label color="teal" style={{left: 67, top: 92, fontSize: 38, transform: `translateY(${interpolate(question, [0, 1], [-95, 0])}px) rotate(-3deg)`, opacity: question}}>
        DOLAR NEDEN HER YERDE?
      </Label>
      <Label large style={{left: 68, top: 176, fontSize: 68, transform: 'rotate(-1deg)'}}>
        DÜNYANIN PARASI
      </Label>
      <Label color="red" style={{left: 250, top: 286, fontSize: 34, transform: `scale(${interpolate(answer, [0, 1], [.45, 1])}) rotate(2deg)`, opacity: answer}}>
        SAVAŞ · ALTIN · PETROL
      </Label>
    </SceneShell>
  );
};

const SterlingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stepped = useSteppedFrame();
  const pound = usePop(0);
  const gold = usePop(18);
  const dollar = usePop(54);
  const cross = smooth(progress(frame, 48, 100));

  return (
    <SceneShell duration={135} transition="paper">
      <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, 134], [1, 1.055])})`, transformOrigin: '50% 55%'}}>
        <Cutout accent="gold" style={{left: 46, top: 340, opacity: pound, transform: `translateX(${interpolate(pound, [0, 1], [-480, 0])}px) rotate(-8deg) scale(1.17)`}}>
          <PoundNote width={470} />
        </Cutout>
        <Cutout style={{right: 36, top: 552, opacity: gold, transform: `translateX(${interpolate(gold, [0, 1], [480, 0])}px) rotate(5deg)`}}>
          <GoldBars width={520} shine={(Math.sin(stepped * .18) + 1) / 2} />
        </Cutout>
        <Cutout style={{left: 170, top: 1040, opacity: dollar * cross, transform: `translateY(${interpolate(dollar, [0, 1], [350, 0])}px) rotate(${interpolate(cross, [0, 1], [11, -4])}deg) scale(.95)`}}>
          <DollarNote width={580} serial="THE CHALLENGER" />
        </Cutout>
        <DrawLine path="M228 745 C340 830 476 900 594 1017" from={34} to={68} color={colors.gold} width={11} />
        <DrawLine path="M808 883 C718 959 661 1003 594 1054" from={44} to={78} color={colors.red} width={10} />
        <div style={{position: 'absolute', left: 785, top: 1187, transform: `rotate(${stepped * .7}deg)`}}>
          <svg width="205" height="205" viewBox="0 0 205 205">
            <circle cx="102" cy="102" r="89" fill="#c9b6cf" stroke={colors.ink} strokeWidth="8" />
            <text x="102" y="137" textAnchor="middle" fontSize="102" fontWeight="900" fill="#6b4e75">£</text>
          </svg>
        </div>
      </AbsoluteFill>
      <Headline title="ÖNCE STERLİN VARDI" subtitle="ALTIN STANDARDI · LONDRA MERKEZLİ DÜZEN" titleSize={59} color="gold" />
    </SceneShell>
  );
};

const WarRiseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const factory = usePop(0);
  const fleet = usePop(26);
  const globe = usePop(58);
  const smoke = (Math.sin(frame * .11) + 1) / 2;
  const travel = smooth(progress(frame, 38, 110));

  return (
    <SceneShell duration={135} tone="cool" transition="zoom">
      <AbsoluteFill style={{transform: `translateX(${interpolate(frame, [0, 134], [25, -32])}px) scale(1.04)`}}>
        <Cutout style={{left: 28, top: 334, opacity: factory, transform: `translateY(${interpolate(factory, [0, 1], [420, 0])}px) rotate(-2deg)`}}>
          <WarFactory width={760} smoke={smoke} />
        </Cutout>
        <Cutout style={{left: 150, top: 850, opacity: fleet, transform: `translateX(${interpolate(fleet, [0, 1], [-600, 0])}px) rotate(2deg)`}}>
          <ShippingFleet width={760} travel={travel} />
        </Cutout>
        <Cutout accent="red" style={{right: 32, top: 1180, opacity: globe, transform: `translateX(${interpolate(globe, [0, 1], [420, 0])}px) rotate(6deg) scale(.68)`}}>
          <GlobeNetwork width={520} progress={smooth(progress(frame, 70, 124))} />
        </Cutout>
        <DrawLine path="M216 674 C330 810 488 914 650 1025" from={25} to={63} color={colors.red} width={12} />
        <DrawLine path="M671 1155 C768 1196 834 1230 906 1278" from={69} to={105} color={colors.gold} width={10} />
        <Pop delay={72} from="right" style={{right: 71, top: 832}}>
          <Label color="red" style={{position: 'relative', fontSize: 30, transform: 'rotate(4deg)'}}>FABRİKALAR DOLUYDU</Label>
        </Pop>
      </AbsoluteFill>
      <Headline title="SAVAŞ ABD'Yİ BÜYÜTTÜ" subtitle="FABRİKA · ALTIN · TİCARET GÜCÜ" titleSize={55} color="teal" />
    </SceneShell>
  );
};

const BrettonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const table = usePop(0);
  const stampP = smooth(progress(frame, 42, 54));
  const note = usePop(60);
  const gold = usePop(76);

  return (
    <SceneShell duration={150} transition="flash">
      <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, 149], [1.0, 1.065])})`, transformOrigin: '50% 55%'}}>
        <Cutout style={{left: 78, top: 350, opacity: table, transform: `translateY(${interpolate(table, [0, 1], [560, 0])}px) rotate(-2deg) scale(1.2)`}}>
          <ConferenceTable width={780} stamp={stampP} />
        </Cutout>
        <Cutout style={{left: 35, top: 1045, opacity: note, transform: `translateX(${interpolate(note, [0, 1], [-520, 0])}px) rotate(-6deg) scale(.84)`}}>
          <DollarNote width={530} serial="1944 RESERVE ANCHOR" />
        </Cutout>
        <Cutout style={{right: 40, top: 1080, opacity: gold, transform: `translateX(${interpolate(gold, [0, 1], [460, 0])}px) rotate(7deg) scale(.63)`}}>
          <GoldBars width={440} shine={stampP} />
        </Cutout>
        <DrawLine path="M486 1222 C568 1120 646 1042 725 934" from={70} to={108} color={colors.red} width={12} />
        <DrawLine path="M845 1182 C790 1090 758 1022 731 934" from={82} to={120} color={colors.gold} width={10} />
        <Pop delay={43} from="scale" style={{right: 50, top: 360}}>
          <Stamp text="ANLAŞMA" progressValue={stampP} />
        </Pop>
      </AbsoluteFill>
      <Headline title="1944: BRETTON WOODS" subtitle="DOLAR ALTINA BAĞLANDI" titleSize={57} />
    </SceneShell>
  );
};

const GoldLinkScene: React.FC = () => {
  const frame = useCurrentFrame();
  const link = smooth(progress(frame, 18, 72));
  const machine = usePop(0);
  const note = usePop(48);
  const counters = [0, 1, 2, 3].map((i) => smooth(progress(frame, 62 + i * 8, 90 + i * 8)));

  return (
    <SceneShell duration={120} tone="cool" transition="paper">
      <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, 119], [1, 1.07])})`}}>
        <Cutout accent="gold" style={{left: 72, top: 360, opacity: machine, transform: `translateY(${interpolate(machine, [0, 1], [440, 0])}px) rotate(-2deg) scale(1.28)`}}>
          <DollarGoldMachine width={720} link={link} />
        </Cutout>
        <Cutout style={{left: 168, top: 1035, opacity: note, transform: `translateY(${interpolate(note, [0, 1], [390, 0])}px) rotate(-4deg)`}}>
          <DollarNote width={650} serial="35 DOLLARS = ONE OUNCE" />
        </Cutout>
        <div style={{position: 'absolute', left: 150, top: 1335, display: 'flex', gap: 24}}>
          {counters.map((p, i) => (
            <div key={i} style={{width: 145, height: 115, border: `6px solid ${colors.ink}`, background: i % 2 ? colors.lightPaper : '#dce5c7', transform: `translateY(${(1 - p) * 160}px) rotate(${i % 2 ? 4 : -4}deg)`, opacity: p, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 58, fontWeight: 900, color: '#355744', boxShadow: '9px 11px 0 rgba(30,24,17,.2)'}}>
              $
            </div>
          ))}
        </div>
        <DrawLine path="M292 1437 C386 1352 445 1288 509 1192" from={62} to={98} color={colors.red} width={10} />
      </AbsoluteFill>
      <Headline title="DOLAR = ALTIN SÖZÜ" subtitle="MERKEZ BANKALARI DOLAR BİRİKTİRDİ" titleSize={57} color="gold" />
    </SceneShell>
  );
};

const MarshallScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flow = smooth(progress(frame, 12, 92));
  const map = usePop(0);
  const fleet = usePop(46);
  const notes = [0, 1, 2].map((i) => usePop(60 + i * 10));

  return (
    <SceneShell duration={150} transition="zoom">
      <AbsoluteFill style={{transform: `translateX(${interpolate(frame, [0, 149], [20, -28])}px) scale(1.035)`}}>
        <Cutout style={{left: 70, top: 340, opacity: map, transform: `translateY(${interpolate(map, [0, 1], [500, 0])}px) rotate(-2deg) scale(1.25)`}}>
          <MarshallFlow width={760} progress={flow} />
        </Cutout>
        <Cutout style={{left: 66, top: 990, opacity: fleet, transform: `translateX(${interpolate(fleet, [0, 1], [-600, 0])}px) rotate(2deg) scale(.88)`}}>
          <ShippingFleet width={720} travel={flow} />
        </Cutout>
        {notes.map((p, i) => (
          <Cutout key={i} style={{right: 44 + i * 118, top: 1260 + (i % 2) * 72, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [280, 0])}px) rotate(${i * 7 - 8}deg) scale(.34)`}}>
            <DollarNote width={520} serial={`TRADE FLOW ${i + 1}`} />
          </Cutout>
        ))}
        <DrawLine path="M218 1315 C382 1220 528 1150 717 1035" from={52} to={96} color={colors.gold} width={11} />
        <Pop delay={102} from="right" style={{right: 62, top: 880}}>
          <Label color="red" style={{position: 'relative', fontSize: 30, transform: 'rotate(4deg)'}}>DOLAR DÜNYAYA AKTI</Label>
        </Pop>
      </AbsoluteFill>
      <Headline title="DOLAR İHRAÇ EDİLDİ" subtitle="MARSHALL PLANI · TİCARET · REZERV" titleSize={59} color="teal" />
    </SceneShell>
  );
};

const NixonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const breakP = smooth(progress(frame, 18, 56));
  const chain = usePop(0);
  const note = usePop(58);
  const gold = usePop(66);
  const stampP = smooth(progress(frame, 76, 90));
  const flash = frame >= 20 && frame <= 26 ? interpolate(frame, [20, 23, 26], [0, 1, 0]) : 0;

  return (
    <SceneShell duration={150} tone="dark" transition="flash">
      <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, 149], [1, 1.08])})`}}>
        <Cutout accent="red" style={{left: 65, top: 390, opacity: chain, transform: `translateY(${interpolate(chain, [0, 1], [420, 0])}px) rotate(-2deg) scale(1.33)`}}>
          <BrokenChain width={720} breakProgress={breakP} />
        </Cutout>
        <Cutout style={{left: 44, top: 1000, opacity: note, transform: `translateX(${interpolate(note, [0, 1], [-560, 0])}px) rotate(-7deg) scale(.92)`}}>
          <DollarNote width={610} serial="NIXON SHOCK 1971" />
        </Cutout>
        <Cutout style={{right: 28, top: 1080, opacity: gold, transform: `translateX(${interpolate(gold, [0, 1], [520, 0])}px) rotate(8deg) scale(.58)`}}>
          <GoldBars width={470} shine={0} />
        </Cutout>
        <DrawLine path="M630 1180 C738 1092 786 1000 826 866" from={68} to={108} color={colors.red} width={12} />
        <Pop delay={76} from="scale" style={{right: 56, top: 480}}>
          <Stamp text="KOPTU" progressValue={stampP} />
        </Pop>
      </AbsoluteFill>
      <Headline title="1971: ALTIN BAĞI KOPTU" subtitle="AMA DOLAR ÇÖKMEDİ" titleSize={55} />
      <AbsoluteFill style={{background: '#fff7d4', opacity: flash, mixBlendMode: 'screen'}} />
    </SceneShell>
  );
};

const SystemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stepped = useSteppedFrame();
  const oil = usePop(0);
  const bank = usePop(34);
  const bond = usePop(68);
  const swift = usePop(98);
  const pulse = (Math.sin(stepped * .18) + 1) / 2;

  return (
    <SceneShell duration={210} transition="paper">
      <AbsoluteFill style={{transform: `translateY(${interpolate(frame, [0, 209], [18, -28])}px) scale(${interpolate(frame, [0, 209], [1, 1.055])})`}}>
        <Cutout style={{left: 45, top: 350, opacity: oil, transform: `translateX(${interpolate(oil, [0, 1], [-480, 0])}px) rotate(-5deg) scale(.94)`}}>
          <OilBarrels width={500} rotate={Math.sin(stepped * .09) * 2.4} />
        </Cutout>
        <Cutout accent="teal" style={{right: 28, top: 440, opacity: bank, transform: `translateX(${interpolate(bank, [0, 1], [520, 0])}px) rotate(4deg) scale(.84)`}}>
          <BankNetwork width={600} pulse={pulse} />
        </Cutout>
        <Cutout style={{left: 42, top: 1070, opacity: bond, transform: `translateY(${interpolate(bond, [0, 1], [480, 0])}px) rotate(-5deg) scale(.82)`}}>
          <TreasuryBond width={530} rise={smooth(progress(frame, 86, 150))} />
        </Cutout>
        <Cutout accent="red" style={{right: 35, top: 1120, opacity: swift, transform: `translateY(${interpolate(swift, [0, 1], [520, 0])}px) rotate(5deg) scale(.82)`}}>
          <SwiftTerminal width={520} progress={smooth(progress(frame, 112, 176))} />
        </Cutout>
        <DrawLine path="M300 790 C420 815 540 840 674 864" from={25} to={75} color={colors.red} width={12} />
        <DrawLine path="M691 985 C606 1080 552 1167 500 1284" from={78} to={125} color={colors.gold} width={10} />
        <DrawLine path="M540 1420 C650 1398 744 1377 836 1355" from={124} to={165} color={colors.teal} width={10} />
        <Pop delay={155} from="scale" style={{left: 392, top: 885}}>
          <Label color="red" style={{position: 'relative', fontSize: 33, transform: 'rotate(-2deg)'}}>SİSTEM DOLARA KİLİTLENDİ</Label>
        </Pop>
      </AbsoluteFill>
      <Headline title="PETROL · BANKA · TAHVİL" subtitle="DOLARIN YENİ ALTIN DAYANAĞI: AĞ ETKİSİ" titleSize={52} color="gold" />
    </SceneShell>
  );
};

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const stepped = useSteppedFrame();
  const world = usePop(0);
  const note = usePop(48);
  const seal = usePop(92);
  const rotation = stepped * .11;
  const network = smooth(progress(frame, 18, 104));
  const finalP = smooth(progress(frame, 108, 150));
  const holdStart = 155;
  const fade = smooth(progress(frame, 225, 254));

  return (
    <SceneShell duration={255} tone="cool" transition="zoom">
      <AbsoluteFill style={{transform: `scale(${interpolate(frame, [0, holdStart], [1, 1.07], {extrapolateRight: 'clamp'})})`, transformOrigin: '50% 56%'}}>
        <Cutout style={{left: 140, top: 315, opacity: world, transform: `translateY(${interpolate(world, [0, 1], [520, 0])}px) rotate(-2deg)`}}>
          <DollarOrbit width={800} rotation={rotation} />
        </Cutout>
        <Cutout style={{left: 165, top: 1080, opacity: note, transform: `translateY(${interpolate(note, [0, 1], [430, 0])}px) rotate(-5deg) scale(1.02)`}}>
          <DollarNote width={720} serial="NETWORK EFFECT · RESERVE · TRADE" />
        </Cutout>
        <DrawLine path="M540 1105 C536 1030 529 970 520 895" from={52} to={92} color={colors.red} width={12} />
        <DrawLine path="M215 1270 C328 1172 417 1089 507 982" from={64} to={106} color={colors.gold} width={10} />
        <DrawLine path="M850 1262 C747 1160 658 1081 561 980" from={72} to={114} color={colors.teal} width={10} />
        <div style={{position: 'absolute', right: 55, top: 1028, opacity: seal, transform: `scale(${interpolate(seal, [0, 1], [.3, 1])}) rotate(8deg)`}}>
          <Stamp text="KÜRESEL" progressValue={seal} />
        </div>
        <Label color="red" style={{left: 98, top: 1515, fontSize: 42, opacity: finalP, transform: `translateY(${(1 - finalP) * 150}px) rotate(-2deg)`}}>
          GÜÇLÜYDÜ, ÇÜNKÜ HERKES KULLANIYORDU
        </Label>
        <div style={{position: 'absolute', left: 90, top: 1615, width: 900, height: 16, background: colors.ink, opacity: network}} />
        <div style={{position: 'absolute', left: 90, top: 1652, fontFamily: 'Arial Black, sans-serif', fontSize: 48, fontWeight: 900, color: colors.ink, opacity: finalP, letterSpacing: -1.4}}>
          DOLARIN ASIL GÜCÜ: AĞIN MERKEZİNDE OLMAK
        </div>
      </AbsoluteFill>
      <Headline title="DOLAR NEDEN HÂLÂ MERKEZDE?" subtitle="HERKES KULLANDIĞI İÇİN HERKES KULLANMAYA DEVAM ETTİ" titleSize={48} color="teal" />
      <AbsoluteFill style={{background: '#101718', opacity: fade, pointerEvents: 'none'}} />
    </SceneShell>
  );
};

const scenes = [
  {from: 0, duration: 90, component: HookScene},
  {from: 90, duration: 135, component: SterlingScene},
  {from: 225, duration: 135, component: WarRiseScene},
  {from: 360, duration: 150, component: BrettonScene},
  {from: 510, duration: 120, component: GoldLinkScene},
  {from: 630, duration: 150, component: MarshallScene},
  {from: 780, duration: 150, component: NixonScene},
  {from: 930, duration: 210, component: SystemScene},
  {from: 1140, duration: 255, component: FinalScene},
];

export const DollarV16: React.FC = () => (
  <AbsoluteFill style={{background: colors.ink}}>
    <Audio src={staticFile('dollar-v16/audio/final.wav')} />
    {scenes.map(({from, duration, component: Component}) => (
      <Sequence key={from} from={from} durationInFrames={duration} premountFor={12}>
        <Component />
      </Sequence>
    ))}
  </AbsoluteFill>
);
