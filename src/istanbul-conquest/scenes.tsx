import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {
  Cutout,
  PaperLabel,
  PaperWorld,
  RedPencilPath,
  SceneSound,
  Tape,
  clamp,
  fade,
  progress,
  smooth,
  usePaperSpring,
} from './engine';
import {
  AssaultCutout,
  CannonCutout,
  CityCutout,
  FinalSkyline,
  GoldenHornMap,
  MehmedPortrait,
  ShipCutout,
  WallsCutout,
} from './visuals';

const paperEase = (value: number) => smooth(clamp(value));

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const city = usePaperSpring(18, 17, 90);
  const label = usePaperSpring(76, 14, 120);
  const circle = paperEase(progress(frame, 98, 154));
  const camera = interpolate(frame, [0, 180], [1.015, 1.065]);

  return (
    <PaperWorld>
      <SceneSound scene={1} />
      <AbsoluteFill style={{transform: `scale(${camera})`}}>
        <Cutout
          redEdge
          style={{
            left: 144,
            top: 274,
            transform: `translate(${interpolate(city, [0, 1], [720, 0])}px, ${interpolate(city, [0, 1], [-330, 0])}px) rotate(${interpolate(city, [0, 1], [18, -2.4])}deg) scale(${interpolate(city, [0, 1], [.72, 1])})`,
          }}
        >
          <CityCutout />
        </Cutout>
        <Tape style={{left: 178, top: 288, rotate: '-13deg', opacity: fade(frame, 42, 57)}} />
        <Tape style={{right: 115, top: 1116, rotate: '11deg', opacity: fade(frame, 50, 66)}} />

        <PaperLabel
          dark
          style={{
            left: 78,
            top: 164,
            fontSize: 49,
            transform: `translateY(${interpolate(label, [0, 1], [-170, 0])}px) rotate(-2deg)`,
          }}
        >
          29 MAYIS 1453
        </PaperLabel>
        <PaperLabel
          style={{
            left: 86,
            bottom: 216,
            fontSize: 59,
            transform: `translateX(${interpolate(label, [0, 1], [-840, 0])}px) rotate(1.4deg)`,
          }}
        >
          BİR ŞEHRİN KADERİ
        </PaperLabel>
        <RedPencilPath
          d="M155 760 C142 471 389 345 676 420 C890 476 915 780 744 1002 C571 1218 250 1122 170 895"
          progressValue={circle}
          width={9}
        />
      </AbsoluteFill>
    </PaperWorld>
  );
};

export const Scene2Preparation: React.FC = () => {
  const frame = useCurrentFrame();
  const portrait = usePaperSpring(5, 16, 92);
  const cannon = usePaperSpring(48, 17, 105);
  const boom = paperEase(progress(frame, 115, 128));
  const decay = Math.exp(-Math.max(0, frame - 115) / 14);
  const recoil = frame < 115 ? 0 : Math.sin((frame - 115) * 0.72) * 26 * decay;
  const smoke = paperEase(progress(frame, 116, 154));

  return (
    <PaperWorld tone="red">
      <SceneSound scene={2} sfx={[{from: 115, src: 'cannon.wav', volume: 0.58}]} />
      <Cutout
        redEdge
        style={{
          left: 36,
          top: 205,
          transform: `translateX(${interpolate(portrait, [0, 1], [-610, 0])}px) rotate(${interpolate(portrait, [0, 1], [-12, -2])}deg) scale(${interpolate(portrait, [0, 1], [.8, 1])})`,
        }}
      >
        <MehmedPortrait />
      </Cutout>
      <Cutout
        style={{
          right: -70 + recoil,
          bottom: 230,
          transform: `translateX(${interpolate(cannon, [0, 1], [870, 0])}px) rotate(${interpolate(cannon, [0, 1], [11, -4])}deg) scale(${interpolate(cannon, [0, 1], [.74, 1])})`,
        }}
      >
        <CannonCutout />
      </Cutout>
      <PaperLabel
        dark
        style={{left: 86, top: 122, fontSize: 50, transform: 'rotate(-2.5deg)'}}
      >
        GENÇ SULTAN MEHMET
      </PaperLabel>
      <PaperLabel
        style={{right: 65, bottom: 145, fontSize: 48, transform: 'rotate(2deg)'}}
      >
        AYLAR SÜREN HAZIRLIK
      </PaperLabel>
      <RedPencilPath
        d="M468 684 C638 704 755 862 823 1118"
        progressValue={paperEase(progress(frame, 68, 118))}
      />
      {Array.from({length: 6}).map((_, index) => {
        const local = clamp(smoke - index * 0.09);
        return (
          <div
            key={index}
            style={{
              position: 'absolute',
              right: 55 + index * 34,
              bottom: 480 + index * 23,
              width: 74 + index * 17,
              height: 54 + index * 15,
              borderRadius: '50%',
              background: 'rgba(235,226,207,.72)',
              filter: 'blur(8px)',
              opacity: local * (1 - boom * 0.1),
              transform: `translate(${interpolate(local, [0, 1], [0, 165 + index * 18])}px, ${interpolate(local, [0, 1], [0, -68 - index * 14])}px) scale(${.5 + local})`,
            }}
          />
        );
      })}
      <Tape style={{left: 35, top: 650, rotate: '85deg', opacity: .45}} />
    </PaperWorld>
  );
};

