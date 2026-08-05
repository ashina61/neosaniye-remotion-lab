import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SemanticVisualAutoShortV9} from './SemanticVisualAutoShortV9';
import {V9ArchetypeOverlay} from './V9ArchetypeOverlay';

export const RepresentationalAutoShortV9: React.FC = () => (
  <AbsoluteFill>
    <SemanticVisualAutoShortV9 />
    <V9ArchetypeOverlay />
  </AbsoluteFill>
);
