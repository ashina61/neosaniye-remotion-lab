from __future__ import annotations

import asyncio
import importlib.util
import wave
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v35.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v35", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3.5 audio generator")
v35 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v35)

module = v35.module
base_synthesize = module.synthesize
# Repair early enough that the slowest allowed 0.88x global atempo pass cannot
# stretch an internal pause back over the 0.48 s master ceiling.
MAX_NATURAL_PAUSE = 0.36
RETAINED_PAUSE = 0.18


def compact_internal_silences(path: Path) -> tuple[int, float]:
    """Shorten long silence inside one sentence, never its beginning or ending."""
    duration = module.probe_duration(path)
    silences = module.detect_silence(path, minimum=MAX_NATURAL_PAUSE)
    internal = [
        (start, end)
        for start, end in silences
        if start > 0.06
        and end < duration - 0.06
        and end - start > MAX_NATURAL_PAUSE
    ]
    if not internal:
        return 0, 0.0

    with wave.open(str(path), "rb") as source:
        params = source.getparams()
        if params.comptype != "NONE" or params.sampwidth != 2:
            raise RuntimeError(f"Unsupported WAV format while compacting scene silence: {path.name}")
        frame_rate = source.getframerate()
        frame_size = source.getnchannels() * source.getsampwidth()
        frame_count = source.getnframes()
        payload = source.readframes(frame_count)

    cuts: list[tuple[int, int]] = []
    for start, end in internal:
        cut_start = int(round((start + RETAINED_PAUSE / 2) * frame_rate))
        cut_end = int(round((end - RETAINED_PAUSE / 2) * frame_rate))
        cut_start = max(0, min(frame_count, cut_start))
        cut_end = max(cut_start, min(frame_count, cut_end))
        if cut_end > cut_start:
            cuts.append((cut_start, cut_end))

    if not cuts:
        return 0, 0.0

    output = bytearray()
    cursor = 0
    removed_frames = 0
    for cut_start, cut_end in cuts:
        output.extend(payload[cursor * frame_size:cut_start * frame_size])
        removed_frames += cut_end - cut_start
        cursor = cut_end
    output.extend(payload[cursor * frame_size:])

    temporary = path.with_name(f"{path.stem}-pause-compacted.wav")
    with wave.open(str(temporary), "wb") as target:
        target.setparams(params)
        target.writeframes(bytes(output))
    temporary.replace(path)
    return len(cuts), removed_frames / frame_rate


async def synthesize_with_compact_pauses(index: int, line: str):
    trimmed, raw_duration, _ = await base_synthesize(index, line)
    count, removed = compact_internal_silences(trimmed)
    final_duration = module.probe_duration(trimmed)
    if count:
        print(
            f"Scene {index} natural pause repair: {count} long pause(s), "
            f"removed={removed:.2f}s, final={final_duration:.2f}s"
        )
    return trimmed, raw_duration, final_duration


module.synthesize = synthesize_with_compact_pauses


async def main() -> None:
    await v35.main()


if __name__ == "__main__":
    asyncio.run(main())
