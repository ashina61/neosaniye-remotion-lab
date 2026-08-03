from __future__ import annotations

import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
REPORT_PATH = Path(os.getenv("QC_REPORT_PATH", ROOT / "out/production-report.json"))

plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
scenes = plan.get("scenes", [])
profile = plan.get("topicProfile") or {}


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9çğıöşü]+", " ", str(value or "").lower()).strip()


def tokens(value: object) -> set[str]:
    return {part for part in norm(value).split() if len(part) > 2}


motifs = [str(scene.get("primaryMotif", "")).strip() for scene in scenes]
worlds = [str(scene.get("visualWorld", "")).strip() for scene in scenes]
visual_kinds = [str(scene.get("visualKind", "")).strip() for scene in scenes]
voice_rates = [str(scene.get("voiceRate", "+0%")) for scene in scenes]
voice_pitches = [str(scene.get("voicePitch", "-2Hz")) for scene in scenes]

rate_values: list[int] = []
pitch_values: list[int] = []
for value in voice_rates:
    match = re.fullmatch(r"([+-]\d+)%", value)
    rate_values.append(int(match.group(1)) if match else 999)
for value in voice_pitches:
    match = re.fullmatch(r"([+-]\d+)Hz", value)
    pitch_values.append(int(match.group(1)) if match else 999)

forbidden = [str(value) for value in profile.get("forbiddenMotifs", [])]
forbidden_tokens = set().union(*(tokens(value) for value in forbidden)) if forbidden else set()
scene_subject_text = [
    " ".join([
        str(scene.get("primaryMotif", "")),
        str(scene.get("secondaryMotif", "")),
        " ".join(map(str, scene.get("mustShow", []))),
    ])
    for scene in scenes
]
forbidden_leaks = [
    index + 1
    for index, text in enumerate(scene_subject_text)
    if len(tokens(text) & forbidden_tokens) >= 2
]

narration_word_count = len(re.findall(r"[0-9A-Za-zÇĞİÖŞÜçğıöşü']+", str(plan.get("narration", ""))))
consecutive_motifs = sum(
    1 for index, motif in enumerate(motifs)
    if index > 0 and motif == motifs[index - 1]
)

checks = {
    "topic_profile_present": bool(profile.get("visualWorld") and len(profile.get("primaryMotifs", [])) >= 4),
    "scene_visual_world_locked": bool(scenes) and all(world and world == profile.get("visualWorld") for world in worlds),
    "scene_must_show_present": bool(scenes) and all(len(scene.get("mustShow", [])) >= 2 for scene in scenes),
    "scene_subject_tokens_present": bool(scenes) and all(len(scene.get("subjectTokens", [])) >= 2 for scene in scenes),
    "scene_semantic_action_present": bool(scenes) and all(bool(scene.get("semanticAction")) for scene in scenes),
    "topic_motif_diversity": len(set(motifs)) >= 4,
    "no_consecutive_topic_motif": consecutive_motifs == 0,
    "grounded_visual_kind_diversity": len(set(visual_kinds)) >= 6,
    "topic_image_prompts_present": bool(scenes) and all(
        norm(plan.get("topic")) in norm(scene.get("imagePrompt", ""))
        for scene in scenes
    ),
    "forbidden_topic_motifs_absent": not forbidden_leaks,
    "natural_scene_voice_rate": bool(rate_values) and all(-3 <= value <= 3 for value in rate_values),
    "natural_scene_voice_pitch": bool(pitch_values) and all(-5 <= value <= 2 for value in pitch_values),
    "natural_narration_density": 95 <= narration_word_count <= 145,
}

report.setdefault("checks", {}).update(checks)
report["topic_visual_world"] = profile.get("visualWorld")
report["topic_primary_motif_count"] = len(set(motifs))
report["topic_consecutive_motif_repeats"] = consecutive_motifs
report["topic_forbidden_motif_leaks"] = forbidden_leaks
report["narration_word_count"] = narration_word_count
report["scene_voice_rates"] = voice_rates
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

summary = {
    "topic_grounding_status": "PASS" if all(checks.values()) else "FAIL",
    "visual_world": profile.get("visualWorld"),
    "unique_primary_motifs": len(set(motifs)),
    "consecutive_motif_repeats": consecutive_motifs,
    "visual_kind_count": len(set(visual_kinds)),
    "narration_word_count": narration_word_count,
    "checks": checks,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))

if not all(checks.values()):
    raise SystemExit(
        "Topic grounding QC failed: " + ", ".join(name for name, passed in checks.items() if not passed)
    )
