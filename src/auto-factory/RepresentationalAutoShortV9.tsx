import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SemanticVisualAutoShortV9} from './SemanticVisualAutoShortV9';
import {V9SemanticRepresentationalOverlay} from './V9SemanticRepresentationalOverlay';

export const RepresentationalAutoShortV9: React.FC = () => (
  <AbsoluteFill>
    <SemanticVisualAutoShortV9 />
    <V9SemanticRepresentationalOverlay />
  </AbsoluteFill>
);
