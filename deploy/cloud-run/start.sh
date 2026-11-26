#!/bin/bash
# Arranque de la imagen única: aplica migraciones, levanta la API en
# 127.0.0.1:3000 y Caddy en $PORT (lo fija Cloud Run; 8080 por defecto).
# Si cualquiera de los dos termina, el contenedor sale y la plataforma lo reinicia.
set -u
export WEB_PORT="${PORT:-8080}"
export PORT=3000
./node_modules/.bin/prisma migrate deploy || exit 1
node dist/main &
API=$!
caddy run --config /etc/caddy/Caddyfile --adapter caddyfile &
WEB=$!
# Al recibir SIGTERM (Cloud Run para la instancia) se avisa a los dos procesos
# y se espera a que terminen las peticiones en curso antes de salir.
trap 'kill -TERM $API $WEB 2>/dev/null; wait; exit 0' TERM INT
wait -n
code=$?
kill -TERM $API $WEB 2>/dev/null
wait
exit $code
