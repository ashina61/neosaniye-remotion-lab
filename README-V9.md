# Hormuz Crisis Master V9

30-second vertical documentary composition built from the six-scene master choreography.

## Composition
- ID: `HormuzCrisisMasterV9`
- Entry: `src/hormuz-crisis-v9/index.ts`
- 1080x1920 / 30 FPS / 900 frames
- 32 logical assets packed into `public/hormuz-crisis-v9/atlas.webp` (4x8 atlas)

## Preview / render
```bash
npx remotion studio src/hormuz-crisis-v9/index.ts
npx remotion render src/hormuz-crisis-v9/index.ts HormuzCrisisMasterV9 out/hormuz-crisis-master-v9.mp4 --codec=h264 --crf=14 --pixel-format=yuv420p --concurrency=2
```

## Audio
Audio is intentionally disabled in `data.ts` until V9 narration is generated.

```bash
pip install edge-tts
python3 scripts/generate-hormuz-v9-audio.py
```

Then set `AUDIO.enabled` to `true` in `src/hormuz-crisis-v9/data.ts`.
