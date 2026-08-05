from __future__ import annotations

import asyncio
import importlib.util
import json
import re
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v34.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v34", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.4 audio generator")
v34 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v34)

module = v34.module
base_synthesize = module.synthesize
applied_rates: dict[int, str] = {}
applied_pitches: dict[int, str] = {}

NATURAL_MIN_TEMPO = 0.88
NATURAL_MAX_TEMPO = 1.12
SLOW_REFIT_TARGET = 0.98
FAST_REFIT_TARGET = 1.02
MAX_TEMPO_ATTEMPTS = 3
TEMPO_FAILURE = re.compile(
    r"V3\.5 natural audio tempo failed: final atempo=([0-9.]+)x; allowed 0\.88-1\.12x"
)


def parse_percent(value: object) -> int:
    match = re.fullmatch(r"\s*([+-]?\d+)%\s*", str(value or "+0%"))
    return int(match.group(1)) if match else 0


def parse_pitch(value: object) -> int:
    match = re.fullmatch(r"\s*([+-]?\d+)Hz\s*", str(value or "-2Hz"))
    return int(match.group(1)) if match else -2


def format_percent(value: int) -> str:
    return f"{value:+d}%"


def format_pitch(value: int) -> str:
    return f"{value:+d}Hz"


def refit_voice_rate(speed: float, current_rate: str) -> str:
    """Choose a new Edge TTS rate that pulls global atempo back near 1.0.

    The fitted tempo is approximately proportional to synthesized speech duration,
    while Edge's rate ratio is approximately inverse to that duration. Therefore
    new_rate_ratio = current_rate_ratio * measured_tempo / target_tempo.
    """
    current_ratio = max(0.20, 1.0 + parse_percent(current_rate) / 100.0)
    target = SLOW_REFIT_TARGET if speed < NATURAL_MIN_TEMPO else FAST_REFIT_TARGET
    requested_ratio = current_ratio * speed / target
    requested_percent = round((requested_ratio - 1.0) * 100)
    bounded_percent = max(-12, min(12, requested_percent))
    return format_percent(bounded_percent)


async def synthesize_with_scene_pacing(index: int, line: str):
    """Apply small scene-level pace and pitch changes without leaving natural limits."""
    original_rate = str(module.VOICE_RATE)
    original_communicate = module.edge_tts.Communicate
    scenes = module.PLAN.get("scenes", [])
    scene = scenes[index - 1] if 0 < index <= len(scenes) else {}

    scene_delta = parse_percent(scene.get("voiceRate", "+0%"))
    effective = max(-12, min(12, parse_percent(original_rate) + scene_delta))
    effective_rate = format_percent(effective)
    effective_pitch = format_pitch(max(-5, min(2, parse_pitch(scene.get("voicePitch", "-2Hz")))))
    applied_rates[index] = effective_rate
    applied_pitches[index] = effective_pitch
    module.VOICE_RATE = effective_rate

    def communicate_with_scene_pitch(text: str, voice: str, **kwargs):
        kwargs["pitch"] = effective_pitch
        return original_communicate(text, voice, **kwargs)

    module.edge_tts.Communicate = communicate_with_scene_pitch
    try:
        return await base_synthesize(index, line)
    finally:
        module.VOICE_RATE = original_rate
        module.edge_tts.Communicate = original_communicate


module.synthesize = synthesize_with_scene_pacing


def annotate_and_validate_audio(retry_count: int = 0) -> None:
    timing_path = module.OUT_DIR / "scene-timing.json"
    timing = json.loads(timing_path.read_text(encoding="utf-8"))
    speed = float(timing.get("speed", 0))
    if not NATURAL_MIN_TEMPO <= speed <= NATURAL_MAX_TEMPO:
        raise RuntimeError(
            f"V3.5 natural audio tempo failed: final atempo={speed:.3f}x; allowed 0.88-1.12x"
        )

    scenes = timing.get("scenes", [])
    for index, item in enumerate(scenes, start=1):
        item["effectiveVoiceRate"] = applied_rates.get(index, str(module.VOICE_RATE))
        item["effectiveVoicePitch"] = applied_pitches.get(index, "-2Hz")
        item["naturalTempoValidated"] = True

    timing["naturalVoiceVersion"] = 3
    timing["naturalTempoRange"] = [NATURAL_MIN_TEMPO, NATURAL_MAX_TEMPO]
    timing["naturalTempoRetryCount"] = retry_count
    timing["naturalTempoAutoRefit"] = retry_count > 0
    timing["sentenceTailPolicy"] = "retain-140ms-post-phoneme"
    timing_path.write_text(json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        "V3.5 natural voice ready: "
        f"atempo={speed:.3f}x, retries={retry_count}, "
        f"scene rates={','.join(applied_rates.values())}, "
        f"scene pitches={','.join(applied_pitches.values())}, tails=retained"
    )


async def main() -> None:
    last_error: RuntimeError | None = None

    for attempt in range(1, MAX_TEMPO_ATTEMPTS + 1):
        try:
            await v34.main()
            annotate_and_validate_audio(retry_count=attempt - 1)
            return
        except RuntimeError as error:
            last_error = error
            match = TEMPO_FAILURE.search(str(error))
            if match is None or attempt >= MAX_TEMPO_ATTEMPTS:
                raise

            speed = float(match.group(1))
            old_rate = str(module.VOICE_RATE)
            new_rate = refit_voice_rate(speed, old_rate)
            if new_rate == old_rate:
                raise

            print(
                "V3.5 natural tempo auto-refit: "
                f"attempt={attempt}, measured={speed:.3f}x, "
                f"voice rate {old_rate} -> {new_rate}"
            )
            module.VOICE_RATE = new_rate
            applied_rates.clear()
            applied_pitches.clear()
            v34.clear_generated_audio()

    if last_error is not None:
        raise last_error


if __name__ == "__main__":
    asyncio.run(main())
