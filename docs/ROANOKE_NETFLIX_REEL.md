# Roanoke Netflix-style mystery reel

This composition applies the layered build system from the Netflix reel practice kit to a Turkish mystery short about the lost Roanoke Colony.

## What is different from a slideshow

- Six voiceover beats become six independent scenes.
- Twenty reusable vector layers are split into two batches of ten.
- Every scene has one signature move instead of a generic Ken Burns zoom.
- Motion is posterized to 12fps and wrapped in the shared D.B. Cooper film-treatment engine.
- Text is used as an animated graphic element, not a permanent subtitle block.

## Scene choreography

1. **Portal opener** — a museum wall and framed map weld together, then the camera flies through the frame into the island.
2. **The disappearance** — colonist silhouettes split and leave in opposite directions while the empty cabins reveal underneath.
3. **CROATOAN** — the carved post slams into frame, the word reveals from left to right, and a red ink line draws beneath it.
4. **The failed search** — John White and the torch party enter under a storm layer; the torn journal lands as the search is stopped.
5. **The theories** — three evidence cards slide in from different edges and stack like the newspaper scene in the practice kit.
6. **The unanswered question** — an antique clock spins through four centuries, dissolves into an ink question mark, and lands on the final title.

## Visual batches

`src/roanoke-netflix/assetsBatchA.tsx`

1. Museum wall
2. Ornate frame
3. Roanoke island map
4. Sailing ship
5. Colony stockade
6. Colonist group
7. Empty cabins
8. CROATOAN post
9. John White
10. Torn journal

`src/roanoke-netflix/assetsBatchB.tsx`

1. Compass rose
2. Storm layer
3. Search party
4. Red-thread evidence board
5. Native village theory
6. Attack theory
7. Shipwreck theory
8. Antique clock
9. Ink question mark
10. Fog and film scratches

## Local commands

Generate the six narration files and the ambience bed:

```bash
python -m pip install edge-tts
python scripts/generate-roanoke-netflix-voice.py
```

Preview in Remotion Studio:

```bash
npx remotion studio src/roanoke-netflix/index.ts
```

Render:

```bash
npx remotion render src/roanoke-netflix/index.ts RoanokeNetflix out/roanoke-netflix-reel.mp4 --codec=h264 --crf=14 --audio-bitrate=192k --pixel-format=yuv420p --concurrency=2
```

## GitHub Actions

Run the **Roanoke Netflix Reel** workflow manually. It installs Edge TTS and FFmpeg, generates the audio, typechecks the repository, renders the MP4, and uploads the result as the `roanoke-netflix-reel` artifact.
