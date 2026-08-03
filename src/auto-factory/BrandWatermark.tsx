import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export const BrandWatermark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 0.96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, 10], [-6, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 32,
        top: 72,
        width: 94,
        height: 72,
        opacity,
        transform: `translateY(${translateY}px)`,
        transformOrigin: 'top left',
        zIndex: 50,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 3px 7px rgba(0,0,0,.9)) drop-shadow(0 0 2px rgba(0,0,0,.8))',
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="185 25 430 250"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden="true"
      >
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
