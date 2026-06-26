#!/usr/bin/env bash
# Headless asset pipeline. Runs each Python builder in Blender, then runs
# every raw .glb through gltf-transform. Output lands in static/models/
# where SvelteKit serves it.

set -euo pipefail

cd "$(dirname "$0")/../.."

RAW_DIR="assets/raw"
OUT_DIR="static/models"
mkdir -p "$RAW_DIR" "$OUT_DIR"

echo "→ building from Blender"
for script in assets/scripts/*.py; do
  name="$(basename "$script" .py)"
  echo "  · $name"
  blender --background --python "$script" >/dev/null
done

echo "→ compressing with gltf-transform"
shopt -s nullglob
for raw in "$RAW_DIR"/*.glb; do
  name="$(basename "$raw" .glb)"
  out="$OUT_DIR/$name.glb"
  bunx gltf-transform optimize "$raw" "$out" \
    --texture-compress webp \
    --simplify false \
    >/dev/null
  size_in=$(stat -f%z "$raw" 2>/dev/null || stat -c%s "$raw")
  size_out=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
  printf "  · %-20s %8d → %8d bytes\n" "$name.glb" "$size_in" "$size_out"
done

echo "done."
