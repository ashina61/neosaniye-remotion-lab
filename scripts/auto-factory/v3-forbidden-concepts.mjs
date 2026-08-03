import {readFile, writeFile} from 'node:fs/promises';

const planPath = process.env.PLAN_PATH || 'public/auto-factory/plan.json';
const plan = JSON.parse(await readFile(planPath, 'utf8'));
const profileConcepts = Array.isArray(plan.topicProfile?.forbiddenMotifs)
  ? plan.topicProfile.forbiddenMotifs
  : [];
const unique = (items) => [...new Set(items.filter(Boolean))];
const cleanConcept = (value) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 36);

const scenes = Array.isArray(plan.scenes) ? plan.scenes : [];
for (const scene of scenes) {
  const source = Array.isArray(scene.avoid) && scene.avoid.length
    ? scene.avoid
    : profileConcepts;
  const concepts = unique(source.map(cleanConcept)).filter((value) => value.length >= 2).slice(0, 14);

  // Keep forbidden concepts as complete phrases. The old token flattening turned
  // "space rocket" into the isolated token "space", which falsely rejected the
  // valid microbiology phrase "empty competition space".
  scene.avoid = concepts.slice(0, 8);
  scene.forbiddenTags = concepts;
}

plan.v3 = {
  ...(plan.v3 || {}),
  forbiddenConceptAuthority: 'complete-avoid-phrases',
  forbiddenConceptVersion: 2,
};

await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
console.log(`V3 forbidden concepts canonicalized: scenes=${scenes.length}, authority=complete-avoid-phrases`);
