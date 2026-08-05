from __future__ import annotations

# Regression for run 30856093451: V3.1 retained 140 ms after each sentence and
# about 35 ms before the next one, then added another fixed 300 ms silence. A
# slow natural atempo pass stretched the edge cushions and produced a 0.52 s gap.

TAIL = 0.14
ONSET = 0.035
OLD_EXPLICIT_PAUSE = 0.30
NEW_EXPLICIT_PAUSE = 0.12
NATURAL_MIN_TEMPO = 0.88
NATURAL_MAX_TEMPO = 1.12


for speed in (0.88, 0.94, 1.0, 1.06, 1.12):
    old_boundary = TAIL / speed + OLD_EXPLICIT_PAUSE + ONSET / speed
    new_boundary = TAIL / speed + NEW_EXPLICIT_PAUSE + ONSET / speed
    visual_hold_after_last_phoneme = TAIL / speed + NEW_EXPLICIT_PAUSE / 2

    assert old_boundary > 0.45, (speed, old_boundary)
    assert 0.26 <= new_boundary <= 0.33, (speed, new_boundary)
    assert new_boundary < 0.44, (speed, new_boundary)
    assert visual_hold_after_last_phoneme >= 0.15, (speed, visual_hold_after_last_phoneme)


def refit_rate(current_percent: int, measured_tempo: float) -> int:
    current_ratio = 1.0 + current_percent / 100.0
    target = 0.98 if measured_tempo < NATURAL_MIN_TEMPO else 1.02
    requested_ratio = current_ratio * measured_tempo / target
    return max(-12, min(12, round((requested_ratio - 1.0) * 100)))


# Regression for run seed 151: Edge TTS produced 0.878x while the natural floor
# was 0.880x. The old pipeline accepted it in V3.1, then failed in V3.5. The
# retry must move the base voice rate away from the boundary instead of relaxing
# the natural-tempo contract or failing the whole topic.
slow_retry = refit_rate(+2, 0.878)
assert slow_retry == -9, slow_retry
predicted_slow_tempo = 0.878 * 1.02 / (1.0 + slow_retry / 100.0)
assert NATURAL_MIN_TEMPO <= predicted_slow_tempo <= NATURAL_MAX_TEMPO, predicted_slow_tempo

fast_retry = refit_rate(+2, 1.135)
assert fast_retry == 12, fast_retry
predicted_fast_tempo = 1.135 * 1.02 / (1.0 + fast_retry / 100.0)
assert NATURAL_MIN_TEMPO <= predicted_fast_tempo <= NATURAL_MAX_TEMPO, predicted_fast_tempo

print('Audio boundary and natural-tempo refit regression: PASS')
