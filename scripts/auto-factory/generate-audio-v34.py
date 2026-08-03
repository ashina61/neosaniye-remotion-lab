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

module = v33.v32.module
language = str(module.PLAN.get("language", "tr"))

# V3.1 QC requires a deliberate 300-440 ms sentence interval and at least a
# 150 ms visual hold after each spoken sentence. GuyNeural already carries a
# natural 140 ms safety tail after the last detected phoneme. Removing 30 ms
# leaves roughly 110 ms of protection while keeping measured internal silence
# under the global 480 ms continuity limit.
module.INTER_SCENE_PAUSE = 0.30 if language == "en" else 0.36

if language == "en":
    resilient_synthesize = module.synthesize

    async def synthesize_with_compact_tail(index: int, line: str):
        path, raw_duration, trimmed_duration = await resilient_synthesize(index, line)
        compact_duration = max(0.35, trimmed_duration - 0.03)
        compact_path = module.OUT_DIR / f"scene-{index:02d}-compact.wav"
        module.run(
            "ffmpeg", "-y", "-i", str(path),
            "-af", f"atrim=start=0:end={compact_duration:.6f},asetpts=PTS-STARTPTS",
            "-ar", str(module.SAMPLE_RATE), "-ac", "2", str(compact_path),
        )
        return compact_path, raw_duration, module.probe_duration(compact_path)

    module.synthesize = synthesize_with_compact_tail

if __name__ == "__main__":
    asyncio.run(v33.main())
