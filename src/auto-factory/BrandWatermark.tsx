import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export const BrandWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 0.92], {extrapolateRight: 'clamp'});
  const scale = interpolate(frame, [0, 14], [0.9, 1], {extrapolateRight: 'clamp'});
  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        top: 8,
        width: 50,
        height: 50,
        borderRadius: 13,
        background: 'rgba(3,5,7,.78)',
        border: '1px solid rgba(255,255,255,.16)',
        boxShadow: '0 6px 18px rgba(0,0,0,.28)',
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg width="43" height="43" viewBox="185 25 430 250" aria-hidden="true">
        <defs>
          <linearGradient id="neosaniye-cyan" x1="0" x2="1">
            <stop stopColor="#ffffff" />
            <stop offset="0.72" stopColor="#ffffff" />
            <stop offset="1" stopColor="#00f3f5" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M205 42 L205 238 L285 238 M205 42 L360 195 L360 84 Q360 42 405 42 H540 Q585 42 585 84"
            stroke="url(#neosaniye-cyan)"
            strokeWidth="18"
          />
          <path
            d="M265 120 L370 224 Q395 248 440 248 H485 Q590 248 590 157 Q590 77 500 77 H432"
            stroke="#ffffff"
            strokeWidth="18"
          />
          <path d="M410 123 L410 190 L468 157 Z" stroke="#00f3f5" strokeWidth="15" />
        </g>
      </svg>
    </div>
  );
};
