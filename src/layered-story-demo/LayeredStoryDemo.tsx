import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const FPS = 30;
const SCENE = 105;
export const LAYERED_STORY_TOTAL_FRAMES = SCENE * 6;

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};

const posterize = (frame: number, step = 3) => Math.floor(frame / step) * step;

const PaperNoise: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: 'none',
      opacity: 0.17,
      mixBlendMode: 'multiply',
      backgroundImage:
        'repeating-radial-gradient(circle at 20% 30%, rgba(0,0,0,.18) 0 1px, transparent 1px 4px)',
      backgroundSize: '11px 11px',
    }}
  />
);

const FilmTreatment: React.FC = () => {
  const frame = useCurrentFrame();
  const flicker = 0.9 + Math.sin(frame * 1.73) * 0.035;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{
          opacity: 0.22,
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(18,12,7,.16) 0 2px, transparent 2px 7px)',
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(17,10,4,.72) 100%)',
          opacity: 0.78,
        }}
      />
      <AbsoluteFill style={{background: `rgba(255,239,197,${(1 - flicker) * 0.8})`}} />
      <PaperNoise />
    </AbsoluteFill>
  );
};

const Caption: React.FC<{children: React.ReactNode; accent?: string}> = ({children, accent = '#f6b72c'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 14, stiffness: 150}});
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        bottom: 135,
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: 74,
        lineHeight: 0.98,
        letterSpacing: -3,
        color: '#fff7df',
        textShadow: '0 8px 0 rgba(0,0,0,.45)',
        transform: `translateY(${interpolate(enter, [0, 1], [80, 0])}px)`,
        opacity: enter,
        textTransform: 'uppercase',
      }}
    >
      <span style={{background: accent, color: '#1a1008', padding: '4px 12px'}}>{children}</span>
    </div>
  );
};

const YearPlaque: React.FC<{year: string}> = ({year}) => {
  const frame = useCurrentFrame();
  const pop = spring({frame, fps: FPS, config: {damping: 13, stiffness: 170}});
  return (
    <div
      style={{
        position: 'absolute',
        top: 110,
        left: 70,
        padding: '18px 28px',
        border: '5px solid #21150d',
        background: '#f4e5c1',
        color: '#21150d',
        fontFamily: 'Georgia, serif',
        fontWeight: 900,
        fontSize: 46,
        transform: `scale(${pop}) rotate(-2deg)`,
        boxShadow: '12px 14px 0 rgba(0,0,0,.26)',
      }}
    >
      {year}
    </div>
  );
};

