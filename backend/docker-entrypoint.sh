#!/bin/sh
# Entrypoint de producción: migraciones y arranque. No ejecuta la semilla.
set -eu
./node_modules/.bin/prisma migrate deploy
exec node dist/main