export const Scene3Walls: React.FC = () => {
  const frame = useCurrentFrame();
  const wall = usePaperSpring(7, 18, 88);
  const crack = paperEase(progress(frame, 55, 145));
  const ball = paperEase(progress(frame, 33, 103));
  const camera = interpolate(frame, [0, 180], [1.01, 1.12]);

  return (
    <PaperWorld tone="night">
      <SceneSound scene={3} />
      <AbsoluteFill style={{transform: `scale(${camera}) translateY(${interpolate(frame, [0, 180], [24, -30])}px)`}}>
        <Cutout
          redEdge
          style={{
            left: 52,
            top: 345,
            transform: `translateY(${interpolate(wall, [0, 1], [780, 0])}px) rotate(${interpolate(wall, [0, 1], [7, -1.2])}deg)`,
          }}
        >
          <WallsCutout />
        </Cutout>
        <PaperLabel style={{left: 70, top: 175, fontSize: 57, transform: 'rotate(-2deg)'}}>
          SURUN GÜCÜ: YÜZYILLAR
        </PaperLabel>
        <PaperLabel red style={{right: 72, bottom: 175, fontSize: 54, transform: 'rotate(2deg)'}}>
          TOP ATEŞİ: GÜNLERCE
        </PaperLabel>
        <div
          style={{
            position: 'absolute',
            left: interpolate(ball, [0, 1], [-70, 550]),
            top: interpolate(ball, [0, 1], [1050, 770]),
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: '#1c1b18',
            boxShadow: '0 0 0 8px rgba(235,218,182,.22), 0 15px 20px rgba(0,0,0,.35)',
          }}
        />
        <RedPencilPath
          d="M576 625 L610 690 580 751 625 818 588 892 637 970 604 1055"
          progressValue={crack}
          width={11}
        />
      </AbsoluteFill>
    </PaperWorld>
  );
};

