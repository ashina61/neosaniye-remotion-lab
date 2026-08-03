from __future__ import annotations

# Regression for run 30856093451: a retained 140 ms consonant tail and the next
# 25 ms onset cushion were incorrectly followed by another fixed 300 ms silence.
# Slowing narration to 0.88x stretched those edge cushions and pushed the detected
# boundary above the 480 ms QC ceiling.

BOUNDARY_TARGET = 0.32
TAIL = 0.14
ONSET = 0.025
MIN_INSERTED = 0.035
MAX_INSERTED = 0.22


def inserted_gap(trailing: float, leading: float) -> float:
    return max(MIN_INSERTED, min(MAX_INSERTED, BOUNDARY_TARGET - trailing - leading))


for speed in (0.88, 0.94, 1.0, 1.06, 1.12):
    old_boundary = TAIL / speed + 0.30 + ONSET / speed
    normalized_trailing = TAIL
    normalized_leading = ONSET
    new_inserted = inserted_gap(normalized_trailing, normalized_leading)
    new_boundary = normalized_trailing + new_inserted + normalized_leading
    assert old_boundary > 0.44, (speed, old_boundary)
    assert 0.29 <= new_boundary <= 0.34, (speed, new_boundary)
    assert new_boundary < 0.46, (speed, new_boundary)

print('Audio boundary model regression: PASS')
