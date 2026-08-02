import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {
  FilmLook,
  LayerImage,
  ManuscriptCaption,
  SceneAudio,
  boil,
  easeInOutCubic,
  easeOutCubic,
  fadeIn,
  fadeOut,
  progress,
  useSteppedFrame,
} from './engine';

export const Scene1InkHook: React.FC = () => {
  const frame = useSteppedFrame(12);
  const ink = easeOutCubic(progress(frame, 8, 58));
  const arch = easeOutCubic(progress(frame, 28, 88));
  const book = easeOutCubic(progress(frame, 68, 120));
  const close = fadeOut(frame, 145, 165);
  const wobble = boil(frame, 1.5);

  return (
    <FilmLook>
      <SceneAudio scene={1} sfx={[{from: 8, src: 'ink-drop.wav'}, {from: 68, src: 'page-turn.wav', volume: 0.45}]} />
      <AbsoluteFill style={{backgroundColor: '#cdbb94', opacity: close}}>
        <LayerImage src="first-university/scene-01/parchment.svg" />
        <AbsoluteFill
          style={{
            clipPath: `circle(${interpolate(ink, [0, 1], [0, 82])}% at 50% 46%)`,
            transform: `scale(${interpolate(ink, [0, 1], [1.18, 1])})`,
          }}
        >
          <LayerImage src="first-university/scene-01/ink-city.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translateY(${interpolate(arch, [0, 1], [520, 0])}px) scale(${interpolate(arch, [0, 1], [.72, 1])})`}}>
          <LayerImage src="first-university/scene-01/arch.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translate(${wobble.x}px, ${interpolate(book, [0, 1], [620, 0]) + wobble.y}px) rotate(${interpolate(book, [0, 1], [-12, -2])}deg)`}}>
          <LayerImage src="first-university/scene-01/book.svg" />
        </AbsoluteFill>
        <ManuscriptCaption gold style={{left: 115, top: 220, fontSize: 53, opacity: fadeIn(frame, 34, 50)}}>
          DÜNYANIN İLK ÜNİVERSİTESİ?
        </ManuscriptCaption>
        <ManuscriptCaption style={{right: 95, top: 1375, fontSize: 78, opacity: fadeIn(frame, 98, 116)}}>
          KARAVİYYİN
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

export const Scene2MapJourney: React.FC = () => {
  const frame = useSteppedFrame(12);
  const panX = interpolate(frame, [0, 180], [130, -110]);
  const mapScale = interpolate(frame, [0, 180], [1.08, 1.2]);
  const route = easeInOutCubic(progress(frame, 34, 128));
  const pin = easeOutCubic(progress(frame, 92, 130));
  const compass = interpolate(frame, [0, 180], [-24, 34]);

  return (
    <FilmLook>
      <SceneAudio scene={2} sfx={[{from: 3, src: 'map-whoosh.wav'}, {from: 92, src: 'pin.wav'}]} />
      <AbsoluteFill style={{backgroundColor: '#bda77d'}}>
        <AbsoluteFill style={{transform: `translateX(${panX}px) scale(${mapScale})`}}>
          <LayerImage src="first-university/scene-02/map.svg" />
          <LayerImage src="first-university/scene-02/morocco.svg" style={{opacity: fadeIn(frame, 20, 42)}} />
        </AbsoluteFill>
        <AbsoluteFill style={{clipPath: `inset(0 ${100 - route * 100}% 0 0)`}}>
          <LayerImage src="first-university/scene-02/route.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translateY(${interpolate(pin, [0, 1], [-420, 0])}px) scale(${interpolate(pin, [0, 1], [1.5, 1])})`}}>
          <LayerImage src="first-university/scene-02/fez-pin.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `rotate(${compass}deg)`, transformOrigin: '850px 1490px'}}>
          <LayerImage src="first-university/scene-02/compass.svg" />
        </AbsoluteFill>
        <ManuscriptCaption style={{left: 75, top: 230, fontSize: 57, opacity: fadeIn(frame, 18, 34)}}>
          9. YÜZYIL / FES
        </ManuscriptCaption>
        <ManuscriptCaption gold style={{right: 70, bottom: 205, fontSize: 62, opacity: fadeIn(frame, 112, 136)}}>
          TİCARET · ZANAAT · BİLGİ
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

export const Scene3Foundation: React.FC = () => {
  const frame = useSteppedFrame(12);
  const build = easeOutCubic(progress(frame, 12, 122));
  const year = easeOutCubic(progress(frame, 48, 92));
  const frameDetach = easeInOutCubic(progress(frame, 112, 176));
  const zoom = interpolate(frame, [0, 195], [1, 1.12]);

  return (
    <FilmLook>
      <SceneAudio scene={3} sfx={[{from: 15, src: 'stone-thump.wav'}, {from: 62, src: 'bell.wav', volume: 0.34}, {from: 116, src: 'frame-whoosh.wav'}]} />
      <AbsoluteFill style={{backgroundColor: '#aa8b5c', transform: `scale(${zoom})`}}>
        <LayerImage src="first-university/scene-03/courtyard.svg" />
        <AbsoluteFill style={{clipPath: `inset(${100 - build * 100}% 0 0 0)`}}>
          <LayerImage src="first-university/scene-03/pillars.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `perspective(1200px) rotateY(${interpolate(year, [0, 1], [88, 0])}deg) scale(${interpolate(year, [0, 1], [.6, 1])})`}}>
          <LayerImage src="first-university/scene-03/year-859.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `scale(${interpolate(frameDetach, [0, 1], [.38, 1.28])}) translateY(${interpolate(frameDetach, [0, 1], [520, 20])}px)`}}>
          <LayerImage src="first-university/scene-03/gold-frame.svg" />
        </AbsoluteFill>
        <ManuscriptCaption style={{left: 80, top: 245, fontSize: 55, opacity: fadeIn(frame, 18, 38)}}>
          CAMİ VE ÖĞRENİM MERKEZİ
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

export const Scene4Founder: React.FC = () => {
  const frame = useSteppedFrame(12);
  const portrait = easeOutCubic(progress(frame, 6, 78));
  const manuscript = easeOutCubic(progress(frame, 52, 116));
  const pen = easeInOutCubic(progress(frame, 88, 152));
  const underline = progress(frame, 105, 160);
  const wobble = boil(frame, 1.7);

  return (
    <FilmLook>
      <SceneAudio scene={4} sfx={[{from: 52, src: 'paper-slide.wav'}, {from: 88, src: 'pen-scratch.wav', volume: 0.52}]} />
      <AbsoluteFill style={{backgroundColor: '#927044'}}>
        <LayerImage src="first-university/scene-04/ornament.svg" />
        <AbsoluteFill style={{transform: `translateY(${interpolate(portrait, [0, 1], [530, 0])}px) scale(${interpolate(portrait, [0, 1], [.78, 1.06])})`}}>
          <LayerImage src="first-university/scene-04/fatima-portrait.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translateX(${interpolate(manuscript, [0, 1], [-980, 0])}px) rotate(${interpolate(manuscript, [0, 1], [-16, 2]) + wobble.rotate}deg)`}}>
          <LayerImage src="first-university/scene-04/manuscript.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translate(${interpolate(pen, [0, 1], [820, 0]) + wobble.x}px, ${wobble.y}px) rotate(${interpolate(pen, [0, 1], [32, -8])}deg)`}}>
          <LayerImage src="first-university/scene-04/pen.svg" />
        </AbsoluteFill>
        <div style={{position: 'absolute', left: 152, top: 1442, width: 715 * underline, height: 12, background: '#cfb13d', borderRadius: 30, transform: 'rotate(-3deg)', transformOrigin: 'left center', boxShadow: '0 0 18px rgba(207,177,61,.5)'}} />
        <ManuscriptCaption gold style={{left: 95, top: 210, fontSize: 56, opacity: fadeIn(frame, 18, 38)}}>
          FATIMA EL FİHRİ
        </ManuscriptCaption>
        <ManuscriptCaption style={{right: 75, bottom: 220, fontSize: 50, opacity: fadeIn(frame, 118, 142)}}>
          MİRASINI TOPLUMA AYIRDI
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

export const Scene5Learning: React.FC = () => {
  const frame = useSteppedFrame(12);
  const camera = interpolate(frame, [0, 210], [1.02, 1.14]);
  const books = [32, 56, 82, 108].map((start) => easeOutCubic(progress(frame, start, start + 34)));
  const scholars = easeOutCubic(progress(frame, 62, 126));
  const rosette = interpolate(frame, [0, 210], [-18, 42]);
  const light = 0.78 + Math.sin(frame * 0.04) * 0.16;

  return (
    <FilmLook cool>
      <SceneAudio scene={5} sfx={[{from: 32, src: 'book-pop.wav'}, {from: 56, src: 'book-pop.wav'}, {from: 82, src: 'book-pop.wav'}, {from: 108, src: 'book-pop.wav'}, {from: 140, src: 'shimmer.wav', volume: 0.35}]} />
      <AbsoluteFill style={{backgroundColor: '#53625a', transform: `scale(${camera})`}}>
        <LayerImage src="first-university/scene-05/hall.svg" />
        <AbsoluteFill style={{opacity: light, mixBlendMode: 'screen'}}>
          <LayerImage src="first-university/scene-05/light-rays.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `translateY(${interpolate(scholars, [0, 1], [420, 0])}px)`}}>
          <LayerImage src="first-university/scene-05/scholars.svg" />
        </AbsoluteFill>
        {books.map((value, index) => (
          <AbsoluteFill key={index} style={{transform: `translateY(${interpolate(value, [0, 1], [520 + index * 45, 0])}px) rotate(${interpolate(value, [0, 1], [12 - index * 6, 0])}deg)`}}>
            <LayerImage src={`first-university/scene-05/book-${index + 1}.svg`} />
          </AbsoluteFill>
        ))}
        <AbsoluteFill style={{transform: `rotate(${rosette}deg)`, transformOrigin: '865px 345px'}}>
          <LayerImage src="first-university/scene-05/geometry.svg" />
        </AbsoluteFill>
        <ManuscriptCaption style={{left: 65, top: 205, fontSize: 54, opacity: fadeIn(frame, 14, 32)}}>
          DİN · HUKUK · DİL · İLİMLER
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

export const Scene6Continuity: React.FC = () => {
  const frame = useSteppedFrame(12);
  const scroll = interpolate(frame, [0, 225], [610, -540]);
  const pageFlip = Math.sin(frame * 0.055) * 14;
  const focus = interpolate(frame, [0, 34, 96, 132, 225], [10, 0, 0, 6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lampSwing = Math.sin(frame * 0.042) * 3.6;
  const glow = 1 + Math.min(1.2, focus / 5);

  return (
    <FilmLook>
      <SceneAudio scene={6} sfx={[{from: 26, src: 'page-turn.wav'}, {from: 88, src: 'page-turn.wav'}, {from: 150, src: 'page-turn.wav'}, {from: 188, src: 'bell.wav', volume: 0.3}]} />
      <AbsoluteFill style={{backgroundColor: '#4a3521', filter: `blur(${focus}px)`, transform: `scale(${interpolate(frame, [0, 225], [.94, 1.08])})`}}>
        <LayerImage src="first-university/scene-06/library.svg" />
        <AbsoluteFill style={{transform: `translateY(${scroll}px)`}}>
          <LayerImage src="first-university/scene-06/timeline.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `perspective(1200px) rotateY(${pageFlip}deg)`}}>
          <LayerImage src="first-university/scene-06/pages.svg" />
        </AbsoluteFill>
        <AbsoluteFill style={{transform: `rotate(${lampSwing}deg)`, transformOrigin: '795px 0'}}>
          <LayerImage src="first-university/scene-06/lantern.svg" />
          <div style={{position: 'absolute', left: 670, top: 260, width: 260 * glow, height: 260 * glow, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,245,200,.8), rgba(255,188,80,.22) 38%, transparent 72%)', filter: 'blur(18px)', mixBlendMode: 'screen'}} />
        </AbsoluteFill>
        <ManuscriptCaption gold style={{left: 82, top: 235, fontSize: 52, opacity: fadeIn(frame, 16, 34)}}>
          YÜZYILLAR BOYUNCA
        </ManuscriptCaption>
        <ManuscriptCaption style={{right: 70, bottom: 215, fontSize: 55, opacity: fadeIn(frame, 158, 182)}}>
          ÖĞRETİM GELENEĞİ
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};

export const Scene7Legacy: React.FC = () => {
  const frame = useSteppedFrame(12);
  const push = interpolate(frame, [0, 210], [1.02, 1.2]);
  const strips = [24, 48, 72].map((start) => easeOutCubic(progress(frame, start, start + 42)));
  const seal = easeOutCubic(progress(frame, 116, 154));
  const finalFade = fadeOut(frame, 188, 210);

  return (
    <FilmLook>
      <SceneAudio scene={7} sfx={[{from: 18, src: 'paper-slide.wav'}, {from: 116, src: 'stamp.wav'}, {from: 154, src: 'shimmer.wav', volume: 0.4}]} />
      <AbsoluteFill style={{backgroundColor: '#8c6b3f', transform: `scale(${push})`, opacity: finalFade}}>
        <LayerImage src="first-university/scene-07/medina.svg" />
        <LayerImage src="first-university/scene-07/scraps.svg" />
        {strips.map((value, index) => (
          <AbsoluteFill key={index} style={{transform: `translateX(${interpolate(value, [0, 1], [index % 2 === 0 ? -1100 : 1100, 0])}px) rotate(${index === 1 ? 1.8 : -1.6}deg)`}}>
            <LayerImage src={`first-university/scene-07/legacy-${index + 1}.svg`} />
          </AbsoluteFill>
        ))}
        <AbsoluteFill style={{transform: `scale(${interpolate(seal, [0, 1], [2.5, 1])}) rotate(${interpolate(seal, [0, 1], [24, -5])}deg)`, opacity: seal}}>
          <LayerImage src="first-university/scene-07/seal.svg" />
        </AbsoluteFill>
        <ManuscriptCaption gold style={{left: 90, top: 190, fontSize: 50, opacity: fadeIn(frame, 12, 28)}}>
          “İLK ÜNİVERSİTE” TANIMI TARTIŞMALI
        </ManuscriptCaption>
        <ManuscriptCaption style={{left: 92, right: 92, bottom: 180, fontSize: 61, textAlign: 'center', opacity: fadeIn(frame, 142, 168)}}>
          EN ESKİ SÜREKLİ EĞİTİM KURUMLARINDAN BİRİ
        </ManuscriptCaption>
      </AbsoluteFill>
    </FilmLook>
  );
};
