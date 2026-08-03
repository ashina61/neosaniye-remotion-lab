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

# V3.1 already retains a 140 ms safety tail after every sentence and about 35 ms
# before the next sentence. The old extra 300 ms silence was added on top of those
# cushions; after a slow atempo pass the measured boundary reached 0.52 s. Keep a
# small explicit pause instead so the complete acoustic boundary remains natural.
module.INTER_SCENE_PAUSE = 0.12 if language == "en" else 0.16


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
    """Make rendered text and the audible timeline share one authority."""
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

    speed = max(0.01, float(timing.get("speed", 1.0)))
    # The 140 ms sentence tail and 35 ms onset cushion pass through the global
    # atempo filter. Estimate the actual audible edge after that filter so visual
    # holds are measured from the last phoneme, not from the end of a silent tail.
    fitted_tail = 0.14 / speed
    fitted_onset = 0.035 / speed
    estimated_boundary = fitted_tail + float(module.INTER_SCENE_PAUSE) + fitted_onset

    canonical_lines: list[str] = []
    holds: list[float] = []
    duration = float(plan.get("duration", timing.get("duration", 0)))
    for index, (scene, item) in enumerate(zip(scenes, measured)):
        line = str(item.get("line", "")).strip()
        if not line:
            raise RuntimeError(f"V3.4 scene {scene.get('id')} has no canonical audio line")

        scene_end = (
            float(measured[index + 1]["startOnTimeline"])
            if index + 1 < len(measured)
            else duration
        )
        clip_end = float(item.get("speechStart", 0)) + float(item.get("fittedDuration", 0))
        audible_end = max(float(item.get("speechStart", 0)), clip_end - fitted_tail)
        post_hold = max(0.0, scene_end - audible_end)

        item["voiceEnd"] = round(audible_end, 6)
        item["postSpeechHold"] = round(post_hold, 6)
        item["fittedSentenceTail"] = round(fitted_tail, 6)
        item["estimatedAcousticBoundary"] = round(estimated_boundary, 6)
        scene["voiceLine"] = line
        scene["sceneGoal"] = f"Illustrate only this spoken claim: {line}"
        scene["voiceEndPadding"] = round(post_hold, 3)
        canonical_lines.append(line)
        holds.append(post_hold)

    plan["narration"] = " ".join(canonical_lines)
    plan.setdefault("v3", {})["audioTextAuthority"] = "scene-timing.json"
    plan["v3"]["boundaryPauseModel"] = "retained-tail-plus-short-explicit-gap"
    plan["v3"]["estimatedAcousticBoundary"] = round(estimated_boundary, 6)
    plan["v3"]["minimumPostSpeechHold"] = round(min(holds[:-1], default=0.0), 6)

    timing["interScenePause"] = float(module.INTER_SCENE_PAUSE)
    timing["explicitInterScenePause"] = float(module.INTER_SCENE_PAUSE)
    timing["estimatedAcousticBoundary"] = round(estimated_boundary, 6)
    timing["boundaryPauseModel"] = "retained-tail-plus-short-explicit-gap"
    timing["pauseRepairStage"] = "before-and-after-density-guard"
    timing["minimumPostSpeechHold"] = round(min(holds[:-1], default=0.0), 6)

    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8")

    disk_plan = json.loads(plan_path.read_text(encoding="utf-8"))
    disk_timing = json.loads(timing_path.read_text(encoding="utf-8"))
    disk_lines = [str(scene.get("voiceLine", "")).strip() for scene in disk_plan.get("scenes", [])]
    timing_lines = [str(item.get("line", "")).strip() for item in disk_timing.get("scenes", [])]
    if disk_lines != timing_lines:
        raise RuntimeError("V3.4 canonical audio text readback failed")
    if estimated_boundary > 0.44:
        raise RuntimeError(
            f"V3.4 acoustic boundary budget failed: {estimated_boundary:.3f}s exceeds 0.44s"
        )
    if holds[:-1] and min(holds[:-1]) < 0.15:
        raise RuntimeError(
            f"V3.4 visual hold budget failed: {min(holds[:-1]):.3f}s is below 0.15s"
        )

    print(
        f"V3.4 canonical audio synchronized: {len(canonical_lines)} scenes, "
        f"explicit pause={module.INTER_SCENE_PAUSE:.2f}s, "
        f"estimated acoustic boundary={estimated_boundary:.3f}s, "
        f"minimum visual hold={min(holds[:-1], default=0.0):.3f}s"
    )


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
