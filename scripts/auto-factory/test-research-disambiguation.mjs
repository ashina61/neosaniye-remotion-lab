import {deriveResearchSubject, rankResearchItems} from './repair-wikipedia-research.mjs';

const subjectCases = [
  ['How the Silk Road actually worked', 'Silk Road'],
  ['Why the Roman Empire split in two', 'Roman Empire'],
  ['How antibiotic resistance develops', 'antibiotic resistance'],
  ['What happened at Dyatlov Pass', 'Dyatlov Pass'],
  ['What caused the Tunguska explosion', 'Tunguska explosion'],
  ['Where cloud computing actually runs', 'cloud computing'],
];
for (const [topic, expected] of subjectCases) {
  const actual = deriveResearchSubject(topic, 'en');
  if (actual !== expected) throw new Error(`Subject mismatch for ${topic}: ${actual} !== ${expected}`);
}

const context = {topic: 'How the Silk Road actually worked', subject: 'Silk Road', category: 'history', language: 'en'};
const ranked = rankResearchItems([
  {title: 'Silk Road (marketplace)', url: 'https://example.com/darknet', excerpt: 'Silk Road was an online black market and darknet marketplace using bitcoin.'},
  {title: 'Ross Ulbricht', url: 'https://example.com/ross', excerpt: 'Ross Ulbricht was a cybercriminal who operated the Silk Road darknet market.'},
  {title: 'Silk Road', url: 'https://example.com/history', excerpt: 'The Silk Road was a network of Eurasian trade routes used by merchants and caravans for centuries.'},
  {title: 'Silk Road transmission of Buddhism', url: 'https://example.com/buddhism', excerpt: 'Buddhism spread through ancient trade routes linking Central Asia and China.'},
  {title: "Sony's Spider-Man Universe", url: 'https://example.com/film', excerpt: 'A superhero film franchise and shared universe.'},
], context, 5);
if (ranked[0]?.title !== 'Silk Road') throw new Error(`Canonical Silk Road page was not ranked first: ${ranked.map((item) => item.title).join(' | ')}`);
if (ranked.some((item) => /marketplace|Ulbricht|Spider-Man/i.test(item.title))) {
  throw new Error(`Disambiguation leak: ${ranked.map((item) => item.title).join(' | ')}`);
}
console.log(`Research disambiguation regression passed: ${ranked.map((item) => item.title).join(' | ')}`);
