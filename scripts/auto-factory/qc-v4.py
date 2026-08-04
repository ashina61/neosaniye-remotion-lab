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
    command = [
        "ffmpeg", "-v", "error", "-ss", f"{second:.3f}", "-i", str(FULLHD),
        "-frames:v", "1", "-vf", f"scale={WIDTH}:{HEIGHT},format=gray",
        "-f", "rawvideo", "pipe:1",
    ]
    result = subprocess.run(command, check=True, capture_output=True)
    expected = WIDTH * HEIGHT
    if len(result.stdout) != expected:
        raise RuntimeError(f"V4 frame extraction returned {len(result.stdout)} bytes, expected {expected}")
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


plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
scenes = plan.get("scenes", [])
v4 = plan.get("v4") or {}

grammars = [str(scene.get("sceneGrammar", "")) for scene in scenes]
cameras = [str(scene.get("cameraMove", "")) for scene in scenes]
text_modes = [str(scene.get("textMode", "")) for scene in scenes]
biases = [str(scene.get("compositionBias", "")) for scene in scenes]
layer_counts = [int(scene.get("layerCount", 0)) for scene in scenes]
match_tokens = [str(scene.get("matchCutToken", "")) for scene in scenes]
semantic_rules = [str(scene.get("semanticLockRule", "")).strip() for scene in scenes]
semantic_renderer_active = bool(scenes) and all(semantic_rules)
consecutive_grammar_repeats = sum(
    1 for index in range(1, len(grammars)) if grammars[index] == grammars[index - 1]
)
consecutive_semantic_repeats = sum(
    1 for index in range(1, len(semantic_rules))
    if semantic_rules[index] == semantic_rules[index - 1]
)

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

adjacent_similarities = [
    similarity(signatures[index - 1], signatures[index])
    for index in range(1, len(signatures))
]
average_adjacent_similarity = statistics.mean(adjacent_similarities) if adjacent_similarities else 1.0
maximum_adjacent_similarity = max(adjacent_similarities, default=1.0)
near_duplicate_pairs = sum(1 for value in adjacent_similarities if value >= 0.985)
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
    "v4_no_rendered_near_duplicate_pairs": near_duplicate_pairs == 0,
    "v4_average_layout_similarity": average_adjacent_similarity <= 0.972,
    "v4_visual_center_x_diversity": center_x_spread >= 0.025,
    "v4_visual_center_y_diversity": center_y_spread >= 0.035,
}

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
        "v4_camera_diversity": len(set(cameras)) >= 4,
        "v4_text_mode_diversity": len(set(text_modes)) >= 3,
        "v4_composition_bias_diversity": len(set(biases)) >= 4,
        "v4_independent_layer_density": bool(layer_counts) and all(7 <= value <= 12 for value in layer_counts),
    })

active_renderer = "semantic-procedural-v5" if semantic_renderer_active else v4.get("renderer")
report.setdefault("checks", {}).update(checks)
report["renderer_version"] = 5 if semantic_renderer_active else 4
report["renderer"] = active_renderer
report["v4_visual_world"] = v4.get("visualWorld")
report["v4_scene_grammars"] = grammars
report["v4_unique_scene_grammars"] = len(set(grammars))
report["v4_camera_moves"] = cameras
report["v4_unique_camera_moves"] = len(set(cameras))
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
report["v4_rendered_near_duplicate_pairs"] = near_duplicate_pairs
report["v4_visual_center_x_spread"] = round(center_x_spread, 6)
report["v4_visual_center_y_spread"] = round(center_y_spread, 6)
report["v4_frame_errors"] = frame_errors
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

summary = {
    "v4_status": "PASS" if all(checks.values()) else "FAIL",
    "renderer": active_renderer,
    "grammar_count": len(set(grammars)),
    "semantic_rule_count": len(set(semantic_rules)),
    "camera_count": len(set(cameras)),
    "average_adjacent_layout_similarity": round(average_adjacent_similarity, 6),
    "maximum_adjacent_layout_similarity": round(maximum_adjacent_similarity, 6),
    "near_duplicate_pairs": near_duplicate_pairs,
    "visual_center_spread": [round(center_x_spread, 6), round(center_y_spread, 6)],
    "checks": checks,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))

if not all(checks.values()):
    raise SystemExit("V4/V5 QC failed: " + ", ".join(name for name, passed in checks.items() if not passed))
