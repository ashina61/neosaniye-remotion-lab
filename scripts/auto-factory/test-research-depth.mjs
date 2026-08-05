import {canonicalResearchSeeds, deriveDepthSubject} from './repair-research-depth.mjs';

const subjectCases = [
  ['How undersea cables carry the internet', 'undersea cables'],
  ['How antibiotic resistance develops', 'antibiotic resistance'],
  ['How the Silk Road actually worked', 'Silk Road'],
  ['How black holes bend time', 'black holes'],
  ['Why the Roman Empire split in two', 'Roman Empire'],
];
for (const [topic, expected] of subjectCases) {
  const actual = deriveDepthSubject(topic, 'en');
  if (actual !== expected) throw new Error(`Research depth subject mismatch: ${topic} -> ${actual}, expected ${expected}`);
}

const cableSeeds = canonicalResearchSeeds('undersea cables', 'How undersea cables carry the internet', 'technology');
for (const required of ['Submarine communications cable', 'Fiber-optic cable', 'Optical fiber']) {
  if (!cableSeeds.includes(required)) throw new Error(`Missing cable research seed: ${required}`);
}
const antibioticSeeds = canonicalResearchSeeds('antibiotic resistance', 'How antibiotic resistance develops', 'science');
for (const required of ['Antimicrobial resistance', 'Horizontal gene transfer', 'Plasmid']) {
  if (!antibioticSeeds.includes(required)) throw new Error(`Missing antibiotic research seed: ${required}`);
}
const silkSeeds = canonicalResearchSeeds('Silk Road', 'How the Silk Road actually worked', 'history');
if (!silkSeeds.includes('Silk Road transmission of Buddhism')) throw new Error('Silk Road research expansion missing cultural transmission source.');

console.log('Research depth regression passed: subjects are noun-focused and canonical source expansions are available.');
