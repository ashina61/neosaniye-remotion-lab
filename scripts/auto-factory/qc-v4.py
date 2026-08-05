from __future__ import annotations

import json
import os
import statistics
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
FULLHD = Path(os.getenv("FULLHD_PATH", ROOT / "out/auto-factory-fullhd.mp4"))
REPORT_PATH = Path(os.getenv("QC_REPORT_PATH", ROOT / "out/production-report.json"))

WIDTH = 48
HEIGHT = 85
GRID_COLS = 6
GRID_ROWS = 10


def extract_frame(second: float) -> bytes:
    # Analyze the visual stage rather than the shared title/caption chrome.
    # The fixed editorial shell made unrelated V8 scenes look artificially
    # centered and similar when the whole vertical frame was downsampled.
    command = [
        "ffmpeg", "-v", "error", "-ss", f"{second:.3f}", "-i", str(FULLHD),
        "-frames:v", "1",
        "-vf", f"crop=iw:ih*0.70:0:ih*0.15,scale={WIDTH}:{HEIGHT},format=gray",
        "-f", "rawvideo", "pipe:1",
    ]
    result = subprocess.run(command, check=True, capture_output=True)
    expected = WIDTH * HEIGHT
    if len(result.stdout) != expected:
        raise RuntimeError(f"Rendered frame extraction returned {len(result.stdout)} bytes, expected {expected}")
    return result.stdout


