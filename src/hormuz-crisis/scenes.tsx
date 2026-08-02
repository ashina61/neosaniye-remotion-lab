import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  Cutout,
  FadeToBlack,
  Label,
  PaperStage,
  RadarSweep,
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
  StraitMeasure,
  Tanker,
  WorldImpact,
} from './illustrations';

export const Scene1ClosureAlert: React.FC = () => {
  const {frame, stepped} = usePaperFrame();
  const mapIn = useCardSpring(0, 18, 92);
  const sealIn = useCardSpring(72, 16, 120);
  const radioIn = useCardSpring(40, 18, 104);
  const titleIn = useCardSpring(92, 17, 110);
  const camera = interpolate(frame, [0, 225], [1.0, 1.08]);
  const blocked = smooth(progress(frame, 62, 132));
  const patrolShift = Math.sin(stepped * 0.11) * 15;

  return (
    <PaperStage tone="warning">
      <SceneAudio scene={1} sfx={[{from: 18, src: 'radio-alert.wav', volume: 0.28}]} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '52% 47%'}}>
        <Cutout
          accent="red"
          style={{
            left: 62,
            top: 330,
            transform: `translateY(${interpolate(mapIn, [0, 1], [560, 0])}px) rotate(${interpolate(mapIn, [0, 1], [-5, 1])}deg)`,
          }}
        >
          <HormuzMap routeProgress={1} blocked={blocked} />
        </Cutout>
        <RadarSweep cx={537} cy={785} radius={360} frame={frame} color="#9c3e35" opacity={0.56} />
        <Label big style={{left: 68, top: 102, transform: 'rotate(-2deg)'}}>HÜRMÜZ KRİZİ</Label>
        <Label
          color="red"
          style={{
            left: 92,
            top: 225,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [-170, 0])}px) rotate(2deg)`,
          }}
        >
          İRAN: BOĞAZ KAPALI
        </Label>
        <Cutout
          style={{
            right: 55,
            bottom: 225,
            transform: `translateX(${interpolate(radioIn, [0, 1], [430, 0])}px) rotate(5deg)`,
          }}
        >
          <RadioCard pulse={(Math.sin(frame * 0.22) + 1) / 2} />
        </Cutout>
        <div
          style={{
            position: 'absolute',
            left: 46,
            bottom: 190,
            transform: `translateX(${patrolShift}px) rotate(-6deg)`,
          }}
        >
          <PatrolBoat width={215} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 240,
            bottom: 106,
            transform: `translateX(${-patrolShift * 0.65}px) rotate(4deg) scale(.82)`,
          }}
        >
          <PatrolBoat width={190} />
        </div>
        <div
          style={{
            position: 'absolute',
            right: 72,
            top: 118,
            opacity: sealIn,
            transform: `scale(${interpolate(sealIn, [0, 1], [1.65, 1])}) rotate(${interpolate(sealIn, [0, 1], [-18, 8])}deg)`,
          }}
        >
          <AlertSeal text="KAPALI" />
        </div>
        <Tape style={{left: 45, top: 78, transform: 'rotate(-13deg)'}} />
        <Tape style={{right: 58, bottom: 160, transform: 'rotate(11deg)'}} />
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene2Geography: React.FC = () => {
  const frame = useCurrentFrame();
  const mapIn = useCardSpring(0, 18, 92);
  const measureIn = useCardSpring(58, 17, 105);
  const tankerIn = useCardSpring(105, 18, 110);
  const route = smooth(progress(frame, 20, 145));
  const measure = smooth(progress(frame, 75, 168));
  const cameraX = interpolate(frame, [0, 225], [32, -26]);
  const cameraScale = interpolate(frame, [0, 225], [1.0, 1.075]);

  return (
    <PaperStage tone="cool">
      <SceneAudio scene={2} />
      <AbsoluteFill style={{transform: `translateX(${cameraX}px) scale(${cameraScale})`}}>
        <Cutout
          style={{
            left: 72,
            top: 305,
            transform: `translateY(${interpolate(mapIn, [0, 1], [520, 0])}px) rotate(-1deg)`,
          }}
        >
          <HormuzMap routeProgress={route} blocked={0} />
        </Cutout>
        <Label big style={{left: 70, top: 104, transform: 'rotate(-1deg)'}}>DÜNYANIN DAR KAPISI</Label>
        <Label color="teal" style={{left: 95, top: 230, transform: 'rotate(2deg)'}}>İRAN · UMMAN</Label>
        <Cutout
          accent="red"
          style={{
            left: 77,
            bottom: 125,
            opacity: measureIn,
            transform: `translateX(${interpolate(measureIn, [0, 1], [-560, 0])}px) rotate(-4deg)`,
          }}
        >
          <StraitMeasure progress={measure} />
        </Cutout>
        <div
          style={{
            position: 'absolute',
            right: 40,
            bottom: 145,
            opacity: tankerIn,
            transform: `translateX(${interpolate(tankerIn, [0, 1], [520, 0])}px) rotate(5deg) scale(.88)`,
          }}
        >
          <Tanker width={360} />
        </div>
        <div style={{position: 'absolute', right: 65, bottom: 72, transform: 'rotate(-6deg) scale(.55)'}}>
          <Tanker width={300} direction="left" color="#5b6b69" />
        </div>
        <Tape style={{right: 62, top: 282, transform: 'rotate(12deg)'}} />
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene3EnergyArtery: React.FC = () => {
  const frame = useCurrentFrame();
  const gaugeIn = useCardSpring(12, 18, 98);
  const barrelsIn = useCardSpring(70, 17, 110);
  const tankerIn = useCardSpring(0, 18, 90);
  const fill = smooth(progress(frame, 36, 155));
  const push = interpolate(frame, [0, 240], [1.0, 1.09]);
  const seaShift = interpolate(frame, [0, 240], [40, -35]);

  return (
    <PaperStage>
      <SceneAudio scene={3} sfx={[{from: 25, src: 'ship-horn.wav', volume: 0.18}]} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 50%'}}>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <path d={`M-100 680 C220 ${600 + seaShift} 580 ${800 + seaShift} 1180 625 V1250 H-100 Z`} fill="#708f92" opacity=".78" />
          <path d={`M-80 820 C220 ${740 + seaShift} 620 ${890 + seaShift} 1180 770`} fill="none" stroke="#e9e0c7" strokeWidth="20" opacity=".35" />
        </svg>
        <Label big style={{left: 72, top: 105, transform: 'rotate(-2deg)'}}>PETROLÜN ANA DAMARI</Label>
        <Label color="red" style={{left: 92, top: 232, transform: 'rotate(2deg)'}}>GÜNDE ≈ 20 MİLYON VARİL</Label>
        <div
          style={{
            position: 'absolute',
            left: 67,
            top: 505,
            opacity: tankerIn,
            transform: `translateX(${interpolate(tankerIn, [0, 1], [-540, 0])}px) rotate(-3deg)`,
          }}
        >
          <Tanker width={640} />
        </div>
        <Cutout
          accent="red"
          style={{
            right: 48,
            top: 855,
            opacity: gaugeIn,
            transform: `translateY(${interpolate(gaugeIn, [0, 1], [400, 0])}px) rotate(5deg)`,
          }}
        >
          <Gauge20 progress={fill} />
        </Cutout>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: 75 + index * 152,
              bottom: 135 + (index % 2) * 28,
              opacity: barrelsIn,
              transform: `translateY(${interpolate(barrelsIn, [0, 1], [260, 0])}px) rotate(${[-7, 3, -2][index]}deg) scale(${0.84 + index * 0.05})`,
            }}
          >
            <OilBarrel size={145} />
          </div>
        ))}
        <div style={{position: 'absolute', right: 82, bottom: 112, transform: 'rotate(-6deg) scale(.58)'}}>
          <Tanker width={330} direction="left" color="#61554a" />
        </div>
        <Tape style={{left: 47, top: 81, transform: 'rotate(-12deg)'}} />
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene4ShipsStopped: React.FC = () => {
  const frame = useCurrentFrame();
  const mapIn = useCardSpring(0, 18, 90);
  const barrierIn = useCardSpring(55, 16, 112);
  const radioIn = useCardSpring(95, 18, 104);
  const close = smooth(progress(frame, 68, 132));
  const turn = smooth(progress(frame, 106, 205));
  const zoom = interpolate(frame, [0, 240], [1.0, 1.095]);

  return (
    <PaperStage tone="dark">
      <SceneAudio scene={4} sfx={[{from: 83, src: 'gate-lock.wav', volume: 0.3}]} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 50%'}}>
        <Cutout
          style={{
            left: 75,
            top: 330,
            opacity: mapIn,
            transform: `translateY(${interpolate(mapIn, [0, 1], [490, 0])}px) rotate(1deg)`,
          }}
        >
          <HormuzMap routeProgress={1 - turn * 0.62} blocked={close} />
        </Cutout>
        <Label big color="paper" style={{left: 70, top: 102, transform: 'rotate(-2deg)'}}>GEMİLER DURDU</Label>
        <Label color="red" style={{left: 92, top: 225, transform: 'rotate(2deg)'}}>2 DURDURULDU · 4 GERİ ÇEVRİLDİ</Label>
        <div
          style={{
            position: 'absolute',
            left: 175,
            top: 860,
            opacity: barrierIn,
            transform: `translateY(${interpolate(barrierIn, [0, 1], [480, 0])}px) rotate(-3deg)`,
          }}
        >
          <ClosureBarrier closeProgress={close} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: interpolate(turn, [0, 1], [65, -90]),
            bottom: 182,
            transform: `rotate(${interpolate(turn, [0, 1], [-3, -14])}deg) scale(.8)`,
          }}
        >
          <Tanker width={390} direction="left" />
        </div>
        <div
          style={{
            position: 'absolute',
            right: interpolate(turn, [0, 1], [45, -105]),
            bottom: 82,
            transform: `rotate(${interpolate(turn, [0, 1], [4, 16])}deg) scale(.68)`,
          }}
        >
          <Tanker width={360} />
        </div>
        <Cutout
          accent="red"
          style={{
            right: 48,
            bottom: 336,
            opacity: radioIn,
            transform: `translateX(${interpolate(radioIn, [0, 1], [480, 0])}px) rotate(6deg) scale(.84)`,
          }}
        >
          <RadioCard pulse={smooth(progress(frame % 45, 0, 44))} />
        </Cutout>
        <RadarSweep cx={535} cy={795} radius={430} frame={frame} color="#d76455" opacity={0.48} />
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene5MarketShock: React.FC = () => {
  const frame = useCurrentFrame();
  const chartIn = useCardSpring(0, 18, 92);
  const pipeIn = useCardSpring(70, 17, 106);
  const barrelIn = useCardSpring(45, 18, 110);
  const chart = smooth(progress(frame, 32, 155));
  const pipe = smooth(progress(frame, 98, 205));
  const camera = interpolate(frame, [0, 240], [1.0, 1.075]);

  return (
    <PaperStage tone="warning">
      <SceneAudio scene={5} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 48%'}}>
        <Label big style={{left: 70, top: 105, transform: 'rotate(-2deg)'}}>DÜNYA FİYATI HİSSETTİ</Label>
        <Label color="red" style={{left: 92, top: 230, transform: 'rotate(2deg)'}}>PETROL YÜKSELDİ</Label>
        <Cutout
          accent="red"
          style={{
            left: 64,
            top: 350,
            opacity: chartIn,
            transform: `translateX(${interpolate(chartIn, [0, 1], [-590, 0])}px) rotate(-3deg)`,
          }}
        >
          <PriceChart progress={chart} />
        </Cutout>
        <div
          style={{
            position: 'absolute',
            right: 75,
            top: 446,
            opacity: barrelIn,
            transform: `translateY(${interpolate(barrelIn, [0, 1], [380, 0])}px) rotate(6deg) scale(1.15)`,
          }}
        >
          <OilBarrel size={190} label="$" />
        </div>
        <Cutout
          accent="teal"
          style={{
            left: 72,
            bottom: 166,
            opacity: pipeIn,
            transform: `translateY(${interpolate(pipeIn, [0, 1], [420, 0])}px) rotate(2deg)`,
          }}
        >
          <PipelineBypass progress={pipe} />
        </Cutout>
        <div style={{position: 'absolute', right: 54, bottom: 112, transform: 'rotate(-7deg) scale(.6)'}}>
          <Tanker width={330} direction="left" color="#5d4e42" />
        </div>
        <div style={{position: 'absolute', right: 320, bottom: 102, transform: 'rotate(5deg) scale(.7)'}}>
          <OilBarrel size={125} />
        </div>
        <Tape style={{right: 62, top: 90, transform: 'rotate(12deg)'}} />
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene6Diplomacy: React.FC = () => {
  const frame = useCurrentFrame();
  const worldIn = useCardSpring(0, 18, 90);
  const tableIn = useCardSpring(70, 17, 104);
  const finalIn = useCardSpring(180, 18, 110);
  const open = smooth(progress(frame, 112, 225));
  const zoom = interpolate(frame, [0, 330], [1.0, 1.06]);
  const hold = interpolate(frame, [252, 292, 330], [0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <PaperStage tone="cool">
      <SceneAudio scene={6} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 49%'}}>
        <Label big style={{left: 70, top: 102, transform: 'rotate(-2deg)'}}>ŞİMDİ NE OLACAK?</Label>
        <Label color="teal" style={{left: 92, top: 225, transform: 'rotate(2deg)'}}>YENİDEN AÇILMA GÖRÜŞMELERİ</Label>
        <Cutout
          style={{
            left: 68,
            top: 365,
            opacity: worldIn,
            transform: `translateX(${interpolate(worldIn, [0, 1], [-520, 0])}px) rotate(-4deg)`,
          }}
        >
          <WorldImpact />
        </Cutout>
        <Cutout
          accent="gold"
          style={{
            right: 48,
            top: 485,
            opacity: tableIn,
            transform: `translateX(${interpolate(tableIn, [0, 1], [620, 0])}px) rotate(3deg) scale(.9)`,
          }}
        >
          <NegotiationTable openProgress={open} />
        </Cutout>
        <div
          style={{
            position: 'absolute',
            left: interpolate(open, [0, 1], [-165, 35]),
            bottom: 275,
            transform: 'rotate(-4deg) scale(.72)',
          }}
        >
          <Tanker width={420} />
        </div>
        <div style={{position: 'absolute', right: 48, bottom: 205, transform: 'rotate(5deg) scale(.62)'}}>
          <PatrolBoat width={220} />
        </div>
        <Label
          color="red"
          style={{
            left: 90,
            bottom: 110,
            opacity: finalIn,
            transform: `translateY(${interpolate(finalIn, [0, 1], [180, 0])}px) rotate(-2deg)`,
            fontSize: 39,
          }}
        >
          TEK BOĞAZ · KÜRESEL ETKİ
        </Label>
        <Tape style={{left: 48, top: 80, transform: 'rotate(-13deg)'}} />
      </AbsoluteFill>
      <AbsoluteFill style={{opacity: hold, backgroundColor: 'rgba(18,31,32,.12)', pointerEvents: 'none'}} />
      <FadeToBlack from={300} to={330} />
    </PaperStage>
  );
};
