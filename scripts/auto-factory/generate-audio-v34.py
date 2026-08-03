from __future__ import annotations

import asyncio
import importlib.util
import json
import re
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v33.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v33", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.3 audio generator")
v33 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v33)

module = v33.v32.module
language = str(module.PLAN.get("language", "tr"))

# Keep the full 140 ms post-phoneme safety tail produced by V3.1. The previous
# English wrapper removed another 30 ms from every sentence and could make final
# consonants sound clipped. A 300 ms inter-scene pause plus the retained tail is
# still below the 480 ms continuity ceiling.
module.INTER_SCENE_PAUSE = 0.30 if language == "en" else 0.36


def rate_ratio(value: str) -> float:
    match = re.fullmatch(r"\s*([+-]?\d+(?:\.\d+)?)%\s*", value)
    if not match:
        return 1.0
    return max(0.20, 1.0 + float(match.group(1)) / 100.0)


def clear_generated_audio() -> None:
    for path in module.OUT_DIR.iterdir():
        if path.is_file():
            path.unlink(missing_ok=True)


def synchronize_audio_text() -> None:
    """Make the rendered scene text identical to the sentence sent to TTS."""
    plan_path = module.PLAN_PATH
    timing_path = module.OUT_DIR / "scene-timing.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    timing = json.loads(timing_path.read_text(encoding="utf-8"))
    scenes = plan.get("scenes", [])
    measured = timing.get("scenes", [])

    if len(scenes) != len(measured):
        raise RuntimeError(
            f"V3.4 audio text synchronization mismatch: {len(scenes)} scenes != {len(measured)} timings"
        )

    canonical_lines: list[str] = []
    for scene, item in zip(scenes, measured):
        line = str(item.get("line", "")).strip()
        if not line:
            raise RuntimeError(f"V3.4 scene {scene.get('id')} has no canonical audio line")
        scene["voiceLine"] = line
        scene["sceneGoal"] = f"Illustrate only this spoken claim: {line}"
        canonical_lines.append(line)

    plan["narration"] = " ".join(canonical_lines)
    plan.setdefault("v3", {})["audioTextAuthority"] = "scene-timing.json"
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    disk_plan = json.loads(plan_path.read_text(encoding="utf-8"))
    disk_lines = [str(scene.get("voiceLine", "")).strip() for scene in disk_plan.get("scenes", [])]
    timing_lines = [str(item.get("line", "")).strip() for item in measured]
    if disk_lines != timing_lines:
        raise RuntimeError("V3.4 canonical audio text readback failed")

    print(f"V3.4 canonical audio text synchronized: {len(canonical_lines)} scenes")


async def main() -> None:
    try:
        await v33.main()
    except RuntimeError as error:
        match = re.search(
            r"Narration density is outside V3\.1 readability range \(([0-9.]+)x required\)",
            str(error),
        )
        if match is None:
            raise

        measured_density = float(match.group(1))
        current_ratio = rate_ratio(str(module.VOICE_RATE))
        target_density = 0.98
        requested_ratio = current_ratio * measured_density / target_density

        # Natural speech only. The former 0.35-1.25 clamp could create extremely
        # slow or rushed narration. Topic grounding now targets the correct word
        # budget, so the rescue may make only a small correction.
        adjusted_ratio = max(0.88, min(1.12, requested_ratio))
        adjusted_percent = round((adjusted_ratio - 1.0) * 100)
        adjusted_rate = f"{adjusted_percent:+d}%"

        if requested_ratio < 0.88 or requested_ratio > 1.12:
            print(
                "V3.4 natural voice guard: requested "
                f"{(requested_ratio - 1.0) * 100:+.0f}% was capped to {adjusted_rate}"
            )

        if adjusted_rate == module.VOICE_RATE:
            raise

        print(
            "V3.4 narration density retry: "
            f"measured={measured_density:.2f}x, voice rate {module.VOICE_RATE} -> {adjusted_rate}"
        )
        module.VOICE_RATE = adjusted_rate
        clear_generated_audio()
        await v33.main()

    synchronize_audio_text()


if __name__ == "__main__":
    asyncio.run(main())
