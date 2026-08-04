#!/usr/bin/env python3
import json
import os
from collections import Counter
from pathlib import Path

plan_path = Path(os.environ.get('PLAN_PATH', 'public/auto-factory/plan.json'))
report_path = Path(os.environ.get('REPORT_PATH', 'out/production-report.json'))
plan = json.loads(plan_path.read_text(encoding='utf-8'))
scenes = plan.get('scenes') or []
checks = {}
details = {}

visual_versions = [scene.get('visualContract', {}).get('version') for scene in scenes]
motion_versions = [scene.get('motionContract', {}).get('version') for scene in scenes]
checks['v8_visual_contracts_complete'] = bool(scenes) and all(version == 8 for version in visual_versions)
checks['v8_motion_contracts_complete'] = bool(scenes) and all(version == 8 for version in motion_versions)

visual_directions = [scene.get('visualContract', {}).get('visualDirection', {}) for scene in scenes]
motions = [scene.get('motionContract', {}) for scene in scenes]
modes = [item.get('sceneMode') for item in visual_directions if item.get('sceneMode')]
classes = [item.get('presentationClass') for item in visual_directions if item.get('presentationClass')]
cameras = [item.get('cameraMove') for item in motions if item.get('cameraMove')]
transitions = [item.get('transitionIn') for item in motions if item.get('transitionIn')]

checks['v8_visual_mode_diversity'] = len(set(modes)) >= min(3, len(scenes))
checks['v8_camera_diversity'] = len(set(cameras)) >= min(3, len(scenes))
checks['v8_transition_diversity'] = len(set(transitions)) >= min(3, len(scenes))
checks['v8_choreography_complete'] = bool(scenes) and all(len(item.get('choreography') or []) >= 5 for item in motions)
checks['v8_emphasis_complete'] = bool(scenes) and all(len(item.get('emphasisMoments') or []) >= 1 for item in motions)
checks['v8_effect_budget_bounded'] = bool(scenes) and all(1 <= int(item.get('fxBudget', {}).get('maxConcurrentEffects', 0)) <= 4 for item in motions)
checks['v8_no_generic_shape_first'] = all(
    direction.get('renderStrategy') != 'shape-first'
    and direction.get('presentationClass') in {'realistic', 'archival', 'diagram', 'symbolic'}
    for direction in visual_directions
)

symbolic_count = sum(1 for value in classes if value == 'symbolic')
allowed_symbolic = max(1, int(len(scenes) * 0.12 + 0.999))
checks['v8_symbolic_quota'] = symbolic_count <= allowed_symbolic


def longest_run(values):
    best = current = 0
    previous = object()
    for value in values:
        if value == previous:
            current += 1
        else:
            current = 1
            previous = value
        best = max(best, current)
    return best

checks['v8_no_transition_spam'] = longest_run(transitions) <= 2
checks['v8_no_camera_spam'] = longest_run(cameras) <= 2

category = str(plan.get('category') or '').lower()
domain = str(plan.get('v8', {}).get('visualDirector', {}).get('domain') or '')
if category == 'history' or 'history' in domain:
    checks['v8_history_not_shape_template'] = (
        classes.count('symbolic') <= 1
        and 'realistic' in classes
        and 'archival' in classes
        and any(mode == 'cartographic' for mode in modes)
    )
else:
    checks['v8_history_not_shape_template'] = True

checks['v8_metadata'] = (
    plan.get('v8', {}).get('version') == 8
    and plan.get('v8', {}).get('renderer') == 'visual-motion-documentary-v8'
    and bool(plan.get('v8', {}).get('visualDirector'))
    and bool(plan.get('v8', {}).get('motionDirector'))
)

details.update({
    'v8_scene_modes': modes,
    'v8_presentation_counts': dict(Counter(classes)),
    'v8_camera_moves': cameras,
    'v8_transition_types': transitions,
    'v8_symbolic_count': symbolic_count,
    'v8_symbolic_allowed': allowed_symbolic,
    'v8_longest_transition_run': longest_run(transitions),
    'v8_longest_camera_run': longest_run(cameras),
})

report = {}
if report_path.exists():
    try:
        report = json.loads(report_path.read_text(encoding='utf-8'))
    except Exception:
        report = {}
report.setdefault('checks', {}).update(checks)
report.update(details)
report['renderer'] = 'visual-motion-documentary-v8'
report['renderer_version'] = 8
report_path.parent.mkdir(parents=True, exist_ok=True)
report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise SystemExit('V8 director QC failed: ' + ', '.join(failed))
print('V8 director QC passed: ' + ', '.join(name for name, passed in checks.items() if passed))
