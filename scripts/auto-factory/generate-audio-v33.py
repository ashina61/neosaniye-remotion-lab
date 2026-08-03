from __future__ import annotations

import asyncio
import importlib.util
import json
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v32.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v32", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.2 audio generator")
v32 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v32)


async def main() -> None:
    # Run the resilient complete-sentence generator first.
    await v32.module.main()

    plan_path = v32.module.PLAN_PATH
    timing_path = v32.module.OUT_DIR / "scene-timing.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    timing = json.loads(timing_path.read_text(encoding="utf-8"))
    scenes = plan.get("scenes", [])
    measured = timing.get("scenes", [])

    if len(scenes) != len(measured):
        raise RuntimeError(
            f"V3.3 canonical timeline mismatch: {len(scenes)} plan scenes != {len(measured)} timing scenes"
        )

    # The audio manifest is the only timeline authority. Rebuild all scene boundaries
    # from it after TTS, so no earlier planned start can survive into render or QC.
    cue_map = {
        0: "impact",
        4: "click",
        7: "paper",
        len(scenes) - 1: "pulse",
    }
    duration = float(plan["duration"])
    canonical_starts: list[float] = []

    for index, (scene, item) in enumerate(zip(scenes, measured)):
        start = round(float(item["startOnTimeline"]), 3)
        item["startOnTimeline"] = start
        canonical_starts.append(start)
        next_start = (
            round(float(measured[index + 1]["startOnTimeline"]), 3)
            if index + 1 < len(measured)
            else duration
        )
        scene["start"] = start
        scene["duration"] = round(max(0.72, next_start - start), 3)
        scene["voiceStart"] = round(max(0.0, float(item["speechStart"]) - start), 3)
        scene["voiceEndPadding"] = round(float(item["postSpeechHold"]), 3)
        scene["sfx"] = cue_map.get(index, "none")

    plan.setdefault("v3", {})["timelineAuthority"] = "scene-timing.json"
    plan["v3"]["canonicalTimelineVersion"] = 3
    plan["v3"]["sfxCueCount"] = len(cue_map)

    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8")

    # Read back from disk and fail before rendering if a stale start or SFX count remains.
    disk_plan = json.loads(plan_path.read_text(encoding="utf-8"))
    disk_timing = json.loads(timing_path.read_text(encoding="utf-8"))
    drifts = [
        abs(float(scene["start"]) - float(item["startOnTimeline"]))
        for scene, item in zip(disk_plan["scenes"], disk_timing["scenes"])
    ]
    sfx_count = sum(1 for scene in disk_plan["scenes"] if scene.get("sfx") != "none")
    max_drift = max(drifts, default=99.0)
    if max_drift > 0.001:
        raise RuntimeError(f"V3.3 timeline readback drift: {max_drift:.3f}s")
    if sfx_count != 4:
        raise RuntimeError(f"V3.3 SFX canonicalization failed: expected 4, received {sfx_count}")

    print(
        "V3.3 canonical timeline ready: "
        f"starts={canonical_starts}, max drift={max_drift:.3f}s, sfx={sfx_count}"
    )


if __name__ == "__main__":
    asyncio.run(main())
