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
  DecemberCalendar,
  EmptyStreet,
  ICUScene,
  LegacyPanels,
  MaskCloseup,
  VaccineLab,
  VirusMicroscope,
  WhoDocument,
  WorldSpreadMap,
} from './illustrations';

const NarrationCard: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: 80,
      right: 80,
      bottom: 122,
      padding: '21px 25px 19px',
      background: 'rgba(238,229,205,.94)',
      border: '2px solid rgba(74,57,39,.6)',
      borderRadius: 16,
      color: '#30291f',
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: 31,
      fontWeight: 700,
      lineHeight: 1.22,
      boxShadow: '0 10px 24px rgba(45,31,18,.18)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Scene1Outbreak: React.FC = () => {
  const {frame} = usePaperFrame();
  const virusIn = useCardSpring(8, 18, 92);
  const calendarIn = useCardSpring(32, 18, 100);
  const alertIn = useCardSpring(78, 16, 115);
  const camera = interpolate(frame, [0, 195], [1.02, 1.09]);
  const ring = smooth(progress(frame, 64, 124));

  return (
    <PaperStage>
      <SceneAudio scene={1} sfx={[{from: 14, src: 'alert.wav', volume: 0.34}]} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '50% 44%'}}>
        <Cutout
          accent="red"
          style={{
            left: 545,
            top: 270,
            transform: `translateY(${interpolate(virusIn, [0, 1], [410, 0])}px) rotate(${interpolate(virusIn, [0, 1], [14, -4])}deg) scale(${interpolate(virusIn, [0, 1], [.72, 1])})`,
          }}
        >
          <VirusMicroscope size={410} />
        </Cutout>
        <Cutout
          style={{
            left: 85,
            top: 620,
            transform: `translateX(${interpolate(calendarIn, [0, 1], [-520, 0])}px) rotate(${interpolate(calendarIn, [0, 1], [-10, 2])}deg)`,
          }}
        >
          <DecemberCalendar />
        </Cutout>
        <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
          <circle
            cx="755"
            cy="486"
            r="245"
            fill="none"
            stroke="#98362f"
            strokeWidth="11"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - ring}
            strokeLinecap="round"
          />
          <path
            d="M275 740 C410 666 512 632 625 584"
            fill="none"
            stroke="#98362f"
            strokeWidth="8"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={1 - ring}
            strokeLinecap="round"
          />
        </svg>
        <Label big style={{left: 72, top: 128, transform: 'rotate(-2deg)'}}>COVID-19</Label>
        <Label color="red" style={{left: 92, top: 238, transform: `translateY(${interpolate(alertIn, [0, 1], [-130, 0])}px) rotate(2deg)`, opacity: alertIn}}>
          YENİ BİR SALGIN HABERİ
        </Label>
        <Tape style={{left: 55, top: 106, transform: 'rotate(-12deg)'}} />
        <NarrationCard>2019'un sonunda, yeni bir solunum yolu hastalığı haberi dünyanın dikkatini çekti.</NarrationCard>
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene2GlobalSpread: React.FC = () => {
  const frame = useCurrentFrame();
  const mapIn = useCardSpring(0, 18, 90);
  const docIn = useCardSpring(66, 17, 108);
  const route = smooth(progress(frame, 35, 142));
  const cameraX = interpolate(frame, [0, 210], [30, -22]);
  const cameraScale = interpolate(frame, [0, 210], [1.01, 1.075]);

  return (
    <PaperStage tone="cool">
      <SceneAudio scene={2} />
      <AbsoluteFill style={{transform: `translateX(${cameraX}px) scale(${cameraScale})`}}>
        <Cutout
          style={{
            left: 75,
            top: 328,
            transform: `translateY(${interpolate(mapIn, [0, 1], [430, 0])}px) rotate(${interpolate(mapIn, [0, 1], [-5, 1])}deg)`,
          }}
        >
          <WorldSpreadMap routeProgress={route} />
        </Cutout>
        <Cutout
          accent="red"
          style={{
            left: 574,
            top: 940,
            transform: `translate(${interpolate(docIn, [0, 1], [540, 0])}px, ${interpolate(docIn, [0, 1], [220, 0])}px) rotate(${interpolate(docIn, [0, 1], [13, -4])}deg)`,
          }}
        >
          <WhoDocument />
        </Cutout>
        <Label big style={{left: 82, top: 118, transform: 'rotate(-1deg)'}}>KÜRESEL YAYILIM</Label>
        <Label color="teal" style={{left: 90, top: 230, transform: 'rotate(2deg)'}}>ÜLKELER ARASI HAREKET</Label>
        <Tape style={{right: 80, top: 302, transform: 'rotate(10deg)'}} />
        <NarrationCard>11 Mart 2020'de Dünya Sağlık Örgütü, Covid-19'u pandemi olarak tanımladı.</NarrationCard>
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene3Lockdown: React.FC = () => {
  const frame = useCurrentFrame();
  const streetIn = useCardSpring(0, 18, 90);
  const maskIn = useCardSpring(52, 17, 105);
  const shutter = smooth(progress(frame, 73, 126));
  const title = useCardSpring(104, 18, 115);
  const push = interpolate(frame, [0, 225], [1.0, 1.08]);

  return (
    <PaperStage tone="dark">
      <SceneAudio scene={3} sfx={[{from: 76, src: 'shutter.wav', volume: 0.42}]} />
      <AbsoluteFill style={{transform: `scale(${push})`, transformOrigin: '50% 51%'}}>
        <Cutout
          style={{
            left: 76,
            top: 300,
            transform: `translateX(${interpolate(streetIn, [0, 1], [-690, 0])}px) rotate(${interpolate(streetIn, [0, 1], [-4, 1])}deg)`,
          }}
        >
          <EmptyStreet />
        </Cutout>
        <AbsoluteFill
          style={{
            top: 275,
            height: 650,
            background: 'repeating-linear-gradient(0deg, #303739 0 18px, #222a2c 18px 27px)',
            transform: `translateY(${interpolate(shutter, [0, 1], [-680, 0])}px)`,
            opacity: interpolate(shutter, [0, .92, 1], [0, .88, 0]),
            boxShadow: '0 18px 30px rgba(0,0,0,.34)',
          }}
        />
        <Cutout
          accent="teal"
          style={{
            right: 60,
            top: 852,
            transform: `translateX(${interpolate(maskIn, [0, 1], [450, 0])}px) rotate(${interpolate(maskIn, [0, 1], [9, -3])}deg) scale(${interpolate(maskIn, [0, 1], [.82, 1])})`,
          }}
        >
          <MaskCloseup />
        </Cutout>
        <Label big style={{left: 70, top: 106, transform: 'rotate(-2deg)'}}>HAYAT DURDU</Label>
        <Label color="red" style={{left: 88, top: 224, transform: `translateY(${interpolate(title, [0, 1], [-170, 0])}px) rotate(2deg)`, opacity: title}}>
          MASKE · MESAFE · KARANTİNA
        </Label>
        <Tape style={{left: 48, top: 80, transform: 'rotate(-14deg)'}} />
        <NarrationCard>Uçuşlar azaldı, okullar ve iş yerleri kapandı; maske ve mesafe günlük hayatın parçası oldu.</NarrationCard>
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene4ICU: React.FC = () => {
  const frame = useCurrentFrame();
  const card = useCardSpring(0, 19, 88);
  const monitor = smooth(progress(frame, 38, 144));
  const focus = interpolate(frame, [0, 26, 74, 120, 240], [7, 0, 0, 3, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zoom = interpolate(frame, [0, 240], [1.0, 1.105]);
  const labelIn = useCardSpring(98, 17, 104);

  return (
    <PaperStage tone="cool">
      <SceneAudio scene={4} sfx={[{from: 42, src: 'monitor-bed.wav', volume: 0.2}]} />
      <AbsoluteFill style={{filter: `blur(${focus}px)`, transform: `scale(${zoom})`, transformOrigin: '52% 47%'}}>
        <Cutout
          style={{
            left: 62,
            top: 365,
            transform: `translateY(${interpolate(card, [0, 1], [500, 0])}px) rotate(${interpolate(card, [0, 1], [-3, 1])}deg)`,
          }}
        >
          <ICUScene monitorProgress={monitor} />
        </Cutout>
        <Label big style={{left: 72, top: 112, transform: 'rotate(-1deg)'}}>YOĞUN BAKIM</Label>
        <Label color="teal" style={{left: 92, top: 229, transform: `translateX(${interpolate(labelIn, [0, 1], [-540, 0])}px) rotate(2deg)`, opacity: labelIn}}>
          SALGININ GÖRÜNMEYEN CEPHESİ
        </Label>
        <NarrationCard>En ağır yükü sağlık çalışanları taşıdı; yoğun bakımlar salgının görünmeyen cephesi oldu.</NarrationCard>
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene5Vaccines: React.FC = () => {
  const frame = useCurrentFrame();
  const labIn = useCardSpring(0, 18, 92);
  const chart = smooth(progress(frame, 48, 148));
  const syringeShift = interpolate(smooth(progress(frame, 86, 166)), [0, 1], [240, 0]);
  const sequence = [52, 88, 126].map((start) => useCardSpring(start, 17, 105));
  const camera = interpolate(frame, [0, 240], [1.0, 1.085]);

  return (
    <PaperStage>
      <SceneAudio scene={5} sfx={[{from: 92, src: 'vial-click.wav', volume: 0.3}]} />
      <AbsoluteFill style={{transform: `scale(${camera})`, transformOrigin: '51% 48%'}}>
        <Cutout
          style={{
            left: 64,
            top: 375,
            transform: `translateY(${interpolate(labIn, [0, 1], [500, 0])}px) rotate(${interpolate(labIn, [0, 1], [4, -1])}deg)`,
          }}
        >
          <VaccineLab chartProgress={chart} syringeShift={syringeShift} />
        </Cutout>
        <Label big color="red" style={{left: 78, top: 110, transform: 'rotate(-2deg)'}}>AŞI YARIŞI</Label>
        {['ARAŞTIRMA', 'DENEME', 'AŞILAMA'].map((word, index) => (
          <Label
            key={word}
            color={index === 1 ? 'teal' : 'paper'}
            style={{
              left: 94 + index * 282,
              top: 245 + index * 20,
              transform: `translateY(${interpolate(sequence[index], [0, 1], [-150, 0])}px) rotate(${[-4, 2, -2][index]}deg)`,
              opacity: sequence[index],
              fontSize: 34,
            }}
          >
            {word}
          </Label>
        ))}
        <Tape style={{right: 64, top: 96, transform: 'rotate(12deg)'}} />
        <NarrationCard>Araştırmacılar rekor hızda aşı geliştirdi; aşılama ağır hastalık riskini azaltan temel araçlardan biri oldu.</NarrationCard>
      </AbsoluteFill>
    </PaperStage>
  );
};

export const Scene6Legacy: React.FC = () => {
  const frame = useCurrentFrame();
  const panels = useCardSpring(0, 18, 88);
  const title = useCardSpring(76, 17, 105);
  const final = useCardSpring(132, 18, 110);
  const zoom = interpolate(frame, [0, 240], [1.0, 1.06]);
  const hold = interpolate(frame, [182, 224, 240], [0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <PaperStage tone="dark">
      <SceneAudio scene={6} />
      <AbsoluteFill style={{transform: `scale(${zoom})`, transformOrigin: '50% 48%'}}>
        <Cutout
          style={{
            left: 66,
            top: 305,
            transform: `translateY(${interpolate(panels, [0, 1], [540, 0])}px) rotate(${interpolate(panels, [0, 1], [-3, 0.5])}deg)`,
          }}
        >
          <LegacyPanels />
        </Cutout>
        <Label big style={{left: 80, top: 105, transform: `translateX(${interpolate(title, [0, 1], [-550, 0])}px) rotate(-2deg)`, opacity: title}}>
          PANDEMİNİN MİRASI
        </Label>
        <Label color="teal" style={{left: 101, top: 221, transform: `translateY(${interpolate(final, [0, 1], [-150, 0])}px) rotate(2deg)`, opacity: final}}>
          BİLİM · HAZIRLIK · DAYANIŞMA
        </Label>
        <NarrationCard style={{opacity: interpolate(frame, [142, 162], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          Pandemi; çalışma, eğitim ve sağlık sistemlerini değiştirdi. Geriye hazırlığın önemi kaldı.
        </NarrationCard>
      </AbsoluteFill>
      <FadeToBlack from={224} to={240} />
      <AbsoluteFill style={{opacity: hold, backgroundColor: 'rgba(10,18,19,.18)', pointerEvents: 'none'}} />
    </PaperStage>
  );
};