export const Scene4Ships: React.FC = () => {
  const frame = useCurrentFrame();
  const map = usePaperSpring(0, 19, 82);
  const route = paperEase(progress(frame, 34, 150));
  const shipA = paperEase(progress(frame, 61, 171));
  const shipB = paperEase(progress(frame, 88, 192));
  const chainTight = paperEase(progress(frame, 15, 62));

  return (
    <PaperWorld>
      <SceneSound scene={4} sfx={[{from: 108, src: 'wood-creak.wav', volume: 0.38}]} />
      <Cutout
        style={{
          left: 68,
          top: 315,
          transform: `translateY(${interpolate(map, [0, 1], [660, 0])}px) rotate(${interpolate(map, [0, 1], [-8, -1.7])}deg) scale(${interpolate(map, [0, 1], [.84, 1])})`,
        }}
      >
        <GoldenHornMap />
      </Cutout>
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position: 'absolute', inset: 0}}>
        <path
          d="M220 808 C322 838 401 842 496 827"
          fill="none"
          stroke="#211c18"
          strokeWidth="18"
          strokeDasharray={`${interpolate(chainTight, [0, 1], [3, 15])} 11`}
          strokeLinecap="round"
        />
      </svg>
      <RedPencilPath
        d="M180 1202 C334 1085 493 1118 625 1042 C758 965 826 921 930 894"
        progressValue={route}
        width={9}
      />
      <Cutout
        redEdge
        style={{
          left: interpolate(shipA, [0, 1], [80, 560]),
          top: interpolate(shipA, [0, 1], [1235, 930]),
          transform: `rotate(${interpolate(shipA, [0, 1], [-12, -23])}deg) scale(.82)`,
        }}
      >
        <ShipCutout />
      </Cutout>
      <Cutout
        style={{
          left: interpolate(shipB, [0, 1], [10, 390]),
          top: interpolate(shipB, [0, 1], [1410, 1105]),
          transform: `rotate(${interpolate(shipB, [0, 1], [-4, -17])}deg) scale(.68)`,
        }}
      >
        <ShipCutout flip />
      </Cutout>
      <PaperLabel dark style={{left: 68, top: 150, fontSize: 53, transform: 'rotate(-2deg)'}}>
        HALİÇ ZİNCİRLE KAPALIYDI
      </PaperLabel>
      <PaperLabel red style={{left: 134, bottom: 150, fontSize: 64, transform: 'rotate(1.5deg)'}}>
        GEMİLER KARADAN YÜRÜDÜ
      </PaperLabel>
      <Tape style={{right: 80, top: 380, rotate: '14deg', opacity: .52}} />
    </PaperWorld>
  );
};

export const Scene5Assault: React.FC = () => {
  const frame = useCurrentFrame();
  const assault = usePaperSpring(4, 18, 90);
  const circle = paperEase(progress(frame, 92, 150));
  const pulse = frame > 70 ? Math.sin((frame - 70) * 0.35) * Math.exp(-(frame - 70) / 75) : 0;
  const camera = interpolate(frame, [0, 195], [1.02, 1.13]);

  return (
    <PaperWorld tone="night">
      <SceneSound scene={5} />
      <AbsoluteFill style={{transform: `scale(${camera}) translate(${pulse * 3}px, ${pulse * 2}px)`}}>
        <Cutout
          redEdge
          style={{
            left: 72,
            top: 337,
            transform: `translateY(${interpolate(assault, [0, 1], [720, 0])}px) rotate(${interpolate(assault, [0, 1], [5, -1])}deg)`,
          }}
        >
          <AssaultCutout />
        </Cutout>
        <PaperLabel red style={{left: 74, top: 164, fontSize: 69, transform: 'rotate(-2deg)'}}>
          SON HÜCUM
        </PaperLabel>
        <PaperLabel style={{right: 70, bottom: 166, fontSize: 53, transform: 'rotate(2deg)'}}>
          ŞAFAKTAN ÖNCE
        </PaperLabel>
        <RedPencilPath
          d="M483 647 C555 607 647 652 668 746 C688 842 628 943 540 951 C458 960 393 876 410 777 C420 719 445 676 483 647"
          progressValue={circle}
          width={10}
        />
        <div
          style={{
            position: 'absolute',
            left: -220,
            top: 0,
            width: 430,
            height: 1920,
            background: 'linear-gradient(90deg, transparent, rgba(232,205,151,.2), transparent)',
            transform: `translateX(${interpolate(frame, [35, 170], [0, 1450], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}px) rotate(12deg)`,
            mixBlendMode: 'screen',
          }}
        />
      </AbsoluteFill>
    </PaperWorld>
  );
};

