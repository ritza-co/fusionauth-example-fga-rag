#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

echo "==> [1/3] Writing Permify schema..."
if node ./scripts/permify-write-schema.js; then
  echo "✅ Permify schema successfully written."
else
  echo "❌ Failed to write Permify schema." >&2
  exit 1
fi

echo "==> [2/3] Uploading sample documents and setting owner relationships..."
if node ./scripts/upload-sample-docs.js; then
  echo "✅ Sample documents uploaded and ownership set."
else
  echo "❌ Failed to upload sample documents." >&2
  exit 1
fi

echo "==> [3/3] Writing all relationships (org memberships, doc ownership, viewer grants)..."
if node ./scripts/permify-write-relationships.js; then
  echo "✅ All relationships written successfully."
else
  echo "❌ Failed to write relationships." >&2
  exit 1
fi

echo "Database seed complete!"