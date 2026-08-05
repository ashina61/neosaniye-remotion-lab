# NeoSaniye V9 — Semantic Visual Brain Master Plan

## Goal

V9 must stop treating every topic as the same Remotion template with different labels.

The target is a topic-driven documentary illustration system:

1. understand the spoken claim,
2. choose the correct scene family,
3. build a concrete spatial world,
4. acquire or generate the most important visual assets,
5. animate those assets with a semantic motion grammar,
6. reject generic shape-first output before render.

V9 is not a promise that free APIs alone will match a hand-designed Netflix piece. It is the architecture required to move from procedural diagrams toward representational editorial documentary scenes while keeping the pipeline automated and low-cost.

## Free AI strategy

V9 uses a provider router instead of one hard dependency.

### Text / planning brain

Priority order:

1. Gemini free tier through `GEMINI_API_KEY`
2. Cloudflare Workers AI through `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`
3. Pollinations through `POLLINATIONS_API_KEY`
4. deterministic semantic planner when no provider is available

The deterministic planner is always retained. AI may refine the blueprint, but a provider outage must not delete the video plan.

### Image generation

Priority order:

1. Cloudflare Workers AI FLUX
2. Pollinations image generation
3. V9 representational Remotion fallback

The default AI-image budget is four scenes per video. AI images are reserved for hero scenes that benefit most from representational detail. Maps, timelines and simple network explanations should remain deterministic unless a generated asset provides clear value.

## V9 scene families

The first implementation contains these semantic families:

- `geographic-route`
- `human-reconstruction`
- `environmental-reconstruction`
- `industrial-process`
- `mechanism-cutaway`
- `microscopic-process`
- `market-exchange`
- `network-flow`
- `archival-evidence`
- `hazard-operation`
- `comparison-stage`
- `timeline-causality`
- `consequence-world`

A scene family is not a color theme. It defines:

- what physically exists in the shot,
- foreground, midground and background,
- which spatial relationship communicates the claim,
- which asset type has priority,
- which camera and motion grammar applies,
- which shortcuts are forbidden.

## Example: route topics

A route scene cannot be “a line on a vague map.”

It must specify:

- origin,
- destination,
- intermediary nodes,
- direction,
- terrain or geographic constraints,
- the thing moving through the route,
- the relationship to the adjacent physical scene.

The route-map budget is two scenes per normal short. Extra route scenes are automatically converted into human, environmental, exchange or archival scenes.

## Semantic blueprint contract

Every scene receives `scene.v9Blueprint`:

```json
{
  "sceneId": 1,
  "sceneFamily": "human-reconstruction",
  "visualStatement": "The exact claim made visible as a concrete scene",
  "worldEntities": ["named subject", "physical prop", "location"],
  "spatialRelations": [
    "foreground relationship",
    "midground action",
    "background context"
  ],
  "layerPlan": {
    "foreground": [],
    "midground": [],
    "background": []
  },
  "motionIntent": {
    "camera": "push-in",
    "grammar": "parallax-push-with-action-reveal",
    "heroAction": "narration-driven action",
    "transitionLogic": "semantic carry into next scene"
  },
  "assetPlan": {
    "aiImageRecommended": true,
    "aiImagePriority": 5,
    "prompt": "topic-specific 9:16 illustration prompt",
    "fallbackRenderer": "layered-human-silhouette-scene",
    "searchQueries": []
  },
  "negativeRules": []
}
```

## Pipeline

### Phase 1 — Semantic blueprint

`build-semantic-visual-blueprint-v9.mjs`

- reads V8 plan and contracts,
- infers topic domain,
- creates deterministic blueprints,
- optionally asks the AI provider router to refine them,
- enforces scene-family diversity,
- limits map scenes,
- breaks repeated family runs,
- enforces at least 50% representational scenes,
- rewrites scene image prompts.

### Phase 2 — AI asset budget

`generate-v9-ai-assets.mjs`

- selects only the highest-priority representational scenes,
- generates at most `V9_MAX_AI_IMAGES`,
- writes a provider manifest,
- updates `scene.asset`,
- preserves fallback rendering when credentials or quota are unavailable.

### Phase 3 — V9 representational renderer

Next implementation slice:

- dedicated route geography renderer,
- physical caravan and historical human stage,
- market handoff stage,
- industrial fab and machinery stage,
- environmental reconstruction stage,
- microscopic ecosystem stage,
- archive desk and evidence wall stage,
- hazard / repair operation stage,
- generated-image parallax compositor.

The renderer must consume `v9Blueprint`, not infer meaning again from titles.

### Phase 4 — Motion grammar V9

Next implementation slice:

- entity paths derived from spatial relations,
- foreground / midground / background parallax,
- route-follow camera,
- handoff match cuts,
- process build,
- shell-open cutaway,
- threat approach and repair response,
- semantic object carry between scenes.

### Phase 5 — QC

`qc-v9-semantic-blueprint.py` initially checks:

- complete V9 metadata,
- one blueprint per scene,
- at least four scene families,
- no three-scene family run,
- at least 50% representational scenes,
- maximum two route maps,
- complete route contracts,
- complete three-layer spatial plans,
- motion intent and fallback asset plans,
- anti-shape rules.

Later visual QC must inspect contact sheets for:

- representational subject coverage,
- named geography coverage,
- foreground/background diversity,
- generated asset relevance,
- hero silhouette repetition,
- visual continuity between narration and scene.

## Environment variables

```text
V9_TEXT_PROVIDER=auto
GEMINI_API_KEY=
V9_GEMINI_MODEL=gemini-3.5-flash-lite

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
V9_CLOUDFLARE_TEXT_MODEL=@cf/zai-org/glm-4.7-flash
V9_CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell

POLLINATIONS_API_KEY=
V9_POLLINATIONS_TEXT_MODEL=gemini
V9_POLLINATIONS_IMAGE_MODEL=zimage

V9_IMAGE_PROVIDER=auto
V9_MAX_AI_IMAGES=4
V9_IMAGE_STEPS=6
V9_AI_TIMEOUT_MS=45000
```

## Definition of done

V9 is ready for production only when all of these hold:

- Silk Road produces route geography, caravan, exchange, city relay, political risk and consequence scenes.
- Antibiotic resistance produces microscopic population, antibiotic attack, survivor selection, gene transfer, spread and clinical consequence scenes.
- Taiwan chips produces physical fab, lithography cutaway, workforce ecosystem, global logistics, concentration risk and alternative-capacity scenes.
- No tested topic is rendered mainly as circles, cards and generic lines.
- A missing AI key degrades quality but does not break the workflow.
- AI quota exhaustion falls back per scene, not per video.
- A contact sheet is reviewed before V9 replaces the current renderer in `main`.
