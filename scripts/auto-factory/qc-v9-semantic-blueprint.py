#!/usr/bin/env python3
from __future__ import annotations

import json
import os
from collections import Counter
from pathlib import Path

PLAN_PATH = Path(os.getenv("PLAN_PATH", "public/auto-factory/plan.json"))
REPORT_PATH = Path(os.getenv("QC_REPORT_PATH", "out/production-report.json"))

plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
scenes = plan.get("scenes") or []
v9 = plan.get("v9") or {}
blueprints = [scene.get("v9Blueprint") or {} for scene in scenes]
families = [str(item.get("sceneFamily", "")) for item in blueprints]
archetypes = [str(item.get("sceneArchetype", "")) for item in blueprints]
physical_families = {
    "human-reconstruction",
    "environmental-reconstruction",
    "industrial-process",
    "mechanism-cutaway",
    "microscopic-process",
    "market-exchange",
    "archival-evidence",
    "hazard-operation",
    "consequence-world",
}


def longest_run(values: list[str]) -> int:
    best = current = 0
    previous = object()
    for value in values:
        if value == previous:
            current += 1
        else:
            current = 1
            previous = value
        best = max(best, current)
    return best


def generic_shape_first(item: dict) -> bool:
    text = " ".join(
        [
            str(item.get("visualStatement", "")),
            str((item.get("assetPlan") or {}).get("prompt", "")),
            *map(str, item.get("worldEntities") or []),
        ]
    ).lower()
    return any(
        phrase in text
        for phrase in (
            "generic floating cards",
            "decorative geometry as hero",
            "single icon explains",
            "random circles and lines",
        )
    )


route_rows: list[dict[str, object]] = []
for scene, blueprint in zip(scenes, blueprints):
    if blueprint.get("sceneFamily") != "geographic-route":
        continue
    statement = str(blueprint.get("visualStatement", "")).lower()
    relations = " ".join(map(str, blueprint.get("spatialRelations") or [])).lower()
    prompt = str((blueprint.get("assetPlan") or {}).get("prompt", "")).lower()
    combined = f"{statement} {relations} {prompt}"
    route_rows.append(
        {
            "scene": scene.get("id"),
            "archetype": blueprint.get("sceneArchetype"),
            "has_directional_contract": any(
                token in combined
                for token in ("origin", "destination", "direction", "route", "intermediary")
            ),
            "entity_count": len(blueprint.get("worldEntities") or []),
        }
    )

physical_count = sum(1 for family in families if family in physical_families)
physical_ratio = physical_count / max(1, len(scenes))
family_counts = Counter(families)
archetype_counts = Counter(archetypes)
map_count = family_counts.get("geographic-route", 0)
brain_provider = v9.get("brainProvider") or v9.get("aiProvider")
brain_model = v9.get("brainModel") or v9.get("aiModel")

checks = {
    "v9_metadata": (
        v9.get("version") == 9
        and v9.get("renderer") == "semantic-visual-documentary-v9"
        and v9.get("brain") == "semantic-visual-blueprint-v9"
        and v9.get("semanticBlueprintReady") is True
    ),
    "v9_semantic_classifier_locked": v9.get("spokenFamilyLock") == "semantic-classifier-v1",
    "v9_blueprints_complete": bool(scenes) and all(blueprints),
    "v9_scene_ids_locked": all(
        int(blueprint.get("sceneId", -1)) == int(scene.get("id", -2))
        for scene, blueprint in zip(scenes, blueprints)
    ),
    "v9_scene_families_present": all(families),
    "v9_scene_archetypes_present": all(archetypes),
    "v9_scene_family_diversity": len(set(families)) >= min(4, len(scenes)),
    "v9_scene_archetype_diversity": len(set(archetypes)) >= min(6, len(scenes)),
    "v9_no_adjacent_archetype_repeat": longest_run(archetypes) <= 1,
    "v9_representational_ratio": physical_ratio >= 0.5,
    "v9_map_budget": map_count <= 2,
    "v9_route_contract_complete": all(
        row["archetype"] == "route-overview"
        and row["has_directional_contract"]
        and int(row["entity_count"]) >= 2
        for row in route_rows
    ),
    "v9_spatial_layers_complete": all(
        len(blueprint.get("spatialRelations") or []) >= 3
        and all((blueprint.get("layerPlan") or {}).get(key) for key in ("foreground", "midground", "background"))
        for blueprint in blueprints
    ),
    "v9_motion_intent_complete": all(
        (blueprint.get("motionIntent") or {}).get("grammar")
        and (blueprint.get("motionIntent") or {}).get("camera")
        for blueprint in blueprints
    ),
    "v9_asset_plan_complete": all(
        (blueprint.get("assetPlan") or {}).get("prompt")
        and (blueprint.get("assetPlan") or {}).get("fallbackRenderer")
        and len((blueprint.get("assetPlan") or {}).get("searchQueries") or []) >= 2
        for blueprint in blueprints
    ),
    "v9_prompts_lock_archetype": all(
        str(blueprint.get("sceneArchetype", ""))
        and str(blueprint.get("sceneArchetype")) in str((blueprint.get("assetPlan") or {}).get("prompt", ""))
        for blueprint in blueprints
    ),
    "v9_no_generic_shape_first": not any(generic_shape_first(item) for item in blueprints),
    "v9_negative_rules_present": all(
        len(blueprint.get("negativeRules") or []) >= 4 for blueprint in blueprints
    ),
}

report = {}
if REPORT_PATH.exists():
    try:
        report = json.loads(REPORT_PATH.read_text(encoding="utf-8"))
    except Exception:
        report = {}

report.setdefault("checks", {}).update(checks)
report["v9_scene_families"] = families
report["v9_scene_archetypes"] = archetypes
report["v9_scene_family_counts"] = dict(family_counts)
report["v9_scene_archetype_counts"] = dict(archetype_counts)
report["v9_longest_archetype_run"] = longest_run(archetypes)
report["v9_representational_scene_count"] = physical_count
report["v9_representational_ratio"] = round(physical_ratio, 3)
report["v9_map_scene_count"] = map_count
report["v9_route_rows"] = route_rows
report["v9_brain_provider"] = brain_provider
report["v9_brain_model"] = brain_model
report["v9_asset_provider"] = v9.get("assetProvider")
report["v9_generated_ai_image_count"] = v9.get("generatedAiImageCount", 0)
report["status"] = "PASS" if all(report["checks"].values()) else "FAIL"
REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

summary = {
    "v9_semantic_blueprint_status": "PASS" if all(checks.values()) else "FAIL",
    "brain_provider": brain_provider,
    "asset_provider": v9.get("assetProvider"),
    "family_counts": dict(family_counts),
    "archetype_counts": dict(archetype_counts),
    "representational_ratio": round(physical_ratio, 3),
    "map_count": map_count,
    "longest_archetype_run": longest_run(archetypes),
    "checks": checks,
}
print(json.dumps(summary, ensure_ascii=False, indent=2))

failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise SystemExit("V9 semantic blueprint QC failed: " + ", ".join(failed))
