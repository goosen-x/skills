#!/usr/bin/env bash
# bash new-project.sh <target-dir>  — copies the template and installs dependencies
set -euo pipefail
target="${1:?usage: bash new-project.sh <target-dir>}"
here="$(cd "$(dirname "$0")/.." && pwd)"
if [ -e "$target" ] && [ -n "$(ls -A "$target" 2>/dev/null)" ]; then
  echo "refusing: $target exists and is not empty" >&2; exit 1
fi
mkdir -p "$target"
cp -R "$here/template/." "$target/"
mkdir -p "$target/assets/audio" "$target/refs" "$target/out"
cd "$target"
npm install --silent
npx playwright install chromium >/dev/null
command -v ffmpeg >/dev/null || echo "warning: ffmpeg not found (brew install ffmpeg)" >&2
echo "ready: $target  (npm run preview → http://localhost:5173)"
