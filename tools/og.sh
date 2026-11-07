#!/usr/bin/env bash
# Genera img/og.png (1200×630) a partir de tools/og.html con Edge o Chrome sin ventana.
# Uso: bash tools/og.sh
set -euo pipefail
cd "$(dirname "$0")/.."
BROWSER="${BROWSER:-}"
for b in "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" "/c/Program Files/Google/Chrome/Application/chrome.exe" "$(command -v chromium || true)" "$(command -v google-chrome || true)"; do
  if [ -z "$BROWSER" ] && [ -n "$b" ] && [ -x "$b" ]; then BROWSER="$b"; fi
done
[ -n "$BROWSER" ] || { echo "No encuentro Edge ni Chrome; indica la ruta con BROWSER=…"; exit 1; }
mkdir -p img
OUT="$(cd img && pwd -W 2>/dev/null || pwd)/og.png"
SRC="file:///$(cd tools && pwd -W 2>/dev/null || pwd)/og.html"
# perfil temporal: si el navegador ya está abierto, sin esto no genera la captura
PROFILE="$(mktemp -d)"
trap 'rm -rf "$PROFILE"' EXIT
PROFILE_W="$(cd "$PROFILE" && pwd -W 2>/dev/null || pwd)"
"$BROWSER" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --user-data-dir="$PROFILE_W" \
  --window-size=1200,630 --virtual-time-budget=4000 --screenshot="$OUT" "$SRC" >/dev/null 2>&1
[ -s img/og.png ] || { echo "No se generó img/og.png"; exit 1; }
echo "✓ img/og.png"