def layout_signature(raw: bytes) -> tuple[list[float], float, float]:
    pixels = list(raw)
    edges = [0.0] * (WIDTH * HEIGHT)
    for y in range(HEIGHT - 1):
        for x in range(WIDTH - 1):
            index = y * WIDTH + x
            difference = abs(pixels[index] - pixels[index + 1]) + abs(pixels[index] - pixels[index + WIDTH])
            edges[index] = min(1.0, difference / 80.0)

    features: list[float] = []
    for row in range(GRID_ROWS):
        y0 = row * HEIGHT // GRID_ROWS
        y1 = (row + 1) * HEIGHT // GRID_ROWS
        for column in range(GRID_COLS):
            x0 = column * WIDTH // GRID_COLS
            x1 = (column + 1) * WIDTH // GRID_COLS
            indices = [y * WIDTH + x for y in range(y0, y1) for x in range(x0, x1)]
            luminance = sum(pixels[index] for index in indices) / len(indices) / 255.0
            edge_density = sum(edges[index] for index in indices) / len(indices)
            features.extend([luminance, edge_density])

    edge_total = sum(edges)
    if edge_total:
        center_x = sum((index % WIDTH) * edges[index] for index in range(len(edges))) / edge_total / (WIDTH - 1)
        center_y = sum((index // WIDTH) * edges[index] for index in range(len(edges))) / edge_total / (HEIGHT - 1)
    else:
        center_x = center_y = 0.5
    features.extend([center_x, center_y])
    return features, center_x, center_y


def similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        return 1.0
    difference = sum(abs(a - b) for a, b in zip(left, right)) / max(1, len(left))
    return max(0.0, min(1.0, 1.0 - difference))


def motif_signature(scene: dict) -> str:
    motifs = (scene.get("visualContract") or {}).get("motifs") or []
    return "|".join(str(item.get("kind", "")) for item in motifs if isinstance(item, dict))


def longest_run(values: list[str]) -> int:
    best = current = 0
    previous: object = object()
    for value in values:
        if value == previous:
            current += 1
        else:
            current = 1
            previous = value
        best = max(best, current)
    return best


plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
scenes = plan.get("scenes", [])
v4 = plan.get("v4") or {}
v7 = plan.get("v7") or {}
v8 = plan.get("v8") or {}

v8_active = (
    int(v8.get("version", 0)) == 8
    and v8.get("renderer") == "visual-motion-documentary-v8"
    and bool(scenes)
    and all((scene.get("visualContract") or {}).get("version") == 8 for scene in scenes)
    and all((scene.get("motionContract") or {}).get("version") == 8 for scene in scenes)
)
v7_active = not v8_active and int(v7.get("version", 0)) == 7 and v7.get("renderer") == "adaptive-documentary-v7"

grammars = [str(scene.get("sceneGrammar", "")) for scene in scenes]
legacy_cameras = [str(scene.get("cameraMove", "")) for scene in scenes]
text_modes = [str(scene.get("textMode", "")) for scene in scenes]
biases = [str(scene.get("compositionBias", "")) for scene in scenes]
layer_counts = [int(scene.get("layerCount", 0)) for scene in scenes]
match_tokens = [str(scene.get("matchCutToken", "")) for scene in scenes]
semantic_rules = [str(scene.get("semanticLockRule", "")).strip() for scene in scenes]
semantic_renderer_active = bool(scenes) and all(semantic_rules)

contracts = [scene.get("visualContract") or {} for scene in scenes]
motions = [scene.get("motionContract") or {} for scene in scenes]
base_mode_signatures = [str(contract.get("mode", "")) for contract in contracts]
motif_signatures = [motif_signature(scene) for scene in scenes]
family_signatures = [str((contract.get("style") or {}).get("family", "")) for contract in contracts]
v8_modes = [str((contract.get("visualDirection") or {}).get("sceneMode", "")) for contract in contracts]
v8_compositions = [str((contract.get("visualDirection") or {}).get("composition", "")) for contract in contracts]
v8_cameras = [str(motion.get("cameraMove", "")) for motion in motions]
v8_transitions = [str(motion.get("transitionIn", "")) for motion in motions]

consecutive_grammar_repeats = sum(1 for index in range(1, len(grammars)) if grammars[index] == grammars[index - 1])
consecutive_semantic_repeats = sum(1 for index in range(1, len(semantic_rules)) if semantic_rules[index] == semantic_rules[index - 1])

signatures: list[list[float]] = []
centers_x: list[float] = []
centers_y: list[float] = []
frame_errors: list[str] = []
for scene in scenes:
    midpoint = float(scene.get("start", 0)) + float(scene.get("duration", 0)) * 0.56
    try:
        feature, center_x, center_y = layout_signature(extract_frame(midpoint))
        signatures.append(feature)
        centers_x.append(center_x)
        centers_y.append(center_y)
    except (subprocess.CalledProcessError, RuntimeError) as error:
        frame_errors.append(f"scene-{scene.get('id')}: {error}")

adjacent_similarities = [similarity(signatures[index - 1], signatures[index]) for index in range(1, len(signatures))]
average_adjacent_similarity = statistics.mean(adjacent_similarities) if adjacent_similarities else 1.0
maximum_adjacent_similarity = max(adjacent_similarities, default=1.0)
raw_near_duplicate_pairs = [index for index, value in enumerate(adjacent_similarities, start=1) if value >= 0.985]
semantic_near_duplicate_pairs: list[dict[str, object]] = []
for left_scene_number in raw_near_duplicate_pairs:
    left = left_scene_number - 1
    right = left_scene_number
    same_semantic = bool(semantic_rules[left]) and semantic_rules[left] == semantic_rules[right]
    same_motifs = bool(motif_signatures[left]) and motif_signatures[left] == motif_signatures[right]
    same_family = bool(family_signatures[left]) and family_signatures[left] == family_signatures[right]
    if v8_active:
        same_mode = bool(v8_modes[left]) and v8_modes[left] == v8_modes[right]
        same_composition = bool(v8_compositions[left]) and v8_compositions[left] == v8_compositions[right]
        same_camera = bool(v8_cameras[left]) and v8_cameras[left] == v8_cameras[right]
        duplicate = same_mode and same_composition and same_camera and same_motifs and (same_semantic or same_family)
    elif v7_active:
        same_mode = bool(base_mode_signatures[left]) and base_mode_signatures[left] == base_mode_signatures[right]
        same_composition = False
        same_camera = False
        duplicate = same_semantic and same_motifs and same_mode and same_family
    else:
        same_mode = bool(base_mode_signatures[left]) and base_mode_signatures[left] == base_mode_signatures[right]
        same_composition = False
        same_camera = False
        duplicate = True
    if duplicate:
        semantic_near_duplicate_pairs.append({
            "left_scene": left_scene_number,
            "right_scene": left_scene_number + 1,
            "similarity": round(adjacent_similarities[left], 6),
            "semantic_rule": semantic_rules[left],
            "motif_signature": motif_signatures[left],
            "mode": v8_modes[left] if v8_active else base_mode_signatures[left],
            "composition": v8_compositions[left] if v8_active else "",
            "camera": v8_cameras[left] if v8_active else "",
            "family": family_signatures[left],
        })

center_x_spread = max(centers_x, default=0.5) - min(centers_x, default=0.5)
center_y_spread = max(centers_y, default=0.5) - min(centers_y, default=0.5)

checks = {
    "v4_renderer_active": v4.get("renderer") == "scene-grammar-v4" and int(v4.get("version", 0)) == 4,
    "v4_fixed_bottom_caption_removed": v4.get("fixedBottomCaption") is False,
    "v4_scene_grammar_present": bool(scenes) and all(grammars),
    "v4_scene_grammar_diversity": len(set(grammars)) >= min(6, len(scenes)),
    "v4_no_consecutive_scene_grammar": consecutive_grammar_repeats == 0,
    "v4_match_cut_tokens_present": bool(match_tokens) and all(len(value) >= 2 for value in match_tokens),
    "v4_rendered_frames_readable": len(signatures) == len(scenes) and not frame_errors,
    "v4_no_rendered_near_duplicate_pairs": not semantic_near_duplicate_pairs,
}

if v8_active:
    checks.update({
        "v8_rendered_layout_qc_active": True,
        "v8_rendered_scene_mode_diversity": len(set(v8_modes)) >= min(3, len(scenes)),
        "v8_rendered_composition_diversity": len(set(v8_compositions)) >= min(4, len(scenes)),
        "v8_rendered_camera_diversity": len(set(v8_cameras)) >= min(3, len(scenes)),
        "v8_rendered_transition_diversity": len(set(v8_transitions)) >= min(3, len(scenes)),
        "v8_no_semantic_render_duplicates": not semantic_near_duplicate_pairs,
        "v8_average_stage_similarity": average_adjacent_similarity <= 0.985,
        "v8_no_mode_spam": longest_run(v8_modes) <= 4,
        "v8_no_composition_spam": longest_run(v8_compositions) <= 2,
    })
else:
    checks.update({
        "v4_average_layout_similarity": average_adjacent_similarity <= 0.972,
        "v4_visual_center_x_diversity": center_x_spread >= 0.025,
        "v4_visual_center_y_diversity": center_y_spread >= 0.035,
    })

if semantic_renderer_active:
    checks.update({
        "v5_semantic_renderer_active": True,
        "v5_semantic_rule_present": all(semantic_rules),
        "v5_semantic_rule_diversity": len(set(semantic_rules)) >= min(8, len(scenes)),
        "v5_no_consecutive_semantic_rule": consecutive_semantic_repeats == 0,
        "v5_semantic_layer_density": bool(layer_counts) and all(7 <= value <= 13 for value in layer_counts),
    })
else:
    checks.update({
        "v4_camera_diversity": len(set(legacy_cameras)) >= 4,
        "v4_text_mode_diversity": len(set(text_modes)) >= 3,
        "v4_composition_bias_diversity": len(set(biases)) >= 4,
        "v4_independent_layer_density": bool(layer_counts) and all(7 <= value <= 12 for value in layer_counts),
    })

if v7_active:
    checks.update({
        "v7_renderer_active": True,
        "v7_motif_signatures_present": bool(motif_signatures) and all(motif_signatures),
        "v7_semantic_duplicate_guard": not semantic_near_duplicate_pairs,
    })

active_renderer = "visual-motion-documentary-v8" if v8_active else (
    "adaptive-documentary-v7" if v7_active else (
        "semantic-procedural-v5" if semantic_renderer_active else v4.get("renderer")
    )
)
renderer_version = 8 if v8_active else (7 if v7_active else (5 if semantic_renderer_active else 4))
report.setdefault("checks", {}).update(checks)
report["renderer_version"] = renderer_version
report["renderer"] = active_renderer
report["v4_visual_world"] = v4.get("visualWorld")
report["v4_scene_grammars"] = grammars
report["v4_unique_scene_grammars"] = len(set(grammars))
report["v4_camera_moves"] = legacy_cameras
report["v4_unique_camera_moves"] = len(set(legacy_cameras))
report["v4_text_modes"] = text_modes
report["v4_composition_biases"] = biases
report["v4_layer_counts"] = layer_counts
report["v4_consecutive_grammar_repeats"] = consecutive_grammar_repeats
report["v5_semantic_rules"] = semantic_rules
report["v5_unique_semantic_rules"] = len(set(semantic_rules))
report["v5_consecutive_semantic_repeats"] = consecutive_semantic_repeats
report["v4_adjacent_layout_similarities"] = [round(value, 6) for value in adjacent_similarities]
report["v4_average_adjacent_layout_similarity"] = round(average_adjacent_similarity, 6)
report["v4_maximum_adjacent_layout_similarity"] = round(maximum_adjacent_similarity, 6)
report["v4_rendered_near_duplicate_pairs"] = len(semantic_near_duplicate_pairs)
report["v8_raw_visual_similarity_pairs"] = raw_near_duplicate_pairs if v8_active else []
report["v8_semantic_near_duplicate_pairs"] = semantic_near_duplicate_pairs if v8_active else []
report["v8_scene_modes_rendered"] = v8_modes if v8_active else []
report["v8_compositions_rendered"] = v8_compositions if v8_active else []
report["v8_camera_moves_rendered"] = v8_cameras if v8_active else []
report["v8_transitions_rendered"] = v8_transitions if v8_active else []
report["v7_raw_visual_similarity_pairs"] = raw_near_duplicate_pairs if v7_active else []
report["v7_semantic_near_duplicate_pairs"] = semantic_near_duplicate_pairs if v7_active else []
report["v7_motif_signatures"] = motif_signatures if v7_active else []
report["v4_visual_center_x_spread"] = round(center_x_spread, 6)
report["v4_visual_center_y_spread"] = round(center_y_spread, 6)
report["v4_frame_errors"] = frame_errors
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

summary = {
    "rendered_layout_status": "PASS" if all(checks.values()) else "FAIL",
    "renderer": active_renderer,
    "renderer_version": renderer_version,
    "grammar_count": len(set(grammars)),
    "semantic_rule_count": len(set(semantic_rules)),
    "camera_count": len(set(v8_cameras if v8_active else legacy_cameras)),
    "composition_count": len(set(v8_compositions)) if v8_active else len(set(biases)),
    "average_adjacent_layout_similarity": round(average_adjacent_similarity, 6),
    "maximum_adjacent_layout_similarity": round(maximum_adjacent_similarity, 6),
    "raw_visual_similarity_pairs": raw_near_duplicate_pairs,
    "semantic_near_duplicate_pairs": semantic_near_duplicate_pairs,
    "visual_center_spread": [round(center_x_spread, 6), round(center_y_spread, 6)],
    "checks": checks,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))

if not all(checks.values()):
    raise SystemExit("Rendered layout QC failed: " + ", ".join(name for name, passed in checks.items() if not passed))
