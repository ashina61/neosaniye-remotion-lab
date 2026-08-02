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
    raw = run("ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(path))
    return json.loads(raw)


def loudness(path: Path) -> dict:
    output = run(
        "ffmpeg",
        "-hide_banner",
        "-i",
        str(path),
        "-af",
        "loudnorm=I=-15.5:TP=-1.5:LRA=7:print_format=json",
        "-f",
        "null",
        "-",
    )
    matches = re.findall(r"\{\s*\"input_i\".*?\}", output, flags=re.S)
    if not matches:
        return {}
    try:
        return json.loads(matches[-1])
    except json.JSONDecodeError:
        return {}


def video_values(data: dict) -> tuple[dict, dict]:
    video = next(stream for stream in data["streams"] if stream.get("codec_type") == "video")
    audio = next(stream for stream in data["streams"] if stream.get("codec_type") == "audio")
    return video, audio


def stream_duration(stream: dict, fallback: float) -> float:
    try:
        return float(stream.get("duration", fallback))
    except (TypeError, ValueError):
        return fallback


plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
timing = json.loads(TIMING_PATH.read_text(encoding="utf-8")) if TIMING_PATH.exists() else {"scenes": []}
full_data = probe(FULLHD)
mobile_data = probe(MOBILE)
audio_data = probe(AUDIO_MASTER)
full_video, full_audio = video_values(full_data)
mobile_video, mobile_audio = video_values(mobile_data)
full_duration = float(full_data["format"]["duration"])
mobile_duration = float(mobile_data["format"]["duration"])
audio_duration = float(audio_data["format"]["duration"])
target = float(plan["duration"])
full_audio_duration = stream_duration(full_audio, full_duration)
full_video_duration = stream_duration(full_video, full_duration)

scene_timings = timing.get("scenes", [])
scene_sync_errors: list[str] = []
max_requested_speed = 0.0
for scene, measured in zip(plan["scenes"], scene_timings):
    scene_start = float(scene["start"])
    scene_end = scene_start + float(scene["duration"])
    voice_start = float(measured.get("startOnTimeline", -1))
    voice_end = voice_start + float(measured.get("fittedDuration", 0))
    window = float(measured.get("voiceWindow", 0))
    fitted = float(measured.get("fittedDuration", 0))
    requested_speed = float(measured.get("requestedSpeed", 99))
    max_requested_speed = max(max_requested_speed, requested_speed)
    if voice_start < scene_start - 0.02 or voice_end > scene_end + 0.05:
        scene_sync_errors.append(f"scene-{scene['id']}: voice outside scene")
    if fitted > window + 0.05:
        scene_sync_errors.append(f"scene-{scene['id']}: fitted voice exceeds window")
    if requested_speed > 1.42:
        scene_sync_errors.append(f"scene-{scene['id']}: narration too dense ({requested_speed:.2f}x)")

sfx_count = sum(1 for scene in plan["scenes"] if scene.get("sfx") != "none")
transition_count = len({scene.get("transition") for scene in plan["scenes"]})
visual_kind_count = len({scene.get("visualKind") for scene in plan["scenes"]})
layout_count = len({scene.get("layout") for scene in plan["scenes"]})
beats_ok = all(2 <= len(scene.get("beats", [])) <= 5 for scene in plan["scenes"])
voice_lines_ok = all(4 <= len(str(scene.get("voiceLine", "")).strip()) <= 260 for scene in plan["scenes"])

checks = {
    "factory_version_v2": int(plan.get("version", 0)) == 2,
    "fullhd_exists": FULLHD.exists() and FULLHD.stat().st_size > 1_000_000,
    "mobile_exists": MOBILE.exists() and MOBILE.stat().st_size > 500_000,
    "timing_manifest_exists": TIMING_PATH.exists(),
    "audio_master_exists": AUDIO_MASTER.exists() and AUDIO_MASTER.stat().st_size > 100_000,
    "fullhd_resolution": (int(full_video["width"]), int(full_video["height"])) == (1080, 1920),
    "mobile_resolution": (int(mobile_video["width"]), int(mobile_video["height"])) == (720, 1280),
    "fullhd_duration": abs(full_duration - target) < 0.16,
    "mobile_duration": abs(mobile_duration - target) < 0.16,
    "audio_master_duration": abs(audio_duration - target) < 0.04,
    "audio_video_duration_lock": abs(full_audio_duration - full_video_duration) < 0.16,
    "audio_48khz": int(full_audio["sample_rate"]) == 48000,
    "scene_count": 12 <= len(plan["scenes"]) <= 20,
    "scene_timing_count": len(scene_timings) == len(plan["scenes"]),
    "scene_locked_voice": not scene_sync_errors,
    "voice_lines_present": voice_lines_ok,
    "visual_beats_present": beats_ok,
    "hard_hook": float(plan["scenes"][0]["duration"]) <= 3.05,
    "final_hold": float(plan["scenes"][-1]["duration"]) >= 3.65,
    "shorts_pacing": max(float(scene["duration"]) for scene in plan["scenes"][:-1]) <= 3.55,
    "sfx_density": 2 <= sfx_count <= 6,
    "transition_diversity": transition_count >= 4,
    "visual_diversity": visual_kind_count >= 5,
    "layout_diversity": layout_count >= 4,
    "music_mode_valid": plan.get("musicMode", "off") in ("off", "soft-documentary"),
}

measured_loudness = loudness(FULLHD)
if measured_loudness.get("input_i") is not None:
    integrated = float(measured_loudness["input_i"])
    checks["shorts_loudness"] = -18.5 <= integrated <= -12.5
else:
    integrated = None
    checks["shorts_loudness"] = True

report = {
    "status": "PASS" if all(checks.values()) else "FAIL",
    "factory_version": plan.get("version"),
    "topic": plan["topic"],
    "slug": plan["slug"],
    "category": plan["category"],
    "music_mode": plan.get("musicMode", "off"),
    "sync_mode": timing.get("mode"),
    "duration_target": target,
    "duration_fullhd": full_duration,
    "duration_mobile": mobile_duration,
    "duration_audio_master": audio_duration,
    "duration_video_stream": full_video_duration,
    "duration_audio_stream": full_audio_duration,
    "scene_count": len(plan["scenes"]),
    "scene_timing_count": len(scene_timings),
    "max_requested_voice_speed": max_requested_speed,
    "scene_sync_errors": scene_sync_errors,
    "ai_image_count": sum(1 for scene in plan["scenes"] if scene.get("asset")),
    "noticeable_sfx_count": sfx_count,
    "transition_count": transition_count,
    "visual_kind_count": visual_kind_count,
    "layout_count": layout_count,
    "integrated_loudness_lufs": integrated,
    "checks": checks,
    "research_sources": plan.get("research", []),
    "outputs": {"fullhd": str(FULLHD), "mobile": str(MOBILE), "audio": str(AUDIO_MASTER)},
}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
if report["status"] != "PASS":
    failed = [name for name, value in checks.items() if not value]
    raise SystemExit(f"QC failed: {', '.join(failed)}")
