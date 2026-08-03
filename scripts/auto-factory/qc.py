from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
TIMING_PATH = Path(os.getenv("TIMING_PATH", ROOT / "public/auto-factory/audio/scene-timing.json"))
AUDIO_MASTER = Path(os.getenv("AUDIO_MASTER", ROOT / "public/auto-factory/audio/final.wav"))
FULLHD = Path(os.getenv("FULLHD_PATH", ROOT / "out/auto-factory-fullhd.mp4"))
MOBILE = Path(os.getenv("MOBILE_PATH", ROOT / "out/auto-factory-mobile.mp4"))
REPORT = Path(os.getenv("QC_REPORT_PATH", ROOT / "out/production-report.json"))


def run(*args: str) -> str:
    result = subprocess.run(args, check=True, text=True, capture_output=True)
    return result.stdout + result.stderr


def probe(path: Path) -> dict:
    return json.loads(run("ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path)))


def loudness(path: Path) -> float | None:
    output = run("ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=I=-15.5:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-")
    matches = re.findall(r"\{\s*\"input_i\".*?\}", output, flags=re.S)
    if not matches:
        return None
    try:
        return float(json.loads(matches[-1])["input_i"])
    except (KeyError, ValueError, json.JSONDecodeError):
        return None


def video_values(data: dict) -> tuple[dict, dict]:
    return (
        next(stream for stream in data["streams"] if stream.get("codec_type") == "video"),
        next(stream for stream in data["streams"] if stream.get("codec_type") == "audio"),
    )


def audio_values(data: dict) -> dict:
    return next(stream for stream in data["streams"] if stream.get("codec_type") == "audio")


def normalized(value: str) -> str:
    value = value.lower().replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def contains_normalized_phrase(text: str, phrase: str) -> bool:
    """Match a forbidden concept as a complete token or phrase, never as a substring."""
    haystack = normalized(text)
    needle = normalized(phrase)
    if not needle:
        return False
    return f" {needle} " in f" {haystack} "


def displayed_claim(scene: dict) -> str:
    claim = str(scene.get("sceneGoal", ""))
    claim = re.sub(r"^Show exactly how:\s*", "", claim, flags=re.I)
    claim = re.sub(r"^Illustrate only this spoken claim:\s*", "", claim, flags=re.I)
    return claim.strip()


plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
timing = json.loads(TIMING_PATH.read_text(encoding="utf-8")) if TIMING_PATH.exists() else {"scenes": []}
full_data, mobile_data, audio_data = probe(FULLHD), probe(MOBILE), probe(AUDIO_MASTER)
full_video, full_audio = video_values(full_data)
mobile_video, _ = video_values(mobile_data)
audio_stream = audio_values(audio_data)
full_duration = float(full_data["format"]["duration"])
mobile_duration = float(mobile_data["format"]["duration"])
audio_duration = float(audio_data["format"]["duration"])
target = float(plan["duration"])
audio_sample_rate = int(audio_stream.get("sample_rate", 0))
expected_audio_samples = int(round(target * audio_sample_rate))
duration_ts = audio_stream.get("duration_ts")
actual_audio_samples = int(duration_ts) if duration_ts not in (None, "N/A") else int(round(audio_duration * audio_sample_rate))
scenes = plan.get("scenes", [])
scene_timings = timing.get("scenes", [])

hero_keys = [normalized(str(scene.get("heroVisual", ""))) for scene in scenes]
unique_hero_ratio = len(set(hero_keys)) / max(1, len(hero_keys))
visual_kinds = [scene.get("visualKind") for scene in scenes]
layouts = [scene.get("layout") for scene in scenes]
transitions = [scene.get("transition") for scene in scenes]
consecutive_visual_repeats = sum(1 for index in range(1, len(visual_kinds)) if visual_kinds[index] == visual_kinds[index - 1])
min_alignment = min((float(scene.get("alignmentScore", 0)) for scene in scenes), default=0)
minimum_scene_duration = min((float(scene.get("duration", 0)) for scene in scenes), default=0)
minimum_final_hold = min((float(scene.get("finalHoldRatio", 0)) for scene in scenes), default=0)

caption_errors: list[str] = []
for scene in scenes:
    voice_line = str(scene.get("voiceLine", "")).strip()
    claim = displayed_claim(scene)
    if normalized(voice_line) != normalized(claim):
        caption_errors.append(f"scene-{scene.get('id')}: displayed claim differs from narration")
    if voice_line and not re.search(r"[.!?]$", voice_line):
        caption_errors.append(f"scene-{scene.get('id')}: narration has no sentence ending")

forbidden_leaks: list[str] = []
for scene in scenes:
    visual_text = " ".join([
        str(scene.get("heroVisual", "")),
        *[str(value) for value in scene.get("supportVisuals", [])],
        *[str(value) for value in scene.get("props", [])],
    ])
    for forbidden in scene.get("forbiddenTags", []):
        if contains_normalized_phrase(visual_text, str(forbidden)):
            forbidden_leaks.append(f"scene-{scene.get('id')}: {forbidden}")

scene_timing_errors: list[str] = []
for index, scene in enumerate(scenes):
    if index >= len(scene_timings):
        scene_timing_errors.append(f"scene-{scene.get('id')}: missing timing")
        continue
    measured = scene_timings[index]
    planned_start = float(scene.get("start", 0))
    measured_start = float(measured.get("startOnTimeline", -9))
    if abs(planned_start - measured_start) > 0.28 and index > 0:
        scene_timing_errors.append(f"scene-{scene.get('id')}: visual/voice start drift {abs(planned_start-measured_start):.2f}s")

max_internal_silence = float(timing.get("maxInternalSilence", 99))
integrated = loudness(FULLHD)
sfx_count = sum(1 for scene in scenes if scene.get("sfx") != "none")

checks = {
    "factory_version_v3": int(plan.get("version", 0)) == 3,
    "topic_locked_planner": plan.get("v3", {}).get("planner") == "topic-locked",
    "readability_planner": plan.get("v3", {}).get("readability") == "slow-followable",
    "continuous_word_timed_audio": timing.get("mode") == "continuous-word-timed",
    "fullhd_exists": FULLHD.exists() and FULLHD.stat().st_size > 1_000_000,
    "mobile_exists": MOBILE.exists() and MOBILE.stat().st_size > 500_000,
    "audio_master_exists": AUDIO_MASTER.exists() and AUDIO_MASTER.stat().st_size > 100_000,
    "fullhd_resolution": (int(full_video["width"]), int(full_video["height"])) == (1080, 1920),
    "mobile_resolution": (int(mobile_video["width"]), int(mobile_video["height"])) == (720, 1280),
    "fullhd_duration": abs(full_duration - target) < 0.16,
    "mobile_duration": abs(mobile_duration - target) < 0.16,
    "audio_master_duration": abs(actual_audio_samples - expected_audio_samples) <= 1,
    "audio_48khz": audio_sample_rate == 48000 and int(full_audio["sample_rate"]) == 48000,
    "scene_count": 10 <= len(scenes) <= 12,
    "minimum_scene_duration": minimum_scene_duration >= 3.0,
    "final_visual_hold": minimum_final_hold >= 0.25,
    "caption_completeness": not caption_errors,
    "scene_timing_count": len(scene_timings) == len(scenes),
    "scene_voice_visual_lock": not scene_timing_errors,
    "continuous_speech": max_internal_silence <= 0.48,
    "unique_hero_visuals": unique_hero_ratio >= 0.90,
    "no_consecutive_template_repeat": consecutive_visual_repeats == 0,
    "visual_kind_diversity": len(set(visual_kinds)) >= 6,
    "layout_diversity": len(set(layouts)) >= 6,
    "transition_diversity": len(set(transitions)) >= 6,
    "topic_alignment": min_alignment >= 0.34,
    "forbidden_concept_leaks": not forbidden_leaks,
    "visual_beats_present": all(2 <= len(scene.get("beats", [])) <= 6 for scene in scenes),
    "support_visuals_present": all(1 <= len(scene.get("supportVisuals", [])) <= 5 for scene in scenes),
    "music_disabled": plan.get("musicMode", "off") == "off",
    "sfx_density": 2 <= sfx_count <= 5,
    "shorts_loudness": integrated is None or -18.5 <= integrated <= -12.5,
}

report = {
    "status": "PASS" if all(checks.values()) else "FAIL",
    "factory_version": plan.get("version"),
    "topic": plan.get("topic"),
    "slug": plan.get("slug"),
    "v3_profile": plan.get("v3", {}).get("profile"),
    "readability_profile": plan.get("v3", {}).get("readability"),
    "sync_mode": timing.get("mode"),
    "duration_target": target,
    "duration_fullhd": full_duration,
    "duration_mobile": mobile_duration,
    "duration_audio_master": audio_duration,
    "expected_audio_samples": expected_audio_samples,
    "actual_audio_samples": actual_audio_samples,
    "audio_sample_delta": actual_audio_samples - expected_audio_samples,
    "scene_count": len(scenes),
    "minimum_scene_duration": minimum_scene_duration,
    "minimum_final_hold_ratio": minimum_final_hold,
    "max_internal_silence": max_internal_silence,
    "unique_hero_ratio": unique_hero_ratio,
    "consecutive_visual_repeats": consecutive_visual_repeats,
    "visual_kind_count": len(set(visual_kinds)),
    "layout_count": len(set(layouts)),
    "transition_count": len(set(transitions)),
    "minimum_alignment_score": min_alignment,
    "caption_errors": caption_errors,
    "scene_timing_errors": scene_timing_errors,
    "forbidden_concept_leaks": forbidden_leaks,
    "integrated_loudness_lufs": integrated,
    "checks": checks,
    "outputs": {"fullhd": str(FULLHD), "mobile": str(MOBILE), "audio": str(AUDIO_MASTER)},
}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
if report["status"] != "PASS":
    raise SystemExit("QC failed: " + ", ".join(name for name, passed in checks.items() if not passed))
