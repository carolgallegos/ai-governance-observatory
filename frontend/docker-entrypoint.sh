#!/bin/sh
set -e
cd /app

# Solo reinstalar si falta node_modules o cambió package.json (evita 1–2 min en cada restart)
if [ ! -d node_modules/next ] || [ ! -f node_modules/.deps-stamp ] || [ package.json -nt node_modules/.deps-stamp ]; then
  echo "Installing npm dependencies..."
  npm install --legacy-peer-deps
  touch node_modules/.deps-stamp
else
  echo "Dependencies OK — skipping npm install"
fi

exec npm run dev
