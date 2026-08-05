import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {ROANOKE_SCENES} from './data';
import {
  ColonyStockade,
  ColonistGroup,
  CroatoanPost,
  EmptyCabins,
  JohnWhite,
  MuseumWall,
  OrnateFrame,
  RoanokeIslandMap,
  SailingShip,
  TornJournal,
} from './assetsBatchA';
import {
  AntiqueClock,
  AttackTheory,
  CompassRose,
  FogAndScratches,
  InkQuestion,
  NativeVillage,
  RedThreadBoard,
  SearchParty,
  ShipwreckTheory,
  StormLayer,
} from './assetsBatchB';
import {
  FilmLook,
  PaperCaption,
  boil,
  easeInOutCubic,
  easeOutCubic,
  pingPong,
  progress,
  springEntrance,
  useSceneFrame,
  useSteppedFrame,
} from '../db-cooper/engine';

const CREAM = '#f4ead2';
const INK = '#17110d';
const MARIGOLD = '#ffbe2e';
const RED = '#e04329';

const BigType: React.FC<{
  children: React.ReactNode;
  top?: number;
  left?: number;
  right?: number;
  size?: number;
  color?: string;
  rotate?: number;
  opacity?: number;
  align?: React.CSSProperties['textAlign'];
}> = ({children, top = 0, left, right, size = 92, color = CREAM, rotate = 0, opacity = 1, align = 'left'}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left,
      right,
      color,
      opacity,
      fontFamily: 'Arial Black, Impact, sans-serif',
      fontWeight: 900,
      fontSize: size,
      lineHeight: 0.9,
      letterSpacing: -3,
      textTransform: 'uppercase',
      textAlign: align,
      textShadow: '0 7px 20px rgba(0,0,0,.62)',
      transform: `rotate(${rotate}deg)`,
    }}
  >
    {children}
  </div>
);

const InkLine: React.FC<{x1: number; y1: number; x2: number; y2: number; progressValue: number}> = ({
  x1,
  y1,
  x2,
  y2,
  progressValue,
}) => {
  const length = Math.hypot(x2 - x1, y2 - y1);
  return (
    <svg viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <path
        d={`M${x1} ${y1}L${x2} ${y2}`}
        fill="none"
        stroke={RED}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={length}
        strokeDashoffset={length * (1 - progressValue)}
      />
    </svg>
  );
};

const SceneEnvelope: React.FC<React.PropsWithChildren<{duration: number}>> = ({duration, children}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 6, duration - 7, duration - 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>;
};

