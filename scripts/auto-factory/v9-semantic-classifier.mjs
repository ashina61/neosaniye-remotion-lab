const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
const lower = (value) => clean(value).toLowerCase();
const has = (text, pattern) => pattern.test(text);

export const classifyV9Scene = ({scene, index, total}) => {
  const speech = lower([scene.title, scene.voiceLine, scene.sceneGoal].join(' '));
  const visible = lower([scene.heroVisual, ...(scene.mustShow || [])].join(' '));
  const text = `${speech} ${visible}`;
  const result = (family, archetype, reason) => ({family, archetype, reason});

  if (index === total - 1) return result('consequence-world', 'system-consequence', 'mandatory-ending');

  if (has(speech, /\b(paper|manuscripts?|documents?|records?|archives?|reports?|decrees?|photographs?|religions?|stories|knowledge|ideas?|scientific knowledge)\b/)) {
    return result('archival-evidence', 'knowledge-transfer', 'knowledge-or-record-is-the-subject');
  }
  if (has(speech, /\b(wars?|blocked|blockage|blockade|danger|threat|attack|damage|repair|protect\w*|failure|break one link|tax\w*|empires?|fought|disruption|harder to treat|affect factories|supply shock)\b/)) {
    const archetype = has(speech, /\b(tax\w*|empires?|states?|protected|fought)\b/) ? 'state-control-conflict'
      : has(speech, /\b(repair|damage)\b/) ? 'damage-and-repair'
        : has(speech, /\b(harder to treat|treatment|infection)\b/) ? 'treatment-failure'
          : 'route-or-system-disruption';
    return result('hazard-operation', archetype, 'explicit-threat-or-failure');
  }
  if (has(speech, /\b(markets?|bazaars?|exchange|handoff|goods? changed hands?|bought|sold|stalls?|cargo transfer)\b/)) {
    return result('market-exchange', 'market-handoff', 'physical-exchange');
  }

  if (has(speech, /\b(gene transfer|genes?\s+(?:can\s+also\s+)?move|dna exchange)\b/)) {
    return result('mechanism-cutaway', 'gene-transfer-cutaway', 'molecular-transfer-mechanism');
  }
  if (has(speech, /\b(lithography machines?.*(?:circuit|pattern)|microscopic circuit patterns?|circuit patterns?|transistors?|nanometers?|wafer layers?)\b/)) {
    return result('mechanism-cutaway', 'lithography-cutaway', 'microfabrication-mechanism');
  }
  if (has(speech, /\b(inside|layers?|cores?|cutaway|components?|mechanisms?|signals?|fibers?|membranes?|receptors?)\b/) && !has(speech, /\b(supply chains?|network|routes?)\b/)) {
    return result('mechanism-cutaway', 'internal-mechanism-cutaway', 'inside-object-explanation');
  }

  const terrainSubject = /^(?:the\s+)?(?:mountains?|deserts?|terrain|water sources?|oases?|oasis|passes?|forests?|ocean floor|habitats?|environmental constraints?)\b/.test(speech);
  if (terrainSubject && has(speech, /\b(decid\w*|shap\w*|determin\w*|limit\w*|forc\w*|control\w*|made|make|where)\b/)) {
    return result('environmental-reconstruction', 'terrain-constraint', 'terrain-subject-controls-the-action');
  }

  const humanAction = has(speech, /\b(caravans?|camels?|merchants?|travell?ers?|pilgrims?)\b.*\b(moved?|travel\w*|cross\w*|left|carrying|journey)/)
    || has(speech, /\b(ships?|merchant vessels?|aircraft)\b.*\b(connect\w*|carry\w*|move\w*|link\w*)/)
    || has(speech, /\b(engineers?|workers?|scientists?|operators?|soldiers?|scholars?)\b.*\b(cluster\w*|work\w*|build\w*|operate\w*|move\w*)/);
  if (humanAction) {
    const archetype = has(speech, /\b(ship|ships|vessels?|ports?|harbou?r|aircraft|maritime)\b/) ? 'maritime-air-logistics'
      : has(speech, /\b(engineers?|workers?|scientists?|operators?|scholars?)\b/) ? 'human-expertise-cluster'
        : 'caravan-journey';
    return result('human-reconstruction', archetype, 'human-or-vehicle-action-is-main-clause');
  }

  if (has(speech, /\b(oasis cities?|city gates?|relay hubs?|samarkand|cities became|city became|trading cities?)\b/)) {
    return result('human-reconstruction', 'oasis-relay-city', 'city-is-a-physical-relay');
  }

  const terrain = has(speech, /\b(mountains?|deserts?|terrain|water sources?|oases?|oasis|passes?|forests?|ocean floor|habitats?|environmental constraints?)\b/);
  const terrainControls = terrain && has(speech, /\b(decid\w*|shap\w*|determin\w*|limit\w*|forc\w*|control\w*|made|make|where)\b/);
  if (terrainControls) return result('environmental-reconstruction', 'terrain-constraint', 'terrain-controls-the-route-or-action');

  const geographic = has(speech, /\b(routes?|roads?|corridors?|lanes?|network)\b.*\b(link|links|linked|linking|connect|connects|connected|connecting|from|between)\b/)
    && has(speech, /\b(china|europe|asia|east|west|continents?|countries|regions?|middle east|central asia|island)\b/)
    || has(speech, /\bfrom\b.+\bto\b/) && has(speech, /\b(city|country|region|asia|europe|china|island)\b/)
    || has(speech, /\bacross continents?\b/);
  if (geographic) return result('geographic-route', 'route-overview', 'broad-geographic-flow');

  if (has(speech, /\b(compare|compared|versus|before[- ]and[- ]after|more than|less than|difference|two sides|alternative production|alternative capacity|other countries)\b/)) {
    return result('comparison-stage', 'capacity-comparison', 'explicit-comparison');
  }

  if (has(speech, /\b(factories|factory|fabs?|manufactur\w*|produc\w*|plants?|clean rooms?|assembly|equipment)\b/)) {
    const archetype = has(speech, /\b(ecosystem|suppliers?|institutions?|cluster)\b/) ? 'industrial-ecosystem'
      : has(speech, /\b(investment|generation|equipment competitive)\b/) ? 'capital-equipment-cycle'
        : 'fab-production';
    return result('industrial-process', archetype, 'industrial-production');
  }

  if (has(speech, /\b(bacter\w*|cells?|viruses?|microb\w*|mutat\w*|immune\w*|microscop\w*|colon\w*|selection pressure|resistance traits?|survivors?|reproduce)\b/)) {
    const archetype = has(speech, /\b(antibiotic|kills?|sensitive)\b/) ? 'antibiotic-attack'
      : has(speech, /\b(reproduce|generation)\b/) ? 'survivor-reproduction'
        : has(speech, /\b(survive|survivors?|resistance traits?)\b/) ? 'resistant-survivors'
          : has(speech, /\b(selection pressure|repeated exposure)\b/) ? 'selection-pressure'
            : has(speech, /\b(larger share|population becomes)\b/) ? 'selection-shift'
              : 'micro-population-variation';
    return result('microscopic-process', archetype, 'microscopic-biological-process');
  }

  if (has(speech, /\b(spread between|spreads? between|propagat\w*|global.*depend|depend\w*.*global|supply chains?|distributed networks?|bottlenecks?|flow through the system|larger share of the colony)\b/)) {
    const archetype = has(speech, /\b(spread between|spreads? between|people and environments)\b/) ? 'host-environment-spread' : 'global-dependency-network';
    return result('network-flow', archetype, 'network-propagation-or-dependency');
  }

  if (terrain) return result('environmental-reconstruction', 'environment-establishing', 'environment-is-visible-context');
  if (has(text, /\b(ships?|ports?|caravans?|merchants?|engineers?|workers?|cities?)\b/)) return result('human-reconstruction', 'human-world-establishing', 'concrete-human-world');
  return result('timeline-causality', 'causal-progression', 'generic-causal-fallback');
};