const SceneOne: React.FC = () => {
  const raw = useCurrentFrame();
  const frame = posterize(raw);
  const zoom = interpolate(frame, [0, 100], [0.82, 1.38], {...clamp, easing: Easing.out(Easing.cubic)});
  const drift = Math.sin(frame / 12) * 8;
  return (
    <AbsoluteFill style={{background: '#c9b486', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(145deg,#d8c79d,#9e865d)'}} />
      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 220,
          width: 740,
          height: 980,
          border: '30px solid #a66b18',
          outline: '8px solid #332012',
          background: '#24130d',
          transform: `translateY(${drift}px) scale(${zoom})`,
          transformOrigin: '50% 48%',
          boxShadow: '0 40px 80px rgba(0,0,0,.45)',
          overflow: 'hidden',
        }}
      >
        <AbsoluteFill style={{background: 'linear-gradient(#382219,#15100d)'}} />
        <div style={{position: 'absolute', left: 90, right: 90, bottom: 100, height: 410, background: '#6b1b18'}} />
        <div style={{position: 'absolute', left: 245, bottom: 140, width: 250, height: 460, borderRadius: '46% 46% 22% 22%', background: '#111'}} />
        <div style={{position: 'absolute', left: 292, bottom: 530, width: 155, height: 155, borderRadius: '50%', background: '#c89269'}} />
        <div style={{position: 'absolute', left: 116, top: 86, color: '#f4e5c1', fontFamily: 'Georgia', fontSize: 74, fontWeight: 900}}>KÜÇÜK BİR<br/>FİKİR</div>
      </div>
      <YearPlaque year="1997" />
      <Caption>Her şey küçük başladı</Caption>
      <FilmTreatment />
    </AbsoluteFill>
  );
};

const SceneTwo: React.FC = () => {
  const raw = useCurrentFrame();
  const frame = posterize(raw, 2);
  const spin = interpolate(frame, [8, 72], [720, 0], {...clamp, easing: Easing.out(Easing.back(1.4))});
  const left = spring({frame: frame - 6, fps: FPS, config: {damping: 12, stiffness: 130}});
  const right = spring({frame: frame - 15, fps: FPS, config: {damping: 12, stiffness: 130}});
  const flash = frame > 72 && frame < 78 ? 1 : 0;
  return (
    <AbsoluteFill style={{background: '#9d1118', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'repeating-conic-gradient(from 0deg,#c31b22 0 12deg,#7e0c12 12deg 24deg)'}} />
      <div style={{position: 'absolute', left: -170 + left * 260, top: 470, width: 470, height: 250, background: '#f1d6a2', transform: 'rotate(14deg)', border: '8px solid #1c0d08', boxShadow: '20px 20px 0 rgba(0,0,0,.25)'}} />
      <div style={{position: 'absolute', right: -190 + right * 280, top: 380, width: 500, height: 300, background: '#2b190e', transform: 'rotate(-12deg)', border: '8px solid #f0c95d', boxShadow: '-20px 20px 0 rgba(0,0,0,.25)'}} />
      <div style={{position: 'absolute', top: 190, left: 90, right: 90, textAlign: 'center', fontFamily: 'Arial Black', fontSize: 122, color: '#ffdf64', WebkitTextStroke: '7px #1d0e08', transform: `rotate(${spin}deg) scale(${interpolate(frame, [0, 70], [0.25, 1], clamp)})`}}>50 MİLYON</div>
      <div style={{position: 'absolute', left: 315, top: 740, width: 450, height: 610, borderRadius: '48% 48% 20% 20%', background: '#16100d', boxShadow: '0 35px 0 rgba(0,0,0,.25)'}} />
      <div style={{position: 'absolute', left: 420, top: 640, width: 240, height: 240, borderRadius: '50%', background: '#bd7f59'}} />
      <div style={{position: 'absolute', left: 450, top: 732, width: 180, height: 28, borderRadius: 20, background: '#f0d7bc', transform: 'rotate(8deg)'}} />
      <Caption accent="#ffdf64">Ve ona güldüler</Caption>
      <AbsoluteFill style={{background: '#e7f5ff', opacity: flash, mixBlendMode: 'difference'}} />
      <FilmTreatment />
    </AbsoluteFill>
  );
};

const Newspaper: React.FC<{text: string; x: number; y: number; rotate: number; delay: number}> = ({text, x, y, rotate, delay}) => {
  const frame = useCurrentFrame();
  const p = spring({frame: frame - delay, fps: FPS, config: {damping: 11, stiffness: 145}});
  return (
    <div style={{position: 'absolute', left: x, top: y + (1 - p) * 600, width: 700, height: 390, background: '#efe0bd', border: '7px solid #21150e', transform: `rotate(${rotate}deg) scale(${0.7 + p * 0.3})`, boxShadow: '18px 24px 0 rgba(0,0,0,.26)', padding: 42}}>
      <div style={{fontFamily: 'Georgia', fontWeight: 900, fontSize: 68, borderBottom: '8px solid #21150e', paddingBottom: 20}}>{text}</div>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, marginTop: 28}}>{[0,1,2].map((i) => <div key={i} style={{height: 145, background: `repeating-linear-gradient(#5b4a34 0 7px,transparent 7px 16px)`}} />)}</div>
    </div>
  );
};

