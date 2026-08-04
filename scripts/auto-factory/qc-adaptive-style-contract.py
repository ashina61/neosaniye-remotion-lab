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

if v7.get("version") != 7 or v7.get("renderer") != "adaptive-documentary-v7":
    errors.append("plan.v7 renderer metadata is missing or invalid")
if v7.get("adaptiveStyle") is not True or v7.get("fixedStyle") is not False:
    errors.append("V7 must declare adaptiveStyle=true and fixedStyle=false")
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

    if contract.get("version") != 7 or contract.get("baseVersion") != 6:
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
        errors.append(f"scene {scene_id}: invalid asset strategy")
    avoid = " ".join(direction.get("avoid") or []).lower()
    if "unrelated geometry" not in avoid or "template placeholders" not in avoid:
        errors.append(f"scene {scene_id}: fail-closed avoid list is incomplete")
    prompt = str(scene.get("imagePrompt", ""))
    if family and family not in prompt:
        errors.append(f"scene {scene_id}: image prompt does not carry selected style family")
    if not str(scene.get("visualSignature", "")).startswith("adaptive-v7:"):
        errors.append(f"scene {scene_id}: missing adaptive visual signature")

if scenes and len(used_motifs) < min(3, len(scenes)):
    errors.append(f"motif grammar is too repetitive: {sorted(used_motifs)}")
if v7.get("primaryFamily") not in families or v7.get("secondaryFamily") not in families:
    errors.append("V7 primary/secondary family selection is invalid")
if set(v7.get("usedFamilies") or []) != used_families:
    errors.append("V7 usedFamilies metadata does not match scene contracts")
if set(v7.get("motifKinds") or []) != used_motifs:
    errors.append("V7 motifKinds metadata does not match scene contracts")

if errors:
    raise SystemExit("Adaptive V7 QC failed:\n" + "\n".join(errors[:30]))

print(
    "Adaptive V7 QC passed: "
    f"scenes={len(scenes)} families={','.join(sorted(used_families))} "
    f"motifs={','.join(sorted(used_motifs))}"
)
