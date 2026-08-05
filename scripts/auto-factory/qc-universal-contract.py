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
language = str(plan.get("language", "en"))
valid_modes = {"focus", "process", "comparison", "timeline", "network", "evidence", "exploded"}
placeholder_pattern = re.compile(
    r"\b(main subject|supporting detail|visual detail|generic|placeholder|ana konu|destekleyici detay|görsel detay)\b",
    re.IGNORECASE,
)
turkish_leak_pattern = re.compile(
    r"\b(önce|sonra|yanlış|doğru|ilaç|antibiyotik|bakteri|direnç|tedavi|hastane|insanlar|hayvanlar|çevre|seçilim|yayılma|çoğalma|hücre|sinyal|hafıza|mekanizma|tepki|harita|sınır|anlaşma|rota|güç|arşiv|tarih|belge|kanıt|tanık|soru|canlı|döngü|uyum)\b",
    re.IGNORECASE,
)


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9çğıöşü]+", " ", str(value or "").lower()).strip()


def tokens(value: object) -> set[str]:
    return {part for part in norm(value).split() if len(part) >= 3}


contracts = [scene.get("visualContract") or {} for scene in scenes]
modes = [str(contract.get("mode", "")) for contract in contracts]
label_counts = [len(contract.get("labels", [])) for contract in contracts]
placeholder_scenes: list[int] = []
language_leak_scenes: list[int] = []
grounding_overlaps: list[int] = []
subject_mismatch_scenes: list[int] = []

for index, (scene, contract) in enumerate(zip(scenes, contracts), start=1):
    labels = [str(value) for value in contract.get("labels", [])]
    subject = str(contract.get("subject", ""))
    if subject not in labels:
        subject_mismatch_scenes.append(index)
    visible = " ".join([
        str(scene.get("title", "")), str(scene.get("kicker", "")), str(scene.get("voiceLine", "")),
        str(scene.get("heroVisual", "")), str(scene.get("primaryMotif", "")), str(scene.get("secondaryMotif", "")),
        *map(str, scene.get("props", [])), *map(str, scene.get("mustShow", [])), *labels,
        *[str(motif.get("label", "")) for motif in contract.get("motifs", []) if isinstance(motif, dict)],
        *[str(beat.get("label", "")) for beat in scene.get("beats", [])],
    ])
    if placeholder_pattern.search(visible):
        placeholder_scenes.append(index)
    if language == "en" and (re.search(r"[çğıöşüİ]", visible) or turkish_leak_pattern.search(visible)):
        language_leak_scenes.append(index)
    source = tokens(f"{scene.get('title', '')} {scene.get('voiceLine', '')} {plan.get('topic', '')} {' '.join(map(str, scene.get('mustShow', [])))}")
    label_tokens = set().union(*(tokens(label) for label in labels)) if labels else set()
    grounding_overlaps.append(len(source & label_tokens))

consecutive_mode_repeats = 0
longest_mode_run = 0
current_run = 0
previous_mode = None
for mode in modes:
    if mode == previous_mode:
        current_run += 1
        consecutive_mode_repeats += 1
    else:
        current_run = 1
        previous_mode = mode
    longest_mode_run = max(longest_mode_run, current_run)

v8_enabled = (
    plan.get("v8", {}).get("version") == 8
    and plan.get("v8", {}).get("renderer") == "visual-motion-documentary-v8"
)
v7_enabled = not v8_enabled and plan.get("v7", {}).get("version") == 7
if v8_enabled:
    contract_versions_valid = bool(scenes) and all(
        int(contract.get("version", 0)) == 8 and int(contract.get("baseVersion", 0)) == 7
        for contract in contracts
    )
elif v7_enabled:
    contract_versions_valid = bool(scenes) and all(
        int(contract.get("version", 0)) == 7 and int(contract.get("baseVersion", 0)) == 6
        for contract in contracts
    )
else:
    contract_versions_valid = bool(scenes) and all(int(contract.get("version", 0)) == 6 for contract in contracts)

checks = {
    "universal_base_metadata_present": plan.get("v6", {}).get("renderer") == "universal-semantic-v6",
    "universal_contract_present_every_scene": contract_versions_valid,
    "universal_valid_visual_modes": bool(modes) and all(mode in valid_modes for mode in modes),
    "universal_grounded_label_density": bool(label_counts) and all(2 <= count <= 5 for count in label_counts),
    "universal_subject_is_rendered_label": not subject_mismatch_scenes,
    "universal_no_placeholder_visuals": not placeholder_scenes,
    "universal_no_wrong_language_visible_text": not language_leak_scenes,
    "universal_scene_label_grounding": bool(grounding_overlaps) and min(grounding_overlaps) >= 2,
    "universal_mode_diversity": len(set(modes)) >= min(3, len(scenes)),
    "universal_no_excessive_mode_run": longest_mode_run <= 3,
    "universal_fail_closed_enabled": plan.get("v6", {}).get("failClosed") is True and (
        plan.get("v8", {}).get("failClosed") is True if v8_enabled
        else plan.get("v7", {}).get("failClosed") is True if v7_enabled
        else True
    ),
}

report.setdefault("checks", {}).update(checks)
if v8_enabled:
    report["renderer"] = "visual-motion-documentary-v8"
    report["renderer_version"] = 8
elif v7_enabled:
    report["renderer"] = "adaptive-documentary-v7"
    report["renderer_version"] = 7
elif plan.get("v6", {}).get("specializedRendererAvailable"):
    report["renderer"] = "specialized-semantic-v5"
    report["renderer_version"] = 5
else:
    report["renderer"] = "universal-semantic-v6"
    report["renderer_version"] = 6
report["universal_contract_version"] = 8 if v8_enabled else (7 if v7_enabled else 6)
report["v6_modes"] = modes
report["v6_unique_modes"] = len(set(modes))
report["v6_longest_mode_run"] = longest_mode_run
report["v6_label_counts"] = label_counts
report["v6_grounding_overlaps"] = grounding_overlaps
report["v6_placeholder_scenes"] = placeholder_scenes
report["v6_language_leak_scenes"] = language_leak_scenes
report["v6_subject_mismatch_scenes"] = subject_mismatch_scenes
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

summary = {
    "universal_contract_status": "PASS" if all(checks.values()) else "FAIL",
    "renderer": report["renderer"],
    "renderer_version": report["renderer_version"],
    "contract_version": report["universal_contract_version"],
    "unique_modes": len(set(modes)),
    "longest_mode_run": longest_mode_run,
    "minimum_grounding_overlap": min(grounding_overlaps, default=0),
    "placeholder_scenes": placeholder_scenes,
    "language_leak_scenes": language_leak_scenes,
    "checks": checks,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))

if not all(checks.values()):
    raise SystemExit("Universal contract QC failed: " + ", ".join(name for name, passed in checks.items() if not passed))
