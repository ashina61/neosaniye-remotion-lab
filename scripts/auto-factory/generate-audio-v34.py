from __future__ import annotations

import asyncio
import importlib.util
import json
import re
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v33.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v33", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.3 audio generator")
v33 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v33)

module = v33.v32.module
language = str(module.PLAN.get("language", "tr"))

# V3.1 QC requires a deliberate 300-440 ms sentence interval and at least a
# 150 ms visual hold after each spoken sentence. GuyNeural already carries a
# natural 140 ms safety tail after the last detected phoneme. Removing 30 ms
# leaves roughly 110 ms of protection while keeping measured internal silence
# under the global 480 ms continuity limit.
module.INTER_SCENE_PAUSE = 0.30 if language == "en" else 0.36

if language == "en":
    resilient_synthesize = module.synthesize

    async def synthesize_with_compact_tail(index: int, line: str):
        path, raw_duration, trimmed_duration = await resilient_synthesize(index, line)
        compact_duration = max(0.35, trimmed_duration - 0.03)
        compact_path = module.OUT_DIR / f"scene-{index:02d}-compact.wav"
        module.run(
            "ffmpeg", "-y", "-i", str(path),
            "-af", f"atrim=start=0:end={compact_duration:.6f},asetpts=PTS-STARTPTS",
            "-ar", str(module.SAMPLE_RATE), "-ac", "2", str(compact_path),
        )
        return compact_path, raw_duration, module.probe_duration(compact_path)

    module.synthesize = synthesize_with_compact_tail


def rate_ratio(value: str) -> float:
    match = re.fullmatch(r"\s*([+-]?\d+(?:\.\d+)?)%\s*", value)
    if not match:
        return 1.0
    return max(0.20, 1.0 + float(match.group(1)) / 100.0)


def clear_generated_audio() -> None:
    for path in module.OUT_DIR.iterdir():
        if path.is_file():
            path.unlink(missing_ok=True)


def synchronize_audio_text() -> None:
    """Make the rendered scene text identical to the sentence sent to TTS.

    V3.1 canonicalizes whitespace and sentence punctuation before synthesis. The
    old plan kept the pre-canonical voiceLine while scene-timing.json stored the
    spoken line, so semantically identical text could fail an exact QC check.
    The timing manifest is the final audio authority, therefore copy its lines
    back into the plan after the complete audio/timeline pass succeeds.
    """
    plan_path = module.PLAN_PATH
    timing_path = module.OUT_DIR / "scene-timing.json"
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    timing = json.loads(timing_path.read_text(encoding="utf-8"))
    scenes = plan.get("scenes", [])
    measured = timing.get("scenes", [])

    if len(scenes) != len(measured):
        raise RuntimeError(
            f"V3.4 audio text synchronization mismatch: {len(scenes)} scenes != {len(measured)} timings"
        )

    canonical_lines: list[str] = []
    for scene, item in zip(scenes, measured):
        line = str(item.get("line", "")).strip()
        if not line:
            raise RuntimeError(f"V3.4 scene {scene.get('id')} has no canonical audio line")
        scene["voiceLine"] = line
        scene["sceneGoal"] = f"Illustrate only this spoken claim: {line}"
        canonical_lines.append(line)

    plan["narration"] = " ".join(canonical_lines)
    plan.setdefault("v3", {})["audioTextAuthority"] = "scene-timing.json"
    plan_path.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")

    # Read back and fail before render if disk contents still differ.
    disk_plan = json.loads(plan_path.read_text(encoding="utf-8"))
    disk_lines = [str(scene.get("voiceLine", "")).strip() for scene in disk_plan.get("scenes", [])]
    timing_lines = [str(item.get("line", "")).strip() for item in measured]
    if disk_lines != timing_lines:
        raise RuntimeError("V3.4 canonical audio text readback failed")

    print(f"V3.4 canonical audio text synchronized: {len(canonical_lines)} scenes")


async def main() -> None:
    try:
        await v33.main()
    except RuntimeError as error:
        match = re.search(
            r"Narration density is outside V3\.1 readability range \(([0-9.]+)x required\)",
            str(error),
        )
        if match is None:
            raise

        measured_density = float(match.group(1))
        current_ratio = rate_ratio(str(module.VOICE_RATE))
        target_density = 0.95
        adjusted_ratio = current_ratio * measured_density / target_density
        adjusted_ratio = max(0.35, min(1.25, adjusted_ratio))
        adjusted_percent = round((adjusted_ratio - 1.0) * 100)
        adjusted_rate = f"{adjusted_percent:+d}%"

        if adjusted_rate == module.VOICE_RATE:
            raise

        print(
            "V3.4 narration density retry: "
            f"measured={measured_density:.2f}x, voice rate {module.VOICE_RATE} -> {adjusted_rate}"
        )
        module.VOICE_RATE = adjusted_rate
        clear_generated_audio()
        await v33.main()

    synchronize_audio_text()


if __name__ == "__main__":
    asyncio.run(main())
