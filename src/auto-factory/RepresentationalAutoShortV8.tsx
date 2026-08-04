import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DirectedAutoShortV8} from './DirectedAutoShortV8';
import {V8RepresentationalOverlay} from './V8RepresentationalOverlay';

export const RepresentationalAutoShortV8: React.FC = () => (
  <AbsoluteFill>
    <DirectedAutoShortV8 />
    <V8RepresentationalOverlay />
  </AbsoluteFill>
);
