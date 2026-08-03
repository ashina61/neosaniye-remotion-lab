from __future__ import annotations

# Regression for run 30856093451: V3.1 retained 140 ms after each sentence and
# about 35 ms before the next one, then added another fixed 300 ms silence. A
# slow natural atempo pass stretched the edge cushions and produced a 0.52 s gap.

TAIL = 0.14
ONSET = 0.035
OLD_EXPLICIT_PAUSE = 0.30
NEW_EXPLICIT_PAUSE = 0.12


for speed in (0.88, 0.94, 1.0, 1.06, 1.12):
    old_boundary = TAIL / speed + OLD_EXPLICIT_PAUSE + ONSET / speed
    new_boundary = TAIL / speed + NEW_EXPLICIT_PAUSE + ONSET / speed
    visual_hold_after_last_phoneme = TAIL / speed + NEW_EXPLICIT_PAUSE / 2

    assert old_boundary > 0.45, (speed, old_boundary)
    assert 0.26 <= new_boundary <= 0.33, (speed, new_boundary)
    assert new_boundary < 0.44, (speed, new_boundary)
    assert visual_hold_after_last_phoneme >= 0.15, (speed, visual_hold_after_last_phoneme)

print('Audio boundary model regression: PASS')
