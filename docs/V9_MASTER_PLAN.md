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

Image generation is budgeted instead of being called for every scene:

- `procedural`: 0 AI images
- `hybrid`: up to 3 AI images
- `ai-heavy`: up to 6 AI images

The planning brain selects the most representational scenes. Maps, timelines and network diagrams normally remain deterministic and editable.

## Implemented V9 foundation

### Semantic blueprint brain

Each final spoken claim receives a `scene.v9Blueprint` containing:

- scene family,
- visible world entities,
- foreground / midground / background layers,
- spatial relationships,
- semantic camera and motion intent,
- image prompt and fallback renderer,
- negative rules that reject generic cards, icons and decorative geometry.

### Scene family taxonomy

The first renderer slice supports:

1. `geographic-route`
2. `human-reconstruction`
3. `environmental-reconstruction`
4. `industrial-process`
5. `mechanism-cutaway`
6. `microscopic-process`
7. `market-exchange`
8. `network-flow`
9. `archival-evidence`
10. `hazard-operation`
11. `comparison-stage`
12. `timeline-causality`
13. `consequence-world`

### Semantic representational renderer

`src/auto-factory/SemanticVisualAutoShortV9.tsx` consumes the blueprint directly.

It includes:

- directional route tracing with origins, hubs, destinations, terrain and moving cargo,
- a Silk Road preset using China, Central Asia, Samarkand, Persia and Europe,
- caravan and human action reconstruction,
- physical market handoffs,
- industrial machinery and chip-fab variants,
- mechanism cutaways and signal travel,
- microscopic selection and resistance variants,
- archive, hazard, comparison, timeline and real-world consequence stages,
- AI image camera motion when a V9 asset exists,
- deterministic representational fallback when no image provider is configured.

The V9 renderer is selected only when every scene has a valid V9 blueprint. Older plans continue to use V8 or earlier renderers.

## Production pipeline order

The production workflow must follow this order:

1. research and base plan,
2. V8 story and timing foundation,
3. first V9 semantic blueprint,
4. final continuous narration,
5. rebuild V9 blueprint from the exact spoken claims,
6. generate budgeted V9 assets once,
7. typecheck,
8. render,
9. create midpoint contact sheet,
10. run legacy safety checks plus V9 semantic QC.

This order prevents image quota from being spent on narration that later changes.

## Quality gates

V9 blueprint QC requires:

- every scene has a blueprint,
- at least four scene families,
- at least 50% representational scenes,
- no more than two map scenes,
- no three-scene run from the same family,
- every scene has world entities and three depth layers,
- every route scene has origin, destination, intermediary structure and direction,
- every prompt bans generic infographic cards and decorative geometry.

Renderer promotion additionally requires a real contact sheet. Passing JSON alone is not enough.

## Controlled visual proof

The dedicated `V9 Semantic Visual Brain` workflow builds a fixed ten-scene Silk Road fixture, calls Gemini when the repository secret is available, renders a midpoint still from every scene and uploads:

- ten full-size scene stills,
- one 5×2 contact sheet,
- the final Gemini-refined plan.

The proof is accepted only if the contact sheet visibly contains route, caravan, city/hub, physical exchange, terrain, archive/ideas, political control, sea logistics, risk and consequence scenes rather than the same card or diagram repeated ten times.

## Next milestones

### Milestone 1 — validate the first contact sheet

- fix TypeScript or runtime errors,
- inspect all ten Silk Road frames,
- confirm Gemini provider metadata,
- reject visually repetitive stages before merge.

### Milestone 2 — provider-backed image layers

- add Cloudflare credentials,
- generate only the three highest-priority physical scenes in hybrid mode,
- add depth masks or foreground overlays so generated images are not simple zooming slides,
- track provider, model, prompt and seed in the artifact manifest.

### Milestone 3 — domain depth packs

- history: architecture, costume, transport, documents, terrain,
- science: cell structures, molecules, laboratory environments, scale,
- technology: factories, machines, components, infrastructure,
- geopolitics: accurate route presets, ports, borders, chokepoints,
- nature: species anatomy, habitats and ecological relationships.

### Milestone 4 — contact-sheet intelligence

- compare semantic scene families against rendered frames,
- detect visually empty or icon-only stages,
- detect repeated silhouettes and compositions,
- reject a video whose contact sheet does not cover the planned physical actions.

## Promotion rule

Do not merge V9 into `main` merely because scripts and QC pass.

Merge only after:

1. the controlled Silk Road contact sheet is materially better than V8,
2. at least one science fixture and one technology fixture render with different physical scene grammars,
3. no existing V8 fallback or audio workflow regresses,
4. the production workflow completes from topic selection through downloadable artifact.
