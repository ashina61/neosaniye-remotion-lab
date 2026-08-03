from __future__ import annotations

import json
import math
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
TIMING_PATH = Path(os.getenv("TIMING_PATH", ROOT / "public/auto-factory/audio/scene-timing.json"))
MAX_REQUESTED_SPEED = float(os.getenv("MAX_REQUESTED_VOICE_SPEED", "1.40"))
REPAIR_TARGET_SPEED = float(os.getenv("REPAIR_TARGET_VOICE_SPEED", "1.28"))

TRAILING_FILLERS = {
    "ve", "veya", "ile", "çünkü", "fakat", "ama", "için", "gibi", "olarak",
    "olan", "bu", "bir", "da", "de", "the", "and", "or", "because", "with", "for",
}


def words(value: str) -> list[str]:
    clean = re.sub(r"\[[^\]]+]", " ", value)
    clean = re.sub(r"\([^)]*\)", " ", clean)
    return [part for part in re.split(r"\s+", clean.strip()) if part]


def shorten_line(value: str, max_words: int) -> str:
    selected = words(value)[: max(4, max_words)]
    while len(selected) > 4 and re.sub(r"[.,;:!?]+$", "", selected[-1]).lower() in TRAILING_FILLERS:
        selected.pop()
    return re.sub(r"[.,;:!?]+$", "", " ".join(selected)).strip() + "."


plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
timing = json.loads(TIMING_PATH.read_text(encoding="utf-8"))
measured_by_id = {int(item["sceneId"]): item for item in timing.get("scenes", [])}
errors: list[str] = []
repairs: list[dict] = []

for scene in plan.get("scenes", []):
    scene_id = int(scene["id"])
    measured = measured_by_id.get(scene_id)
    if not measured:
        errors.append(f"scene-{scene_id}: timing missing")
        continue

    requested_speed = float(measured.get("requestedSpeed", 99))
    start = float(measured.get("startOnTimeline", -1))
    fitted = float(measured.get("fittedDuration", 0))
    scene_start = float(scene["start"])
    scene_end = scene_start + float(scene["duration"])

    if start < scene_start - 0.02 or start + fitted > scene_end + 0.05:
        errors.append(f"scene-{scene_id}: voice outside scene")

    if requested_speed > MAX_REQUESTED_SPEED:
        old_line = str(scene.get("voiceLine", "")).strip()
        old_words = words(old_line)
        ratio = REPAIR_TARGET_SPEED / requested_speed
        new_count = max(4, min(len(old_words) - 1, math.floor(len(old_words) * ratio)))
        if new_count >= len(old_words):
            new_count = max(4, len(old_words) - 1)
        new_line = shorten_line(old_line, new_count)
        errors.append(f"scene-{scene_id}: narration too dense ({requested_speed:.2f}x)")
        repairs.append({
            "sceneId": scene_id,
            "requestedSpeed": requested_speed,
            "oldWords": len(old_words),
            "newWords": len(words(new_line)),
            "oldLine": old_line,
            "newLine": new_line,
        })
        scene["voiceLine"] = new_line

if not errors:
    print(f"Scene sync preflight PASS. Max allowed requested speed: {MAX_REQUESTED_SPEED:.2f}x")
    raise SystemExit(0)

if repairs:
    plan["narration"] = " ".join(str(scene.get("voiceLine", "")).strip() for scene in plan["scenes"]).strip()
    PLAN_PATH.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Scene sync preflight repaired dense narration lines:")
    for repair in repairs:
        print(
            f"scene-{repair['sceneId']}: {repair['requestedSpeed']:.2f}x | "
            f"{repair['oldWords']} -> {repair['newWords']} words | {repair['newLine']}"
        )
else:
    print("Scene sync preflight found non-repairable errors:")

for error in errors:
    print(f"- {error}")

# Non-zero makes the workflow regenerate audio with the repaired plan.
raise SystemExit(1)
