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

holds = [float(item.get("postSpeechHold", -1)) for item in scene_timings]
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

v31_checks = {
    "exact_scene_audio_timing": timing.get("timingSource") == "exact-scene-master",
    "controlled_inter_scene_pause": 0.30 <= float(timing.get("interScenePause", 0)) <= 0.44,
    "minimum_post_speech_hold": minimum_hold >= 0.15,
    "final_audio_tail": final_hold >= 0.45,
    "complete_sentence_endings": sentence_endings,
    "audio_text_matches_scene_text": exact_lines,
}

report["timing_source"] = timing.get("timingSource")
report["inter_scene_pause"] = timing.get("interScenePause")
report["minimum_post_speech_hold"] = minimum_hold
report["final_audio_tail"] = final_hold
report.setdefault("checks", {}).update(v31_checks)
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "v31_status": "PASS" if all(v31_checks.values()) else "FAIL",
    "timing_source": timing.get("timingSource"),
    "inter_scene_pause": timing.get("interScenePause"),
    "minimum_post_speech_hold": minimum_hold,
    "final_audio_tail": final_hold,
    "checks": v31_checks,
}, ensure_ascii=False, indent=2))

if not all(v31_checks.values()):
    raise SystemExit(
        "V3.1 QC failed: " + ", ".join(name for name, passed in v31_checks.items() if not passed)
    )
