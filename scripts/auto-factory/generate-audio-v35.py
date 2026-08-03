from __future__ import annotations

import asyncio
import importlib.util
import json
import re
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v34.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v34", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.4 audio generator")
v34 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v34)

module = v34.module
base_synthesize = module.synthesize
applied_rates: dict[int, str] = {}


def parse_percent(value: object) -> int:
    match = re.fullmatch(r"\s*([+-]?\d+)%\s*", str(value or "+0%"))
    return int(match.group(1)) if match else 0


def format_percent(value: int) -> str:
    return f"{value:+d}%"


async def synthesize_with_scene_pacing(index: int, line: str):
    """Apply only a tiny scene-level pace change around the global natural rate."""
    original_rate = str(module.VOICE_RATE)
    scenes = module.PLAN.get("scenes", [])
    scene = scenes[index - 1] if 0 < index <= len(scenes) else {}
    scene_delta = parse_percent(scene.get("voiceRate", "+0%"))
    effective = max(-12, min(12, parse_percent(original_rate) + scene_delta))
    effective_rate = format_percent(effective)
    applied_rates[index] = effective_rate
    module.VOICE_RATE = effective_rate
    try:
        return await base_synthesize(index, line)
    finally:
        module.VOICE_RATE = original_rate


module.synthesize = synthesize_with_scene_pacing


def annotate_and_validate_audio() -> None:
    timing_path = module.OUT_DIR / "scene-timing.json"
    timing = json.loads(timing_path.read_text(encoding="utf-8"))
    speed = float(timing.get("speed", 0))
    if not 0.88 <= speed <= 1.12:
        raise RuntimeError(
            f"V3.5 natural audio tempo failed: final atempo={speed:.3f}x; allowed 0.88-1.12x"
        )

    scenes = timing.get("scenes", [])
    for index, item in enumerate(scenes, start=1):
        item["effectiveVoiceRate"] = applied_rates.get(index, str(module.VOICE_RATE))
        item["naturalTempoValidated"] = True

    timing["naturalVoiceVersion"] = 1
    timing["naturalTempoRange"] = [0.88, 1.12]
    timing["sentenceTailPolicy"] = "retain-140ms-post-phoneme"
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        "V3.5 natural voice ready: "
        f"atempo={speed:.3f}x, scene rates={','.join(applied_rates.values())}, tails=retained"
    )


async def main() -> None:
    await v34.main()
    annotate_and_validate_audio()


if __name__ == "__main__":
    asyncio.run(main())
