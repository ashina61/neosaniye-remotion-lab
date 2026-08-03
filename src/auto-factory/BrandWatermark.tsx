import React from 'react';
import {Img, interpolate, useCurrentFrame} from 'remotion';

const logoDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="700" height="414" viewBox="0 0 700 414">
  <defs>
    <linearGradient id="cyan" x1="0" x2="1"><stop stop-color="#ffffff"/><stop offset=".72" stop-color="#ffffff"/><stop offset="1" stop-color="#00f3f5"/></linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)">
    <path d="M205 42 L205 238 L285 238 M205 42 L360 195 L360 84 Q360 42 405 42 H540 Q585 42 585 84" stroke="url(#cyan)" stroke-width="18"/>
    <path d="M265 120 L370 224 Q395 248 440 248 H485 Q590 248 590 157 Q590 77 500 77 H432" stroke="#ffffff" stroke-width="18"/>
    <path d="M410 123 L410 190 L468 157 Z" stroke="#00f3f5" stroke-width="15"/>
  </g>
  <text x="350" y="355" text-anchor="middle" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="86" font-weight="300" letter-spacing="7" fill="#ffffff">neosaniye</text>
  <rect x="510" y="279" width="12" height="12" rx="2" fill="#00f3f5"/>
</svg>`)} `;

export const BrandWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 14], [0, 0.92], {extrapolateRight: 'clamp'});
  const scale = interpolate(frame, [0, 18], [0.94, 1], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: 48,
        top: 54,
        width: 230,
        padding: '12px 14px 9px',
        borderRadius: 22,
        background: 'rgba(8,10,12,.62)',
        border: '1px solid rgba(255,255,255,.14)',
        boxShadow: '0 10px 30px rgba(0,0,0,.28)',
        backdropFilter: 'blur(8px)',
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <Img src={logoDataUri} style={{width: '100%', height: 'auto', display: 'block'}} />
    </div>
  );
};
