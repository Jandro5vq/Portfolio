#!/usr/bin/env bash
# Publica la web en avq5.dev: sube los archivos, reconstruye los contenedores "portfolio" (web)
# y "portfolio-contador" (API del contador) y los reinicia. La cuenta vive en un volumen y no se pierde.
# Uso (desde la raíz del proyecto):  bash deploy/deploy.sh
# La versión anterior queda en /docker/portfolio.prev por si hay que volver atrás.
set -euo pipefail

HOST="${DEPLOY_HOST:-root@avq5.dev}"
DIR=/docker/portfolio
cd "$(dirname "$0")/.."

echo "→ Escribiendo la versión clásica y los metadatos en index.html…"
node tools/prerender.js

echo "→ Empaquetando y subiendo a $HOST…"
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT
mkdir -p "$STAGE/site"
cp -r index.html css js img robots.txt llms*.txt para-agentes "$STAGE/site/"
cp deploy/Dockerfile deploy/nginx.conf deploy/docker-compose.yml "$STAGE/"
cp -r server "$STAGE/server"
tar -C "$STAGE" -czf - . | ssh "$HOST" "rm -rf $DIR.new && mkdir -p $DIR.new && tar -xzf - -C $DIR.new"

echo "→ Construyendo y cambiando de versión…"
ssh "$HOST" "set -e
  cd $DIR.new && docker compose -p portfolio build
  rm -rf $DIR.prev
  if [ -d $DIR ]; then mv $DIR $DIR.prev; fi
  mv $DIR.new $DIR
  cd $DIR && docker compose -p portfolio up -d"

echo "✓ Publicado en https://avq5.dev"
