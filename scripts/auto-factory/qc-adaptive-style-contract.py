#!/usr/bin/env python3
import json
import os
import re
from pathlib import Path

PLAN_PATH = Path(os.environ.get("PLAN_PATH", "public/auto-factory/plan.json"))
plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))

families = {
    "archive-noir", "cosmic-observatory", "biological-macro", "technical-blueprint",
    "naturalist-field", "geopolitical-dossier", "forensic-thriller", "industrial-cutaway",
    "mythic-epic", "data-thriller", "editorial-collage",
}
motif_kinds = {
    "hero-object", "orbital", "organism", "map-route", "cross-section", "mechanism",
    "document", "portrait", "environment", "data", "force-field", "network", "timeline",
}
required_palette = {"bg", "surface", "ink", "primary", "secondary", "highlight", "muted"}
generic = re.compile(r"^(main subject|supporting detail|visual detail|object|thing|concept|system|signal|placeholder)$", re.I)
hex_color = re.compile(r"^#[0-9a-fA-F]{6}$")
errors = []
scenes = plan.get("scenes") or []
v7 = plan.get("v7") or {}
v8 = plan.get("v8") or {}
v8_active = v8.get("version") == 8 and v8.get("renderer") == "visual-motion-documentary-v8"

if v7.get("version") != 7 or v7.get("renderer") != "adaptive-documentary-v7":
    errors.append("plan.v7 renderer metadata is missing or invalid")
if v7.get("adaptiveStyle") is not True or v7.get("fixedStyle") is not False:
    errors.append("V7 base style must declare adaptiveStyle=true and fixedStyle=false")
if v8_active and v8.get("failClosed") is not True:
    errors.append("V8 must keep failClosed=true")
if not scenes:
    errors.append("plan has no scenes")

used_families = set()
used_motifs = set()
for index, scene in enumerate(scenes):
    scene_id = scene.get("id", index + 1)
    contract = scene.get("visualContract") or {}
    style = contract.get("style") or {}
    motifs = contract.get("motifs") or []
    direction = contract.get("direction") or {}
    visual_direction = contract.get("visualDirection") or {}

    if v8_active:
        if contract.get("version") != 8 or contract.get("baseVersion") != 7:
            errors.append(f"scene {scene_id}: visual contract is not V8-over-V7")
            continue
    elif contract.get("version") != 7 or contract.get("baseVersion") != 6:
        errors.append(f"scene {scene_id}: visual contract is not V7-over-V6")
        continue

    family = style.get("family")
    if family not in families:
        errors.append(f"scene {scene_id}: unknown style family {family!r}")
    else:
        used_families.add(family)
    palette = style.get("palette") or {}
    if set(palette) != required_palette:
        errors.append(f"scene {scene_id}: incomplete adaptive palette")
    else:
        for key, value in palette.items():
            if not isinstance(value, str) or not hex_color.match(value):
                errors.append(f"scene {scene_id}: invalid color {key}={value!r}")
    for field in ("typography", "texture", "lighting", "shapeLanguage", "motion", "transition", "fingerprint"):
        if not str(style.get(field, "")).strip():
            errors.append(f"scene {scene_id}: missing style.{field}")
    effects = style.get("effects") or []
    if len(effects) < 2 or len(set(effects)) < 2:
        errors.append(f"scene {scene_id}: insufficient effect diversity")
    if style.get("density") not in {"light", "medium", "dense"}:
        errors.append(f"scene {scene_id}: invalid density")
    if len(motifs) < 2 or len(motifs) > 5:
        errors.append(f"scene {scene_id}: expected 2-5 drawable motifs, got {len(motifs)}")
    for motif in motifs:
        label = str(motif.get("label", "")).strip()
        kind = motif.get("kind")
        if not label or generic.match(label):
            errors.append(f"scene {scene_id}: generic or empty motif label {label!r}")
        if kind not in motif_kinds:
            errors.append(f"scene {scene_id}: unknown motif kind {kind!r}")
        else:
            used_motifs.add(kind)
        if motif.get("importance") not in {"hero", "support", "detail"}:
            errors.append(f"scene {scene_id}: invalid motif importance")

    if direction.get("assetStrategy") not in {"asset-collage", "procedural-illustration"}:
        errors.append(f"scene {scene_id}: invalid V7 base asset strategy")
    avoid = " ".join(direction.get("avoid") or []).lower()
    if "unrelated geometry" not in avoid or "template placeholders" not in avoid:
        errors.append(f"scene {scene_id}: fail-closed avoid list is incomplete")

    prompt = str(scene.get("imagePrompt", "")).strip()
    signature = str(scene.get("visualSignature", ""))
    if not prompt:
        errors.append(f"scene {scene_id}: image prompt is empty")
    if v8_active:
        for field in ("domain", "sceneMode", "presentationClass", "heroAssetType", "environment", "composition", "renderStrategy", "subject"):
            if visual_direction.get(field) in (None, ""):
                errors.append(f"scene {scene_id}: missing visualDirection.{field}")
        if not signature.startswith("visual-v8"):
            errors.append(f"scene {scene_id}: missing V8 visual signature")
    else:
        if family and family not in prompt:
            errors.append(f"scene {scene_id}: image prompt does not carry selected style family")
        if not signature.startswith("adaptive-v7:"):
            errors.append(f"scene {scene_id}: missing adaptive visual signature")

if scenes and len(used_motifs) < min(3, len(scenes)):
    errors.append(f"motif grammar is too repetitive: {sorted(used_motifs)}")
if v7.get("primaryFamily") not in families or v7.get("secondaryFamily") not in families:
    errors.append("V7 primary/secondary family selection is invalid")
if set(v7.get("usedFamilies") or []) != used_families:
    errors.append("V7 usedFamilies metadata does not match inherited scene styles")
if set(v7.get("motifKinds") or []) != used_motifs:
    errors.append("V7 motifKinds metadata does not match inherited scene motifs")
if v8_active:
    modes = {
        str((scene.get("visualContract") or {}).get("visualDirection", {}).get("sceneMode", ""))
        for scene in scenes
    }
    compositions = {
        str((scene.get("visualContract") or {}).get("visualDirection", {}).get("composition", ""))
        for scene in scenes
    }
    if len(modes - {""}) < min(3, len(scenes)):
        errors.append(f"V8 visual modes are too repetitive: {sorted(modes)}")
    if len(compositions - {""}) < min(4, len(scenes)):
        errors.append(f"V8 compositions are too repetitive: {sorted(compositions)}")

if errors:
    label = "V8 adaptive-base QC" if v8_active else "Adaptive V7 QC"
    raise SystemExit(label + " failed:\n" + "\n".join(errors[:30]))

print(
    ("V8 adaptive-base QC passed: " if v8_active else "Adaptive V7 QC passed: ")
    + f"scenes={len(scenes)} families={','.join(sorted(used_families))} "
    + f"motifs={','.join(sorted(used_motifs))}"
)
