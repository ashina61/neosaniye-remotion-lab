from __future__ import annotations

import asyncio
import importlib.util
import re
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("generate-audio-v3.py")
spec = importlib.util.spec_from_file_location("auto_factory_audio_v3", MODULE_PATH)
if spec is None or spec.loader is None:
    raise RuntimeError("Could not load V3 audio generator")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def sentence_aware_text() -> str:
    lines: list[str] = []
    for scene in module.PLAN["scenes"]:
        line = str(scene.get("voiceLine") or scene.get("title") or "").strip()
        if not line:
            continue
        line = re.sub(r"\s+", " ", line)
        line = re.sub(r"\s+([,.!?;:])", r"\1", line)
        if not re.search(r"[.!?]$", line):
            line += "."
        lines.append(line)
    return " ".join(lines)


def sentence_pause_removals(
    silences: list[tuple[float, float]],
    duration: float,
) -> list[tuple[float, float]]:
    """Compact only excessive pauses while preserving sentence endings.

    The previous V3 removed punctuation before TTS and left sentence endings feeling
    swallowed. V3.1 keeps punctuation and preserves roughly 220 ms between sentences.
    """
    removals: list[tuple[float, float]] = []
    for start, end in silences:
        gap = end - start
        if gap < 0.48:
            continue
        if start <= 0.25:
            remove_start, remove_end = 0.0, max(0.0, end - 0.05)
        elif end >= duration - 0.30:
            remove_start, remove_end = min(duration, start + 0.08), duration
        else:
            remove_start, remove_end = start + 0.11, end - 0.11
        if remove_end - remove_start > 0.04:
            removals.append((remove_start, remove_end))
    return module.merge_ranges(removals)


module.continuous_text = sentence_aware_text
module.planned_removals = sentence_pause_removals

if __name__ == "__main__":
    asyncio.run(module.main())
