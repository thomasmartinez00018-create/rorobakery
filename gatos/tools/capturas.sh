#!/bin/bash
# Saca la hoja de revisión de cada mapa con Chrome headless.
# Uso: bash gatos/tools/capturas.sh [carpeta-salida] [mapa ...]
# Levanta un servidor local en gatos/ (puerto 8781) y deja mapa-<id>.png en la carpeta de salida.
set -e
DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$DIR/tools/out}"; shift || true
MAPS="${*:-plaza estacion feria bielli cancha tortugas terrazas abuela roros}"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=8781
mkdir -p "$OUT"
(cd "$DIR" && python3 -m http.server $PORT >/dev/null 2>&1) & SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
for m in $MAPS; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=2048,1064 \
    --virtual-time-budget=8000 --screenshot="$OUT/mapa-$m.png" "http://127.0.0.1:$PORT/tools/mapas.html?map=$m" >/dev/null 2>&1
  T=$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=8000 --dump-dom "http://127.0.0.1:$PORT/tools/mapas.html?map=$m" 2>/dev/null | grep -o '<title>[^<]*' | sed 's/<title>//')
  echo "$m: $T"
done
