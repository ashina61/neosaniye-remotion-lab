from __future__ import annotations

import asyncio
import importlib.util
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v33.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v33", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.3 audio generator")
v33 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v33)

# Edge TTS already contributes roughly 150-180 ms of quiet sentence tail. Adding
# another 360 ms produced a measured 530 ms break. A 300 ms explicit pause keeps
# about 150 ms of visual reading hold while keeping total detected silence < 480 ms.
v33.v32.module.INTER_SCENE_PAUSE = 0.30

if __name__ == "__main__":
    asyncio.run(v33.main())
