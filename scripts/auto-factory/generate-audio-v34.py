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

# Edge voices retain a short natural tail after trimming. A fixed 300 ms gap joined
# with that tail measured as 500 ms for GuyNeural. Keep the acoustic pause compact;
# the visual scene itself still remains on screen for its separate reading hold.
language = str(v33.v32.module.PLAN.get("language", "tr"))
v33.v32.module.INTER_SCENE_PAUSE = 0.18 if language == "en" else 0.22

if __name__ == "__main__":
    asyncio.run(v33.main())