const Scene1Opener: React.FC = () => {
  const frame = useSceneFrame();
  const stepped = useSteppedFrame(12);
  const {fps} = useVideoConfig();
  const slowPush = easeInOutCubic(progress(frame, 0, 48));
  const portal = easeOutCubic(progress(frame, 48, 78));
  const wallScale = 1 + slowPush * 0.16 + portal * 5.75;
  const detach = easeOutCubic(progress(frame, 59, 80));
  const settledScale = interpolate(detach, [0, 1], [0.72, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shipDrift = interpolate(frame, [75, 165], [130, -95], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shipBoil = boil(stepped, 2.1);
  const captionIn = spring({frame: frame - 90, fps, config: {damping: 13, stiffness: 95}});

  return (
    <FilmLook saturate={0.82} sepia={0.22} contrast={1.12}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#d8c7a2 0%,#846d4c 62%,#332419 100%)'}}>
        <AbsoluteFill style={{opacity: detach, transform: `scale(${settledScale})`}}>
          <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 35%,#708d91 0%,#273a41 55%,#111518 100%)'}} />
          <RoanokeIslandMap style={{transform: 'scale(1.34) translateY(10px)', opacity: 0.86, mixBlendMode: 'screen'}} />
          <SailingShip
            style={{
              transform: `translateX(${shipDrift + shipBoil.x}px) translateY(${shipBoil.y}px) rotate(${shipBoil.rotate}deg) scale(.78)`,
              transformOrigin: '50% 75%',
            }}
          />
        </AbsoluteFill>

        <AbsoluteFill style={{transform: `scale(${wallScale})`, transformOrigin: '50% 43%', opacity: 1 - detach}}>
          <MuseumWall />
          <div style={{position: 'absolute', left: 206, top: 350, width: 668, height: 960, overflow: 'hidden', background: '#2c3a3c'}}>
            <RoanokeIslandMap style={{transform: 'scale(1.08) translateY(-70px)', filter: 'grayscale(1) contrast(1.08)'}} />
            <SailingShip style={{transform: 'scale(.62) translateY(120px)', filter: 'grayscale(1) contrast(1.15)'}} />
          </div>
          <OrnateFrame />
          <div
            style={{
              position: 'absolute',
              top: 1435,
              left: 350,
              width: 380,
              padding: '19px 22px',
              background: '#e5d5ae',
              border: `5px solid ${INK}`,
              textAlign: 'center',
              fontFamily: 'Georgia, serif',
              fontWeight: 900,
              fontSize: 48,
              color: INK,
            }}
          >
            1587 · ROANOKE
          </div>
        </AbsoluteFill>

        <BigType top={110} left={66} size={54} color={MARIGOLD} opacity={detach}>115 KİŞİ</BigType>
        <BigType top={165} left={66} size={92} opacity={detach * captionIn}>YENİ BİR<br/>HAYAT KURDU</BigType>
        <PaperCaption style={{left: 70, bottom: 145, fontSize: 54, opacity: detach * captionIn}}>Sonra hepsi kayboldu.</PaperCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

const Scene2Vanish: React.FC = () => {
  const frame = useSceneFrame();
  const stepped = useSteppedFrame(12);
  const vanish = easeInOutCubic(progress(frame, 48, 132));
  const emptyReveal = easeOutCubic(progress(frame, 100, 148));
  const strike = progress(frame, 135, 170);
  const b = boil(stepped, 1.8);

  return (
    <FilmLook saturate={0.72} sepia={0.18} brightness={0.88}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#4e5d57,#1b211e 57%,#0e0c0a)'}}>
        <ColonyStockade style={{transform: `scale(${1.05 + frame * 0.00035}) translateY(-40px)`}} />
        <EmptyCabins style={{opacity: emptyReveal, transform: `translateY(${40 - emptyReveal * 40}px) scale(1.04)`}} />
        <ColonistGroup
          style={{
            opacity: 1 - vanish,
            transform: `translate(${b.x - vanish * 260}px,${b.y + vanish * 90}px) rotate(${b.rotate - vanish * 9}deg)`,
            filter: `blur(${vanish * 8}px)`,
          }}
        />
        <ColonistGroup
          style={{
            opacity: Math.max(0, 1 - vanish * 1.22),
            transform: `translate(${b.x + vanish * 290}px,${b.y - vanish * 50}px) rotate(${b.rotate + vanish * 11}deg)`,
            clipPath: 'inset(0 0 49% 0)',
            filter: `blur(${vanish * 7}px)`,
          }}
        />
        <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${emptyReveal * .32})`}} />
        <BigType top={120} left={70} size={60} color={MARIGOLD}>ÜÇ YIL SONRA</BigType>
        <BigType top={190} left={70} size={104} opacity={emptyReveal}>YERLEŞİM<br/>BOMBOŞTU</BigType>
        <div style={{position: 'absolute', left: 70, top: 455, width: 770, height: 16, background: RED, transformOrigin: 'left', transform: `scaleX(${strike}) rotate(-1deg)`}} />
        <PaperCaption style={{right: 65, bottom: 180, fontSize: 50, opacity: emptyReveal}}>Ne ceset vardı,<br/>ne çatışma izi.</PaperCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

const Scene3Carving: React.FC = () => {
  const frame = useSceneFrame();
  const stepped = useSteppedFrame(12);
  const {fps} = useVideoConfig();
  const slam = springEntrance(frame, fps, 12, 11, 125);
  const postScale = interpolate(slam, [0, 1], [1.75, 0.92]);
  const reveal = easeOutCubic(progress(frame, 54, 112));
  const compassSpin = interpolate(frame, [0, 210], [-38, 18], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flicker = frame > 154 && frame < 188 ? (Math.floor(stepped / 3) % 2 ? 1 : 0.35) : 0;

  return (
    <FilmLook saturate={0.86} sepia={0.24} contrast={1.16}>
      <AbsoluteFill style={{background: 'radial-gradient(circle at 50% 40%,#766047,#2b2118 67%,#0d0907)'}}>
        <CompassRose style={{opacity: 0.27, transform: `scale(1.5) rotate(${compassSpin}deg)`}} />
        <RedThreadBoard style={{opacity: 0.14, transform: 'scale(1.14) rotate(-4deg)'}} />
        <CroatoanPost style={{transform: `scale(${postScale}) rotate(${(1 - slam) * 6 - 1}deg) translateY(${(1 - slam) * -160}px)`}} />
        <div style={{position: 'absolute', left: 320, top: 745, width: 530 * reveal, height: 175, overflow: 'hidden'}}>
          <div style={{fontFamily: 'Georgia, serif', fontWeight: 900, fontSize: 94, letterSpacing: 7, color: '#f5dfb8', textShadow: '0 5px 12px #000', whiteSpace: 'nowrap'}}>CROATOAN</div>
        </div>
        <InkLine x1={290} y1={1010} x2={830} y2={1010} progressValue={reveal} />
        <BigType top={120} left={68} size={54} color={MARIGOLD}>TEK İPUCU</BigType>
        <BigType top={185} left={68} size={96}>BİR KELİMEYDİ</BigType>
        <div style={{position: 'absolute', inset: 0, background: `rgba(224,67,41,${flicker * .16})`, mixBlendMode: 'screen'}} />
        <PaperCaption style={{left: 72, bottom: 150, fontSize: 50}}>Bir ağaca “CRO”,<br/>bir direğe “CROATOAN”.</PaperCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

const Scene4Search: React.FC = () => {
  const frame = useSceneFrame();
  const stepped = useSteppedFrame(12);
  const {fps} = useVideoConfig();
  const whiteIn = spring({frame: frame - 16, fps, config: {damping: 14, stiffness: 88}});
  const partyIn = spring({frame: frame - 55, fps, config: {damping: 13, stiffness: 74}});
  const storm = easeInOutCubic(progress(frame, 100, 178));
  const journal = spring({frame: frame - 120, fps, config: {damping: 13, stiffness: 92}});
  const sway = pingPong(stepped, 0.035);

  return (
    <FilmLook saturate={0.68} sepia={0.1} brightness={0.85} contrast={1.13}>
      <AbsoluteFill style={{background: 'linear-gradient(180deg,#536266,#1a2324 58%,#090b0b)'}}>
        <ColonyStockade style={{opacity: .48, transform: 'scale(1.15) translateY(-150px)', filter: 'blur(1.3px)'}} />
        <SearchParty style={{opacity: partyIn, transform: `translateX(${(1 - partyIn) * -360}px) translateY(${sway * 5}px) scale(1.05)`}} />
        <JohnWhite style={{opacity: whiteIn, transform: `translateX(${(1 - whiteIn) * 430}px) translateY(210px) scale(.72) rotate(${sway * .6}deg)`, transformOrigin: '50% 70%'}} />
        <StormLayer style={{opacity: storm * .86, transform: `translateX(${sway * 16}px) scale(1.04)`}} />
        <TornJournal style={{opacity: journal, transform: `translate(${(1 - journal) * 500}px,${(1 - journal) * 220}px) scale(${.7 + journal * .28}) rotate(${12 - journal * 16}deg)`}} />
        <BigType top={105} left={65} size={52} color={MARIGOLD}>JOHN WHITE DÖNDÜ</BigType>
        <BigType top={170} left={65} size={90}>AMA ARAMA<br/>YARIDA KALDI</BigType>
        <PaperCaption style={{left: 65, bottom: 155, fontSize: 48, opacity: storm}}>Fırtına gemiyi<br/>adadan uzaklaştırdı.</PaperCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

const TheoryCard: React.FC<React.PropsWithChildren<{style: React.CSSProperties; label: string; accent?: string}>> = ({
  style,
  label,
  accent = MARIGOLD,
  children,
}) => (
  <div style={{position: 'absolute', width: 660, height: 1020, background: '#d8c39a', border: `14px solid ${INK}`, boxShadow: '0 30px 70px rgba(0,0,0,.5)', overflow: 'hidden', ...style}}>
    {children}
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, padding: '26px 32px 30px', background: INK, color: accent, fontFamily: 'Arial Black, Impact, sans-serif', fontWeight: 900, fontSize: 64, textAlign: 'center', letterSpacing: -2}}>{label}</div>
  </div>
);

const Scene5Theories: React.FC = () => {
  const frame = useSceneFrame();
  const {fps} = useVideoConfig();
  const a = spring({frame: frame - 12, fps, config: {damping: 12, stiffness: 52, mass: 1.12}});
  const b = spring({frame: frame - 66, fps, config: {damping: 12, stiffness: 52, mass: 1.12}});
  const c = spring({frame: frame - 120, fps, config: {damping: 12, stiffness: 52, mass: 1.12}});
  const reject = easeOutCubic(progress(frame, 170, 222));

  return (
    <FilmLook saturate={0.84} sepia={0.2} contrast={1.1}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%,#654a31,#17100b 72%)'}}>
        <RedThreadBoard style={{opacity: .46, transform: 'scale(1.15) rotate(2deg)'}} />
        <BigType top={92} left={62} size={54} color={MARIGOLD}>HER TEORİ</BigType>
        <BigType top={155} left={62} size={88}>BİR PARÇAYI<br/>AÇIKLIYOR</BigType>

        <TheoryCard label="YERLİ HALKA KARIŞTILAR" style={{left: 180 - (1 - a) * 760, top: 560, transform: `rotate(${-7 + (1 - a) * -18}deg) scale(${.78 + a * .18})`}}>
          <NativeVillage style={{transform: 'scale(1.05) translateY(-320px)'}} />
        </TheoryCard>
        <TheoryCard label="KATLİAM" accent={RED} style={{left: 250 + (1 - b) * 800, top: 500, transform: `rotate(${5 + (1 - b) * 20}deg) scale(${.78 + b * .2})`}}>
          <AttackTheory style={{transform: 'scale(1.05) translateY(-350px)'}} />
        </TheoryCard>
        <TheoryCard label="DENİZDE KAYBOLDULAR" style={{left: 210, top: 615 + (1 - c) * 760, transform: `rotate(${-2 + (1 - c) * 8}deg) scale(${.8 + c * .2})`}}>
          <ShipwreckTheory style={{transform: 'scale(1.04) translateY(-340px)'}} />
        </TheoryCard>

        <div style={{position: 'absolute', inset: 0, background: `rgba(10,7,5,${reject * .7})`}} />
        <BigType top={690} left={80} right={80} size={108} color={CREAM} opacity={reject} align="center">HİÇBİRİ<br/>BÜTÜNÜNÜ DEĞİL</BigType>
        <div style={{position: 'absolute', left: 120, right: 120, top: 1060, height: 22, background: RED, transform: `scaleX(${reject}) rotate(-2deg)`}} />
      </AbsoluteFill>
    </FilmLook>
  );
};

const Scene6Finale: React.FC = () => {
  const frame = useSceneFrame();
  const stepped = useSteppedFrame(12);
  const clockOut = easeInOutCubic(progress(frame, 92, 142));
  const questionIn = easeOutCubic(progress(frame, 112, 170));
  const titleIn = easeOutCubic(progress(frame, 162, 225));
  const rotation = interpolate(frame, [0, 130], [0, 790], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const wobble = boil(stepped, 2.4);

  return (
    <FilmLook saturate={0.6} sepia={0.16} brightness={0.78} contrast={1.2}>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 42%,#514433,#120e0b 68%,#050403)'}}>
        <AntiqueClock style={{opacity: 1 - clockOut, transform: `scale(${1 + frame * .0011 + clockOut * .5}) rotate(${rotation}deg)`, filter: `blur(${clockOut * 8}px)`}} />
        <InkQuestion style={{opacity: questionIn, transform: `translate(${wobble.x}px,${wobble.y}px) scale(${.66 + questionIn * .42}) rotate(${wobble.rotate}deg)`}} />
        <FogAndScratches style={{opacity: .8, transform: `translateX(${pingPong(stepped, .018) * 45}px) scale(1.08)`}} />
        <BigType top={105} left={65} size={55} color={MARIGOLD} opacity={questionIn}>DÖRT YÜZYILDAN FAZLA</BigType>
        <BigType top={178} left={65} size={92} opacity={questionIn}>115 KİŞİ<br/>NEREYE GİTTİ?</BigType>
        <div style={{position: 'absolute', left: 70, right: 70, bottom: 430, opacity: titleIn, transform: `translateY(${(1 - titleIn) * 120}px)`}}>
          <div style={{fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 126, lineHeight: .86, fontWeight: 900, letterSpacing: -6, color: CREAM, textShadow: '0 8px 28px #000'}}>ROANOKE</div>
          <div style={{marginTop: 26, display: 'inline-block', background: RED, color: '#fff4da', padding: '14px 24px 18px', fontFamily: 'Arial Black, Impact, sans-serif', fontSize: 56, fontWeight: 900, transform: 'rotate(-2deg)'}}>HÂLÂ CEVAP VERMİYOR</div>
        </div>
      </AbsoluteFill>
    </FilmLook>
  );
};

const sceneComponents: React.FC[] = [Scene1Opener, Scene2Vanish, Scene3Carving, Scene4Search, Scene5Theories, Scene6Finale];

export const RoanokeNetflix: React.FC = () => {
  let cursor = 0;
  return (
    <AbsoluteFill style={{backgroundColor: '#080604'}}>
      <Audio src={staticFile('roanoke-netflix/audio/ambience.wav')} volume={0.17} />
      {ROANOKE_SCENES.map((scene, index) => {
        const Component = sceneComponents[index];
        const from = cursor;
        cursor += scene.duration;
        return (
          <Sequence key={scene.id} from={from} durationInFrames={scene.duration} name={`Roanoke ${scene.id}`}>
            <SceneEnvelope duration={scene.duration}>
              <Component />
            </SceneEnvelope>
            <Audio src={staticFile(scene.audio)} volume={1} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{pointerEvents: 'none', background: 'linear-gradient(180deg,rgba(0,0,0,.12),transparent 18%,transparent 76%,rgba(0,0,0,.3))'}} />
    </AbsoluteFill>
  );
};
