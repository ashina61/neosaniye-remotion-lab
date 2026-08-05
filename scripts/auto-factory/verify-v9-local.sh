#!/usr/bin/env bash
set -euo pipefail

node --check scripts/auto-factory/v9-semantic-classifier.mjs
node --check scripts/auto-factory/lock-v9-spoken-families.mjs
node --check scripts/auto-factory/v9-ai-refinement-merge.mjs
node --check scripts/auto-factory/refine-v9-blueprints-with-ai.mjs
node --check scripts/auto-factory/run-v9-semantic-brain.mjs
node --check scripts/auto-factory/assert-v9-silk-road-proof.mjs
node scripts/auto-factory/test-v9-semantic-visual-brain.mjs
node scripts/auto-factory/test-v9-ai-refinement-merge.mjs
python3 -m py_compile scripts/auto-factory/qc-v9-semantic-blueprint.py

if [[ -d node_modules ]]; then
  npm run typecheck
fi

echo 'V9 local verification: PASS'
