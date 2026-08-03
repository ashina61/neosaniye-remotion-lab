from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
TIMING_PATH = Path(os.getenv("TIMING_PATH", ROOT / "public/auto-factory/audio/scene-timing.json"))
REPORT_PATH = Path(os.getenv("QC_REPORT_PATH", ROOT / "out/production-report.json"))

plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
timing = json.loads(TIMING_PATH.read_text(encoding="utf-8"))
report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
scenes = plan.get("scenes", [])
scene_timings = timing.get("scenes", [])

holds = [round(float(item.get("postSpeechHold", -1)), 3) for item in scene_timings]
minimum_hold = min(holds[:-1], default=-1)
final_hold = holds[-1] if holds else -1
sentence_endings = all(
    re.search(r"[.!?]$", str(scene.get("voiceLine", "")).strip()) is not None
    for scene in scenes
)
exact_lines = len(scenes) == len(scene_timings) and all(
    str(scene.get("voiceLine", "")).strip() == str(item.get("line", "")).strip()
    for scene, item in zip(scenes, scene_timings)
)

explicit_pause = round(float(timing.get("explicitInterScenePause", timing.get("interScenePause", 0))), 3)
estimated_boundary = round(float(timing.get("estimatedAcousticBoundary", 99)), 3)
max_internal_silence = round(float(timing.get("maxInternalSilence", 99)), 3)

v31_checks = {
    "exact_scene_audio_timing": timing.get("timingSource") == "exact-scene-master",
    "acoustic_boundary_model": timing.get("boundaryPauseModel") == "retained-tail-plus-short-explicit-gap",
    "controlled_explicit_pause": 0.08 <= explicit_pause <= 0.20,
    "controlled_acoustic_boundary": 0.22 <= estimated_boundary <= 0.44,
    "maximum_internal_silence": max_internal_silence <= 0.48,
    "minimum_post_speech_hold": minimum_hold >= 0.15,
    "final_audio_tail": final_hold >= 0.45,
    "complete_sentence_endings": sentence_endings,
    "audio_text_matches_scene_text": exact_lines,
}

report["timing_source"] = timing.get("timingSource")
report["inter_scene_pause"] = explicit_pause
report["explicit_inter_scene_pause"] = explicit_pause
report["estimated_acoustic_boundary"] = estimated_boundary
report["minimum_post_speech_hold"] = minimum_hold
report["final_audio_tail"] = final_hold
report["max_internal_silence"] = max_internal_silence
report.setdefault("checks", {}).update(v31_checks)
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "v31_status": "PASS" if all(v31_checks.values()) else "FAIL",
    "timing_source": timing.get("timingSource"),
    "explicit_inter_scene_pause": explicit_pause,
    "estimated_acoustic_boundary": estimated_boundary,
    "max_internal_silence": max_internal_silence,
    "minimum_post_speech_hold": minimum_hold,
    "final_audio_tail": final_hold,
    "checks": v31_checks,
}, ensure_ascii=False, indent=2))

if not all(v31_checks.values()):
    raise SystemExit(
        "V3.1 QC failed: " + ", ".join(name for name, passed in v31_checks.items() if not passed)
    )
