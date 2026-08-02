from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLAN_PATH = Path(os.getenv("PLAN_PATH", ROOT / "public/auto-factory/plan.json"))
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
    output = run("ffmpeg", "-hide_banner", "-i", str(path), "-af", "loudnorm=I=-15.5:TP=-1.5:LRA=8:print_format=json", "-f", "null", "-")
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


plan = json.loads(PLAN_PATH.read_text(encoding="utf-8"))
full_data = probe(FULLHD)
mobile_data = probe(MOBILE)
full_video, full_audio = video_values(full_data)
mobile_video, mobile_audio = video_values(mobile_data)
full_duration = float(full_data["format"]["duration"])
mobile_duration = float(mobile_data["format"]["duration"])
target = float(plan["duration"])
checks = {
    "fullhd_exists": FULLHD.exists() and FULLHD.stat().st_size > 1_000_000,
    "mobile_exists": MOBILE.exists() and MOBILE.stat().st_size > 500_000,
    "fullhd_resolution": (int(full_video["width"]), int(full_video["height"])) == (1080, 1920),
    "mobile_resolution": (int(mobile_video["width"]), int(mobile_video["height"])) == (720, 1280),
    "fullhd_duration": abs(full_duration - target) < 0.25,
    "mobile_duration": abs(mobile_duration - target) < 0.25,
    "audio_48khz": int(full_audio["sample_rate"]) == 48000,
    "scene_count": 12 <= len(plan["scenes"]) <= 20,
    "hard_hook": float(plan["scenes"][0]["duration"]) <= 3.0,
    "final_hold": float(plan["scenes"][-1]["duration"]) >= 3.6,
    "shorts_pacing": max(float(scene["duration"]) for scene in plan["scenes"][:-1]) <= 3.35,
    "sfx_density": 3 <= sum(1 for scene in plan["scenes"] if scene.get("sfx") != "none") <= 7
}
measured_loudness = loudness(FULLHD)
if measured_loudness.get("input_i") is not None:
    integrated = float(measured_loudness["input_i"])
    checks["shorts_loudness"] = -19.0 <= integrated <= -12.0
else:
    integrated = None
    checks["shorts_loudness"] = True

report = {
    "status": "PASS" if all(checks.values()) else "FAIL",
    "topic": plan["topic"],
    "slug": plan["slug"],
    "category": plan["category"],
    "duration_target": target,
    "duration_fullhd": full_duration,
    "duration_mobile": mobile_duration,
    "scene_count": len(plan["scenes"]),
    "ai_image_count": sum(1 for scene in plan["scenes"] if scene.get("asset")),
    "noticeable_sfx_count": sum(1 for scene in plan["scenes"] if scene.get("sfx") != "none"),
    "integrated_loudness_lufs": integrated,
    "checks": checks,
    "research_sources": plan.get("research", []),
    "outputs": {"fullhd": str(FULLHD), "mobile": str(MOBILE)}
}
REPORT.parent.mkdir(parents=True, exist_ok=True)
REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
if report["status"] != "PASS":
    failed = [name for name, value in checks.items() if not value]
    raise SystemExit(f"QC failed: {', '.join(failed)}")
