import React from 'react';
import {AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const p = (frame: number, a: number, b: number) => clamp((frame - a) / Math.max(1, b - a));
export const ease = (v: number) => v * v * (3 - 2 * v);

export const FullAsset: React.FC<{
  src: number; scale?: number; x?: number; y?: number; opacity?: number;
  blur?: number; brightness?: number; contrast?: number; saturate?: number;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
}> = ({src, scale = 1, x = 0, y = 0, opacity = 1, blur = 0, brightness = 1, contrast = 1, saturate = 1, mixBlendMode}) => {
  const index = Math.max(1, Math.min(32, src)) - 1;
  const col = index % 4;
  const row = Math.floor(index / 4);
  return (
    <AbsoluteFill style={{overflow: 'hidden', opacity, transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`, transformOrigin: '50% 50%', filter: `blur(${blur}px) brightness(${brightness}) contrast(${contrast}) saturate(${saturate})`, mixBlendMode}}>
      <Img src={staticFile('hormuz-crisis-v9/atlas.webp')} style={{position: 'absolute', width: 4320, height: 15360, maxWidth: 'none', left: -col * 1080, top: -row * 1920}} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{amount?: number}> = ({amount = 0.7}) => (
  <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(circle at 50% 43%, transparent 32%, rgba(0,0,0,${amount * 0.42}) 67%, rgba(0,0,0,${amount}) 100%)`}} />
);

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{pointerEvents: 'none', opacity: 0.1, transform: `translate(${(frame * 17) % 9 - 4}px, ${(frame * 23) % 9 - 4}px)`, backgroundImage: 'repeating-radial-gradient(circle at 25% 35%, rgba(255,255,255,.22) 0 1px, transparent 1px 4px)', backgroundSize: '7px 7px', mixBlendMode: 'overlay'}} />;
};

export const Title: React.FC<{text: string; inFrame: number; outFrame?: number; size?: number; accent?: boolean; align?: 'left' | 'center'; top?: number; maxWidth?: number}> = ({text, inFrame, outFrame = inFrame + 36, size = 78, accent = false, align = 'center', top = 1210, maxWidth = 930}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = spring({fps, frame: frame - inFrame, config: {damping: 18, stiffness: 220, mass: 0.7}});
  const leave = p(frame, outFrame - 7, outFrame);
  const opacity = clamp(p(frame, inFrame, inFrame + 5) * (1 - leave));
  return <div style={{position: 'absolute', top, left: align === 'left' ? 72 : 50, right: align === 'left' ? undefined : 50, maxWidth, color: accent ? '#ff342e' : '#f7f4ed', fontFamily: 'Arial Narrow, Impact, sans-serif', fontWeight: 900, fontSize: size, lineHeight: 0.92, letterSpacing: -2.2, textTransform: 'uppercase', textAlign: align, whiteSpace: 'pre-line', textShadow: '0 6px 24px rgba(0,0,0,.8)', transform: `translateY(${interpolate(pop, [0, 1], [34, 0])}px) scale(${interpolate(pop, [0, 1], [0.9, 1])})`, opacity}}>{text}</div>;
};

export const BottomRule: React.FC<{label: string; color?: string}> = ({label, color = '#d83a31'}) => (
  <div style={{position: 'absolute', left: 70, right: 70, bottom: 86, height: 48, display: 'flex', alignItems: 'center', gap: 16}}><div style={{width: 58, height: 5, background: color}} /><div style={{fontFamily: 'Arial, sans-serif', fontSize: 21, fontWeight: 800, color: '#d9ddd9', letterSpacing: 3}}>{label}</div></div>
);

export const Flash: React.FC<{at: number; color?: string; length?: number}> = ({at, color = '#fff', length = 7}) => {
  const frame = useCurrentFrame();
  const q = p(frame, at, at + length);
  const opacity = q <= 0.5 ? q * 2 : (1 - q) * 2;
  return <AbsoluteFill style={{backgroundColor: color, opacity: opacity * 0.72, pointerEvents: 'none'}} />;
};

export const Shake: React.FC<React.PropsWithChildren<{from: number; to: number; power?: number}>> = ({from, to, power = 8, children}) => {
  const frame = useCurrentFrame();
  const active = p(frame, from, Math.min(to, from + 3)) * (1 - p(frame, Math.max(from, to - 3), to));
  const x = Math.sin(frame * 7.9) * power * active;
  const y = Math.cos(frame * 5.3) * power * 0.65 * active;
  return <AbsoluteFill style={{transform: `translate(${x}px, ${y}px)`}}>{children}</AbsoluteFill>;
};

export const RedWash: React.FC<{opacity?: number}> = ({opacity = 0.18}) => <AbsoluteFill style={{background: `linear-gradient(120deg, rgba(182,18,16,${opacity}) 0%, transparent 48%, rgba(255,40,34,${opacity * 0.45}) 100%)`, pointerEvents: 'none'}} />;
