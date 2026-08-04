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
story = plan.get("storyRepair") or {}
active = story.get("mode") == "ranked-extractive-fallback"
language = str(plan.get("language", "en"))

fragment_start = re.compile(
    r"^(he|she|they|it|others?|someone|somebody|his|her|their|its|and|or|but|which|where|whose)\b",
    re.IGNORECASE,
)
fragment_end = re.compile(
    r"\b(and|or|to|of|in|on|at|by|for|from|with|between|through|which|where|protective)\.$",
    re.IGNORECASE,
)
placeholder = re.compile(
    r"\b(main subject|supporting detail|visual detail|generic fallback|placeholder|"
    r"ana konu|destekleyici detay|görsel detay)\b",
    re.IGNORECASE,
)
turkish_leak = re.compile(
    r"\b(veri|sistem|sinyal|hücre|hafıza|mekanizma|tepki|harita|sınır|"
    r"anlaşma|rota|güç|arşiv|tarih|belge|kanıt|tanık|soru|canlı|döngü|uyum|"
    r"önce|sonra|yanlış|doğru|ilaç|antibiyotik|bakteri|direnç|tedavi|hastane)\b",
    re.IGNORECASE,
)

selected_sources = story.get("selectedSources", []) if active else []
voice_lines = [str(scene.get("voiceLine", "")).strip() for scene in scenes]
concept_lists = [scene.get("visualConcepts", []) for scene in scenes]
source_repair_misses: list[int] = []
weak_concept_scenes: list[int] = []
oversized_concept_scenes: list[int] = []
fragment_start_scenes: list[int] = []
fragment_end_scenes: list[int] = []
placeholder_scenes: list[int] = []
language_leak_scenes: list[int] = []
missing_source_note_scenes: list[int] = []

if active:
    for index, scene in enumerate(scenes, start=1):
        line = str(scene.get("voiceLine", "")).strip()
        concepts = scene.get("visualConcepts", [])
        visible = " ".join(
            [
                str(scene.get("title", "")),
                str(scene.get("kicker", "")),
                line,
                str(scene.get("heroVisual", "")),
                str(scene.get("primaryMotif", "")),
                str(scene.get("secondaryMotif", "")),
                *map(str, scene.get("props", [])),
                *map(str, scene.get("mustShow", [])),
                *map(str, concepts),
                *[str(beat.get("label", "")) for beat in scene.get("beats", [])],
            ]
        )
        if scene.get("contentRepairSource") != "ranked-wikipedia-fallback-v1":
            source_repair_misses.append(index)
        if not isinstance(concepts, list) or not 2 <= len(concepts) <= 5:
            weak_concept_scenes.append(index)
        if isinstance(concepts, list) and any(len(str(value)) > 36 for value in concepts):
            oversized_concept_scenes.append(index)
        if fragment_start.search(line):
            fragment_start_scenes.append(index)
        if fragment_end.search(line):
            fragment_end_scenes.append(index)
        if placeholder.search(visible):
            placeholder_scenes.append(index)
        if language == "en" and (re.search(r"[çğıöşüİ]", visible) or turkish_leak.search(visible)):
            language_leak_scenes.append(index)
        if not str(scene.get("sourceNote", "")).strip():
            missing_source_note_scenes.append(index)

source_scores_valid = all(
    float(source.get("score", 0)) >= 8
    and (int(source.get("titleHits", 0)) >= 1 or int(source.get("excerptHits", 0)) >= 2)
    for source in selected_sources
)

checks = {
    "fallback_story_not_applicable_or_versioned": (not active) or int(story.get("version", 0)) == 1,
    "fallback_story_fail_closed": (not active) or story.get("failClosed") is True,
    "fallback_story_scene_count": (not active) or 7 <= len(scenes) <= 12,
    "fallback_story_relevant_sources": (not active) or (bool(selected_sources) and source_scores_valid),
    "fallback_story_fact_count_matches": (not active) or int(story.get("selectedFactCount", -1)) == len(scenes),
    "fallback_story_repair_applied_every_scene": (not active) or not source_repair_misses,
    "fallback_story_visual_concepts_present": (not active) or not weak_concept_scenes,
    "fallback_story_visual_concepts_fit": (not active) or not oversized_concept_scenes,
    "fallback_story_no_fragment_starts": (not active) or not fragment_start_scenes,
    "fallback_story_no_fragment_ends": (not active) or not fragment_end_scenes,
    "fallback_story_unique_voice_lines": (not active) or len(set(voice_lines)) == len(voice_lines),
    "fallback_story_no_placeholders": (not active) or not placeholder_scenes,
    "fallback_story_no_wrong_language_text": (not active) or not language_leak_scenes,
    "fallback_story_source_note_present": (not active) or not missing_source_note_scenes,
}

report.setdefault("checks", {}).update(checks)
report["fallback_story_active"] = active
report["fallback_story_mode"] = story.get("mode")
report["fallback_story_selected_sources"] = selected_sources
report["fallback_story_scene_count"] = len(scenes) if active else 0
report["fallback_story_source_repair_misses"] = source_repair_misses
report["fallback_story_weak_concept_scenes"] = weak_concept_scenes
report["fallback_story_oversized_concept_scenes"] = oversized_concept_scenes
report["fallback_story_fragment_start_scenes"] = fragment_start_scenes
report["fallback_story_fragment_end_scenes"] = fragment_end_scenes
report["fallback_story_placeholder_scenes"] = placeholder_scenes
report["fallback_story_language_leak_scenes"] = language_leak_scenes
report["fallback_story_missing_source_note_scenes"] = missing_source_note_scenes
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

summary = {
    "fallback_story_status": "PASS" if all(checks.values()) else "FAIL",
    "active": active,
    "scene_count": len(scenes) if active else 0,
    "selected_sources": [source.get("title") for source in selected_sources],
    "checks": checks,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))

if not all(checks.values()):
    raise SystemExit(
        "Fallback story QC failed: "
        + ", ".join(name for name, passed in checks.items() if not passed)
    )