const SceneThree: React.FC = () => (
  <AbsoluteFill style={{background: '#765035', overflow: 'hidden'}}>
    <AbsoluteFill style={{background: 'repeating-linear-gradient(90deg,#704729 0 90px,#805639 90px 180px)'}} />
    <Newspaper text="GEÇ ÜCRET YOK" x={70} y={130} rotate={-7} delay={0} />
    <Newspaper text="MAĞAZA YOK" x={290} y={580} rotate={6} delay={22} />
    <Newspaper text="ÖNCE MÜŞTERİ" x={50} y={1030} rotate={-3} delay={44} />
    <Caption>Rakibinin tersini yaptı</Caption>
    <FilmTreatment />
  </AbsoluteFill>
);

const SceneFour: React.FC = () => {
  const frame = posterize(useCurrentFrame());
  const push = interpolate(frame, [0, 100], [1, 1.28], {...clamp, easing: Easing.inOut(Easing.quad)});
  const person = interpolate(frame, [0, 100], [1, 1.48], clamp);
  const shadow = interpolate(frame, [0, 100], [0.4, 1], clamp);
  return (
    <AbsoluteFill style={{background: '#5f675f', overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: -80, transform: `scale(${push})`, background: 'linear-gradient(#778078 0 48%,#393b37 48% 100%)'}}>
        <div style={{position: 'absolute', left: 90, right: 90, top: 400, height: 650, background: '#2b2b28', border: '10px solid #141414'}} />
        <div style={{position: 'absolute', left: 155, top: 470, width: 770, height: 170, background: '#315996', color: '#f7d540', fontFamily: 'Arial Black', fontSize: 92, textAlign: 'center', paddingTop: 32}}>KAPANDI</div>
      </div>
      <div style={{position: 'absolute', left: 270, bottom: 210, width: 520, height: 160, borderRadius: '50%', background: '#080808', opacity: 0.42, filter: 'blur(18px)', transform: `scaleX(${1 + shadow}) skewX(-30deg)`, transformOrigin: '50% 100%'}} />
      <div style={{position: 'absolute', left: 360, bottom: 240, width: 360, height: 780, background: '#171717', borderRadius: '44% 44% 12% 12%', transform: `scale(${person})`, transformOrigin: '50% 100%'}} />
      <div style={{position: 'absolute', left: 430, bottom: 920, width: 220, height: 220, borderRadius: '50%', background: '#a66f51', transform: `scale(${person})`, transformOrigin: '50% 100%'}} />
      <Caption accent="#e94b35">Binlerce mağaza kapandı</Caption>
      <FilmTreatment />
    </AbsoluteFill>
  );
};

