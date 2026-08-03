from __future__ import annotations

import asyncio
import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v31.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v31", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.1 audio generator")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

original_synthesize = module.synthesize


async def synthesize_with_retry(index: int, line: str):
    """Reject partial Edge TTS responses and retry the complete sentence."""
    minimum_raw = max(1.20, len(module.words(line)) * 0.20)
    minimum_trimmed = max(0.85, len(module.words(line)) * 0.14)
    errors: list[str] = []

    for attempt in range(1, 4):
        try:
            result = await original_synthesize(index, line)
            trimmed, raw_duration, trimmed_duration = result
            if raw_duration < minimum_raw or trimmed_duration < minimum_trimmed:
                raise RuntimeError(
                    f"partial TTS response: raw={raw_duration:.2f}s, "
                    f"trimmed={trimmed_duration:.2f}s, expected raw>={minimum_raw:.2f}s"
                )
            if attempt > 1:
                print(f"Scene {index} TTS recovered on attempt {attempt}.")
            await asyncio.sleep(0.20)
            return result
        except Exception as error:  # Edge occasionally returns a tiny valid MP3.
            errors.append(f"attempt {attempt}: {error}")
            for suffix in ("raw.mp3", "decoded.wav", "trimmed.wav"):
                path = module.OUT_DIR / f"scene-{index:02d}-{suffix}"
                path.unlink(missing_ok=True)
            if attempt < 3:
                await asyncio.sleep(1.25 * attempt)

    raise RuntimeError(f"Scene {index} TTS failed after 3 attempts: {' | '.join(errors)}")


module.synthesize = synthesize_with_retry

if __name__ == "__main__":
    asyncio.run(module.main())