export const Scene6Fall: React.FC = () => {
  const frame = useCurrentFrame();
  const skyline = usePaperSpring(4, 18, 88);
  const stamp = usePaperSpring(82, 11, 150);
  const wipe = paperEase(progress(frame, 26, 104));

  return (
    <PaperWorld>
      <SceneSound scene={6} sfx={[{from: 84, src: 'stamp.wav', volume: 0.48}]} />
      <Cutout
        redEdge
        style={{
          left: 38,
          top: 365,
          transform: `translateY(${interpolate(skyline, [0, 1], [680, 0])}px) rotate(${interpolate(skyline, [0, 1], [-5, -1])}deg)`,
        }}
      >
        <FinalSkyline />
      </Cutout>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: `${(1 - wipe) * 100}%`,
          height: '100%',
          background: '#34393a',
          opacity: .7,
          boxShadow: '18px 0 34px rgba(23,17,12,.3)',
        }}
      />
      <PaperLabel dark style={{left: 70, top: 158, fontSize: 55, transform: 'rotate(-2deg)'}}>
        ŞEHİR DÜŞTÜ
      </PaperLabel>
      <PaperLabel
        red
        style={{
          left: 250,
          bottom: 178,
          fontSize: 68,
          transform: `scale(${interpolate(stamp, [0, 1], [2.1, 1])}) rotate(${interpolate(stamp, [0, 1], [-12, -1])}deg)`,
          opacity: stamp,
        }}
      >
        FATİH SULTAN MEHMET
      </PaperLabel>
      <Tape style={{left: 95, top: 1200, rotate: '-8deg', opacity: .5}} />
      <Tape style={{right: 90, top: 510, rotate: '11deg', opacity: .5}} />
    </PaperWorld>
  );
};

export const Scene7Legacy: React.FC = () => {
  const frame = useCurrentFrame();
  const skyline = usePaperSpring(0, 20, 80);
  const first = usePaperSpring(34, 15, 100);
  const second = usePaperSpring(72, 15, 105);
  const seal = usePaperSpring(112, 11, 145);
  const pencil = paperEase(progress(frame, 118, 174));
  const settle = interpolate(frame, [0, 130, 210], [1.07, 1.035, 1.035], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <PaperWorld>
      <SceneSound scene={7} />
      <AbsoluteFill style={{transform: `scale(${settle})`}}>
        <Cutout
          style={{
            left: 36,
            top: 250,
            transform: `translateY(${interpolate(skyline, [0, 1], [520, 0])}px) rotate(-1.2deg)`,
          }}
        >
          <FinalSkyline />
        </Cutout>
        <PaperLabel
          dark
          style={{
            left: 80,
            top: 126,
            fontSize: 55,
            transform: `translateX(${interpolate(first, [0, 1], [-760, 0])}px) rotate(-2deg)`,
          }}
        >
          BİR ŞEHRİN DEĞİL
        </PaperLabel>
        <PaperLabel
          red
          style={{
            left: 155,
            bottom: 248,
            fontSize: 66,
            transform: `translateX(${interpolate(second, [0, 1], [950, 0])}px) rotate(1.5deg)`,
          }}
        >
          DÜNYANIN DENGESİ DEĞİŞTİ
        </PaperLabel>
        <div
          style={{
            position: 'absolute',
            right: 82,
            top: 194,
            width: 190,
            height: 190,
            borderRadius: '50%',
            border: '12px double #8d2d25',
            background: 'rgba(222,204,165,.88)',
            color: '#76251f',
            fontFamily: 'Georgia, Times New Roman, serif',
            fontWeight: 900,
            fontSize: 35,
            lineHeight: 1.05,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            transform: `scale(${interpolate(seal, [0, 1], [2.3, 1])}) rotate(${interpolate(seal, [0, 1], [22, -7])}deg)`,
            opacity: seal,
            boxShadow: '0 10px 20px rgba(47,31,19,.25)',
          }}
        >
          1453
          <br />
          İSTANBUL
        </div>
        <RedPencilPath
          d="M93 1590 C244 1672 424 1688 612 1648 C771 1615 887 1541 955 1438"
          progressValue={pencil}
          width={9}
        />
        <Tape style={{left: 68, top: 870, rotate: '83deg', opacity: .46}} />
        <Tape style={{right: 52, top: 1250, rotate: '-13deg', opacity: .46}} />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: 'rgba(32,22,14,.1)',
          opacity: interpolate(frame, [165, 210], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          pointerEvents: 'none',
        }}
      />
    </PaperWorld>
  );
};