const SceneFive: React.FC = () => {
  const frame = useCurrentFrame();
  const swing = Math.sin(frame / 8) * 8;
  const light = interpolate(frame, [8, 25], [0, 1], clamp);
  const cash = Math.max(0, Math.sin(frame * 0.55)) * light;
  const push = interpolate(frame, [0, 104], [1, 1.15], clamp);
  return (
    <AbsoluteFill style={{background: '#17120e', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${push})`, background: 'linear-gradient(145deg,#20170f,#0a0806)'}}>
        <div style={{position: 'absolute', left: 100, right: 100, bottom: 180, height: 560, background: '#4a2e1b'}} />
        {[0,1,2,3,4].map((i) => <div key={i} style={{position: 'absolute', left: 150 + i * 155, bottom: 430 + (i % 2) * 70, width: 150, height: 85, background: `rgba(223,175,64,${0.45 + cash * 0.55})`, border: '5px solid #2a1b0d', transform: `rotate(${i % 2 ? 6 : -5}deg)`, boxShadow: `0 0 ${25 + cash * 60}px rgba(255,197,61,.75)`}} />)}
        <div style={{position: 'absolute', left: 390, bottom: 300, width: 300, height: 720, background: '#171717', borderRadius: '45% 45% 15% 15%'}} />
        <div style={{position: 'absolute', left: 445, bottom: 930, width: 190, height: 190, background: '#c18a62', borderRadius: '50%'}} />
      </AbsoluteFill>
      <div style={{position: 'absolute', left: 490, top: -80, width: 100, height: 520, background: '#25211b', transform: `rotate(${swing}deg)`, transformOrigin: '50% 0%'}} />
      <div style={{position: 'absolute', left: 350 + swing * 2.6, top: 340, width: 380, height: 210, borderRadius: '50%', background: '#d9ae54', border: '8px solid #15100c', transform: `rotate(${swing}deg)`}} />
      <AbsoluteFill style={{opacity: light, background: 'radial-gradient(circle at 52% 42%,rgba(255,220,128,.55),transparent 48%)', mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', top: 170, left: 80, right: 80, textAlign: 'center', fontFamily: 'Arial Black', fontSize: 140, color: '#f8cc54', WebkitTextStroke: '7px #1d1008'}}>45 MİLYAR $</div>
      <Caption accent="#f8cc54">Sonuç değişti</Caption>
      <FilmTreatment />
    </AbsoluteFill>
  );
};

const SceneSix: React.FC = () => {
  const frame = useCurrentFrame();
  const wag = Math.sin(frame / 3.6) * interpolate(frame, [0, 55, 100], [0, 24, 0], clamp);
  const reveal = spring({frame: frame - 12, fps: FPS, config: {damping: 13, stiffness: 120}});
  return (
    <AbsoluteFill style={{background: '#c9d1ce', overflow: 'hidden'}}>
      <AbsoluteFill style={{background: 'linear-gradient(160deg,#d9e2df 0 55%,#4f5857 55% 100%)'}} />
      {[0,1,2,3].map((i) => <div key={i} style={{position: 'absolute', left: 80 + i * 240, top: 220, width: 190, height: 850, background: '#82918f', border: '8px solid #37403f'}} />)}
      <div style={{position: 'absolute', right: 140, bottom: 200, width: 330, height: 800, background: '#151515', borderRadius: '44% 44% 12% 12%'}} />
      <div style={{position: 'absolute', right: 200, bottom: 900, width: 210, height: 210, background: '#c48d68', borderRadius: '50%'}} />
      <div style={{position: 'absolute', left: 70, top: 250, width: 580, fontFamily: 'Arial Black', fontSize: 92, lineHeight: 0.94, color: '#1d1610', transform: `translateX(${interpolate(reveal, [0,1], [-600,0])}px)`}}>TARİHİN<br/>EN PAHALI</div>
      <div style={{position: 'absolute', left: 110, top: 650, width: 420, height: 650, background: '#c51e25', clipPath: 'polygon(39% 0,62% 0,62% 37%,78% 22%,92% 36%,58% 72%,39% 72%,8% 39%,22% 25%,39% 43%)', transform: `rotate(${wag}deg) scale(${reveal})`, transformOrigin: '50% 90%', filter: 'drop-shadow(18px 22px 0 rgba(0,0,0,.28))'}} />
      <div style={{position: 'absolute', left: 145, top: 1090, fontFamily: 'Arial Black', fontSize: 210, color: '#f4e6c4', WebkitTextStroke: '9px #1d1610', transform: `scale(${reveal})`}}>HAYIR</div>
      <FilmTreatment />
    </AbsoluteFill>
  );
};

export const LayeredStoryDemo: React.FC = () => (
  <AbsoluteFill style={{background: '#100b08'}}>
    <Sequence from={0} durationInFrames={SCENE}><SceneOne /></Sequence>
    <Sequence from={SCENE} durationInFrames={SCENE}><SceneTwo /></Sequence>
    <Sequence from={SCENE * 2} durationInFrames={SCENE}><SceneThree /></Sequence>
    <Sequence from={SCENE * 3} durationInFrames={SCENE}><SceneFour /></Sequence>
    <Sequence from={SCENE * 4} durationInFrames={SCENE}><SceneFive /></Sequence>
    <Sequence from={SCENE * 5} durationInFrames={SCENE}><SceneSix /></Sequence>
  </AbsoluteFill>
);
