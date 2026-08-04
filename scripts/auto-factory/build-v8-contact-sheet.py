#!/usr/bin/env python3
import json
import os
import subprocess
from pathlib import Path

plan_path = Path(os.environ.get('PLAN_PATH', 'public/auto-factory/plan.json'))
video_path = Path(os.environ.get('VIDEO_PATH', 'out/auto-factory-fullhd.mp4'))
output_path = Path(os.environ.get('CONTACT_PATH', 'out/review/v8-contact.jpg'))
columns = max(2, int(os.environ.get('CONTACT_COLUMNS', '3')))
plan = json.loads(plan_path.read_text(encoding='utf-8'))
scenes = plan.get('scenes') or []
fps = float(plan.get('fps') or 30)
if not scenes:
    raise SystemExit('V8 contact sheet failed: plan has no scenes.')
if not video_path.exists():
    raise SystemExit(f'V8 contact sheet failed: video missing at {video_path}.')

# Sample each scene after its entrance animation and before its exit transition.
frames = []
for scene in scenes:
    start = float(scene.get('start') or 0)
    duration = float(scene.get('duration') or 0)
    sample_time = start + duration * 0.57
    frames.append(max(0, round(sample_time * fps)))

rows = (len(frames) + columns - 1) // columns
select_expression = '+'.join(f'eq(n\\,{frame})' for frame in frames)
filter_graph = (
    f"select='{select_expression}',"
    f"setpts=N/FRAME_RATE/TB,"
    f"scale=300:-1:flags=lanczos,"
    f"drawbox=x=0:y=0:w=iw:h=ih:color=white@0.16:t=2,"
    f"tile={columns}x{rows}:padding=8:margin=8:color=0x080b10"
)
output_path.parent.mkdir(parents=True, exist_ok=True)
command = [
    'ffmpeg', '-y', '-i', str(video_path),
    '-vf', filter_graph,
    '-frames:v', '1', '-q:v', '2', str(output_path),
]
run = subprocess.run(command, text=True, capture_output=True)
if run.returncode != 0:
    raise SystemExit(f'V8 contact sheet failed:\n{run.stderr[-3000:]}')
print(f'V8 midpoint contact sheet ready: scenes={len(scenes)}, frames={frames}, output={output_path}')
