import {mkdir, writeFile} from 'node:fs/promises';

const duration = 46;
const fps = 30;
const sceneDuration = duration / 10;
const lines = [
  ['A Route Across Continents', 'The Silk Road was not one road, but a chain of routes linking China with Central Asia, the Middle East and Europe.'],
  ['Caravans Carried the Network', 'Merchants moved in caravans because deserts, mountains and long distances made the journey dangerous.'],
  ['Cities Became Relay Hubs', 'Oasis cities such as Samarkand connected one group of traders to the next.'],
  ['Goods Changed Hands', 'Silk, spices, glass and precious metals moved through markets instead of traveling with one merchant the whole way.'],
  ['Terrain Shaped the Route', 'Mountain passes, deserts and water sources decided where caravans could travel.'],
  ['Ideas Traveled Too', 'Paper making, religions, stories and scientific knowledge crossed the same network.'],
  ['Empires Controlled the Flow', 'States protected some sections, taxed others and fought over the profitable corridors.'],
  ['Sea Routes Joined the System', 'Ships connected Asian ports with the land routes and expanded the trading network.'],
  ['A Fragile Chain', 'War, disease or a blocked passage could break one link and redirect trade through another region.'],
  ['The First Global Network', 'The Silk Road connected distant societies centuries before modern global supply chains.'],
];

const scenes = lines.map(([title, voiceLine], index) => ({
  id: index + 1,
  start: Number((index * sceneDuration).toFixed(3)),
  duration: Number((index === 9 ? duration - index * sceneDuration : sceneDuration).toFixed(3)),
  title,
  kicker: ['Eurasian geography', 'Human movement', 'Trade hubs', 'Physical exchange', 'Environmental constraints', 'Cultural transfer', 'Political control', 'Hybrid logistics', 'System risk', 'Long-term consequence'][index],
  voiceLine,
  heroVisual: ['China-to-Europe route', 'camel caravan', 'Samarkand oasis city', 'market handoff', 'mountain and desert crossing', 'paper and manuscript exchange', 'fortified checkpoint', 'merchant ship and port', 'broken route and alternate corridor', 'connected Eurasian world'][index],
  mustShow: [
    ['China', 'Central Asia', 'Samarkand', 'Persia', 'Europe'],
    ['camel caravan', 'desert', 'mountain pass'],
    ['oasis city', 'city gate', 'merchant relay'],
    ['silk', 'spices', 'glass', 'market stalls'],
    ['mountains', 'desert', 'water source'],
    ['paper', 'manuscript', 'traveling scholar'],
    ['fort', 'tax checkpoint', 'soldiers'],
    ['ship', 'port', 'land route connection'],
    ['damaged route', 'alternate corridor', 'danger'],
    ['China', 'Europe', 'connected societies'],
  ][index],
  visualKind: 'map-route',
  layout: 'cinematic-wide',
  transition: 'object-match',
  motion: 'trace',
  sfx: 'none',
  accent: index % 2 ? 'teal' : 'gold',
  props: ['foreground subject', 'midground action'],
  beats: [{at: 0.2, label: 'reveal', action: 'reveal'}, {at: 0.62, label: 'explain', action: 'connect'}],
  detailLevel: 3,
  imagePrompt: `Editorial documentary illustration for ${title}.`,
  sceneGoal: `Illustrate only this claim: ${voiceLine}`,
  supportVisuals: ['foreground action', 'environmental context'],
  visualSignature: `v9-silk-road-${index + 1}`,
  conceptTags: ['silk-road', 'trade'],
  forbiddenTags: [],
  alignmentScore: 1,
  continuityGroup: 'silk-road',
  shotType: 'cinematic-wide',
  visualWorld: 'silk-road-eurasia',
  primaryMotif: ['route', 'caravan', 'city', 'goods', 'terrain', 'ideas', 'empire', 'ship', 'risk', 'world'][index],
  secondaryMotif: 'trade network',
  avoid: ['generic icon', 'floating card'],
  subjectTokens: ['silk', 'road'],
  semanticAction: index === 8 ? 'collapse' : 'connect',
  sceneGrammar: index === 0 ? 'map-route' : 'hero-poster',
}));

const plan = {
  version: 3,
  topic: 'How the Silk Road connected China and Europe',
  slug: 'silk-road-v9-smoke',
  title: 'The Silk Road Was a Network',
  hook: 'A road that crossed a continent was never really one road.',
  category: 'history',
  language: 'en',
  duration,
  fps,
  seed: 901,
  narration: scenes.map((scene) => scene.voiceLine).join(' '),
  musicMode: 'off',
  palette: {paper: '#eadfc7', ink: '#17191d', red: '#b64a3a', teal: '#247c7a', gold: '#d9ae4a', blue: '#415a73'},
  research: [
    {title: 'Silk Road', url: 'https://en.wikipedia.org/wiki/Silk_Road', excerpt: 'A network of Eurasian trade routes connecting East and West.'},
  ],
  scenes,
};

await mkdir('public/auto-factory/audio', {recursive: true});
await writeFile('public/auto-factory/plan.json', `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log('V9 Silk Road fixture ready: 10 scenes, 46 seconds.');
