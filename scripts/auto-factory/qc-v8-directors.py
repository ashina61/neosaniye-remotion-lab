#!/usr/bin/env python3
import json
import os
import re
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
compositions = [item.get('composition') for item in visual_directions if item.get('composition')]
cameras = [item.get('cameraMove') for item in motions if item.get('cameraMove')]
transitions = [item.get('transitionIn') for item in motions if item.get('transitionIn')]


def stage_family(mode):
    value = str(mode or '')
    if value in {'archival-evidence', 'portrait-focus'}:
        return 'archive'
    if value in {'historical-reconstruction', 'forensic-reconstruction', 'institutional-reconstruction'}:
        return 'reconstruction'
    if value in {'cartographic', 'system-map', 'ecological-map'}:
        return 'map'
    if value in {'scientific-macro', 'comparison-lab', 'behavior-closeup'}:
        return 'macro'
    if value in {'technical-cutaway', 'process-cutaway', 'orbital-diagram'}:
        return 'cutaway'
    if value == 'realistic-object':
        return 'physical-object'
    if value == 'environmental-realism':
        return 'environment'
    if value in {'cosmic-reconstruction', 'scale-comparison'}:
        return 'cosmic'
    if value == 'data-evidence':
        return 'data'
    return 'fallback'


stage_families = [stage_family(mode) for mode in modes]
checks['v8_visual_mode_diversity'] = len(set(modes)) >= min(3, len(scenes))
checks['v8_stage_family_diversity'] = len(set(stage_families)) >= min(3, len(scenes))
checks['v8_composition_diversity'] = len(set(compositions)) >= min(4, len(scenes))
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
checks['v8_no_stage_family_spam'] = longest_run(stage_families) <= 4

STOP = set('a an the and or but if then than to of in on at by for from with without into onto over under through during before after is are was were be been being it its this that these those how why what when where who which can could may might will would should do does did done have has had as about around across their his her our your one two three first last new old same other another people thing things way ways bir bu şu ve veya ama fakat çünkü için ile de da ki mi mı mu mü nasıl neden ne zaman nerede kim hangi olan olarak daha en çok az sonra önce ise kadar gibi her bazı diğer aynı yeni eski ilk son'.split())
GENERIC = set('topic subject scene system process mechanism result detail information data thing things explains explanation main supporting konu sahne sistem süreç mekanizma sonuç bilgi'.split())
SYNONYM_GROUPS = [
    ['undersea', 'submarine', 'subsea', 'seabed', 'seafloor'],
    ['cable', 'cables', 'fiber', 'fibre', 'wire', 'wires'],
    ['internet', 'network', 'communications', 'communication', 'telecommunication', 'traffic'],
    ['carry', 'carries', 'carried', 'transmit', 'transmits', 'transmitted', 'send', 'sends', 'sent'],
    ['protect', 'protects', 'protected', 'armor', 'armour', 'shield', 'shields'],
    ['bacteria', 'bacterium', 'microbe', 'microbes', 'microbial'],
    ['resistant', 'resistance', 'resist'],
    ['route', 'routes', 'path', 'paths', 'corridor', 'corridors'],
]


def stem(raw):
    token = re.sub(r"[^a-z0-9çğıöşü'-]+", '', str(raw or '').lower())
    if token.endswith('ies') and len(token) > 4:
        token = token[:-3] + 'y'
    elif token.endswith('ing') and len(token) > 6:
        token = token[:-3]
    elif token.endswith('ed') and len(token) > 5:
        token = token[:-2]
    elif token.endswith('es') and len(token) > 5:
        token = token[:-2]
    elif token.endswith('s') and len(token) > 3 and not token.endswith('ss'):
        token = token[:-1]
    return token


synonym_map = {}
for group in SYNONYM_GROUPS:
    canonical = stem(group[0])
    for token in group:
        synonym_map[stem(token)] = canonical


def content_tokens(value):
    raw = re.findall(r"[0-9A-Za-zÇĞİÖŞÜçğıöşü'-]+", str(value or ''))
    result = []
    for item in raw:
        token = synonym_map.get(stem(item), stem(item))
        if len(token) >= 3 and token not in STOP and token not in GENERIC:
            result.append(token)
    return result


story_mode = str(plan.get('storyRepair', {}).get('mode') or '')
curated_story = story_mode == 'preserve-curated-story' or all(scene.get('contentRepairSource') == 'curated-topic-script' for scene in scenes)
research_text = ' '.join(
    f"{item.get('title', '')} {item.get('excerpt', item.get('snippet', ''))}"
    for item in (plan.get('research') or [])
)
research_corpus = set(content_tokens(research_text))
topic_tokens = set(content_tokens(plan.get('topic', '')))
research_support_rows = []
for scene in scenes:
    tokens = sorted(set(token for token in content_tokens(scene.get('voiceLine', '')) if token not in topic_tokens))
    matches = sum(1 for token in tokens if token in research_corpus)
    ratio = matches / max(1, len(tokens))
    research_support_rows.append({
        'scene': scene.get('id'),
        'matches': matches,
        'tokens': len(tokens),
        'ratio': round(ratio, 3),
        'passed': matches >= min(3, len(tokens)) and ratio >= 0.42,
    })
checks['v8_story_research_support'] = curated_story or (bool(research_support_rows) and all(row['passed'] for row in research_support_rows))

category = str(plan.get('category') or '').lower()
domain = str(plan.get('v8', {}).get('visualDirector', {}).get('domain') or '')
if category == 'history' or 'history' in domain:
    checks['v8_history_not_shape_template'] = (
        classes.count('symbolic') <= 1
        and 'realistic' in classes
        and 'archival' in classes
        and any(mode == 'cartographic' for mode in modes)
        and len(set(stage_families)) >= 3
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
    'v8_stage_families': stage_families,
    'v8_compositions': compositions,
    'v8_presentation_counts': dict(Counter(classes)),
    'v8_camera_moves': cameras,
    'v8_transition_types': transitions,
    'v8_symbolic_count': symbolic_count,
    'v8_symbolic_allowed': allowed_symbolic,
    'v8_longest_transition_run': longest_run(transitions),
    'v8_longest_camera_run': longest_run(cameras),
    'v8_longest_stage_family_run': longest_run(stage_families),
    'v8_research_support': research_support_rows,
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
