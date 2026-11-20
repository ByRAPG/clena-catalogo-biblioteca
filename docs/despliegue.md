# Despliegue con URL pública (T-07)

Esta guía publica la Biblioteca en internet desde una sola máquina, con un túnel rápido de Cloudflare (opción A, la vigente). Al final se describe la opción B (Hugging Face Spaces + Neon), que queda como siguiente paso y no está implementada.

## Opción A: túnel rápido de Cloudflare

`cloudflared tunnel --url` abre una conexión de salida desde tu máquina hacia Cloudflare y recibe una dirección `https://<palabras>.trycloudflare.com`. No hay que abrir puertos ni tener cuenta, dominio ni tarjeta. El túnel va como un servicio más (`tunnel`) en `docker-compose.tunnel.yml`, que extiende `docker-compose.prod.yml`.

```
visitante --HTTPS--> Cloudflare --> cloudflared --HTTP--> web (Caddy) --> backend --> db
```

### Requisitos

- Docker con Compose v2.24 o superior (el override usa `!reset`).
- 2 GB de RAM libres para Docker (4 GB recomendados, sobre todo al compilar las imágenes y con la búsqueda semántica activa).
- Salida a internet desde la máquina (el túnel sale hacia Cloudflare por el puerto 7844).
- Git y OpenSSL (en Windows, Git Bash trae `openssl`).

### Variables (`.env.prod`)

Copia `.env.prod.example` a `.env.prod` (ignorado por git; nunca lo subas). Para el túnel:

| Variable | Valor | Nota |
|---|---|---|
| `SITE_ADDRESS` | `:80` | Caddy sirve HTTP; el HTTPS lo pone Cloudflare |
| `PUBLIC_WEB_URL` | `https://placeholder.trycloudflare.com` al inicio | Ver «Obtener la URL» |
| `POSTGRES_USER` / `POSTGRES_DB` | `clena` / `clena_catalogo` | Solo letras, números, guion y guion bajo |
| `POSTGRES_PASSWORD` | `openssl rand -hex 24` | Hexadecimal, para que la URL de conexión sea válida |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | `openssl rand -hex 32` (distintos) | Mínimo 32 caracteres |
| `SEMANTIC_SEARCH`, `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL_PATH`, `SEARCH_*` | `off`, `fake`, `/app/models`, `0.84`, `0.04`, `2` | Opcionales; con el modelo real: `SEMANTIC_SEARCH=on` y `EMBEDDING_PROVIDER=local` |

Generar los secretos (genera los tuyos; nunca copies valores de ejemplo):

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 32   # JWT_ACCESS_SECRET
openssl rand -hex 32   # JWT_REFRESH_SECRET
```

### Levantar

Linux o Git Bash:

```bash
cp .env.prod.example .env.prod   # rellena los valores
docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
```

Windows PowerShell:

```powershell
Copy-Item .env.prod.example .env.prod   # rellena los valores
docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
```

La primera vez compila las imágenes (unos 2 minutos en la prueba, más con poca CPU). Cuando `docker compose ... ps` muestre `backend` y `web` en `healthy`, el sitio está listo (unos 20 segundos tras arrancar; con el modelo de embeddings puede tardar más).

### Obtener la URL

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml logs tunnel
```

Busca la línea con `https://....trycloudflare.com`. En PowerShell: `... logs tunnel | Select-String trycloudflare`.

`PUBLIC_WEB_URL` solo afecta la base de los QR impresos y el origen CORS (el sitio usa el mismo origen, así que funciona aunque tenga el valor provisional). Para que los QR apunten a la URL real, ponla en `.env.prod` y vuelve a ejecutar `up -d` (solo recrea el backend). Como la URL cambia al reiniciar el túnel, no imprimas QR definitivos con ella.

### Crear el primer administrador

La semilla de demostración no corre en producción. Con el comando del PR #120 (los datos van por variables y la contraseña no se imprime):

```bash
read -rsp 'Contraseña del administrador (mínimo 12 caracteres): ' ADMIN_PASSWORD; echo
docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml exec \
  -e ADMIN_EMAIL=admin@tu-dominio.org -e ADMIN_PASSWORD \
  -e ADMIN_FULL_NAME='Nombre del administrador' \
  backend node dist/modules/iam/presentation/create-admin.cli.js
unset ADMIN_PASSWORD
```

En PowerShell 7: `$env:ADMIN_PASSWORD = Read-Host 'Contraseña' -MaskInput` antes del `exec` y `Remove-Item Env:ADMIN_PASSWORD` al terminar. El detalle del comando (códigos de salida, `ADMIN_PASSWORD_FILE`) está en el README del PR #120. Este paso requiere que ese PR esté fusionado.

### Parar, reiniciar y actualizar

```bash
# Parar (conserva los datos)
docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml down
# Actualizar el código
git pull
docker compose --env-file .env.prod -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
```

Al recrear el servicio `tunnel` la URL cambia. `down -v` borra también los volúmenes (la base de datos): úsalo solo para empezar de cero.

### Limitaciones

- El sitio solo está disponible mientras el PC esté encendido, con Docker e internet.
- La URL `trycloudflare.com` cambia cada vez que el túnel se reinicia (reinicio del PC, `down`/`up`, actualización).
- Sin SLA ni soporte: Cloudflare ofrece los túneles rápidos para pruebas y desarrollo. Tienen un límite de 200 peticiones simultáneas en vuelo y no admiten Server-Sent Events.
- No hay respaldo automático: copia la base con `pg_dump` si los datos importan.

### Seguridad

- **HTTPS**: termina en el borde de Cloudflare. El tramo cloudflared a Caddy es HTTP dentro de la red Docker del propio PC. La cookie de sesión es `Secure` (`NODE_ENV=production`) y funciona porque el navegador ve HTTPS.
- **Puertos**: el override libera los puertos 80 y 443 del anfitrión (`ports: !reset []`); la pila solo es alcanzable por el túnel.
- **IP real del visitante**: hay dos proxies (cloudflared y Caddy). Caddy solo cree `Cf-Connecting-IP` o `X-Forwarded-For` si la petición llega desde un rango privado (el contenedor de cloudflared) y envía al backend una única `X-Forwarded-For` con la IP real, que es la que lee `TRUST_PROXY=1`. Una petición directa desde una IP pública no puede falsear la cabecera. Verificado en la prueba: el backend recibió la IP pública del visitante, también con un `X-Forwarded-For` falso enviado por el cliente.
- **Contenedores**: `tunnel` corre como usuario no root, con sistema de archivos de solo lectura, sin capacidades y con `no-new-privileges`. `db` también es de solo lectura (tmpfs en `/var/run/postgresql` y `/tmp`) y conserva solo las capacidades que Postgres necesita.
- La imagen de `cloudflared` está fijada por digest; se actualiza a propósito (ver el comentario en `docker-compose.tunnel.yml`).

## Opción B (siguiente paso): Hugging Face Spaces + Neon

Alternativa gratuita que no depende del PC y da una URL estable (`https://<usuario>-<space>.hf.space`). No está implementada; esto es lo que habría que hacer.

1. **Base de datos en Neon** (plan gratuito): crear un proyecto con Postgres 16, ejecutar `CREATE EXTENSION IF NOT EXISTS vector;` (la migración de embeddings la necesita) y copiar la cadena de conexión. `DATABASE_URL` debe llevar `sslmode=require` (por ejemplo `...?schema=public&sslmode=require`). Neon suspende el cómputo por inactividad, así que la primera consulta puede tardar.
2. **Space de tipo Docker**: Hugging Face expone un solo puerto (por defecto 7860, `app_port` en el `README.md` del Space) y ejecuta el contenedor como usuario no root (UID 1000).
3. **Imagen combinada**: un único contenedor con Caddy (SPA y proxy de `/api/*`) en el puerto 7860 y el backend en `localhost:3000`, arrancados por un supervisor sencillo. Cambios: `reverse_proxy localhost:3000`, `SITE_ADDRESS=:7860`, escritura solo en `/tmp`, y el modelo de embeddings dentro de la imagen (`/app/models`).
4. **Secretos del Space** (Settings, Variables and secrets): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PUBLIC_WEB_URL`, `CORS_ORIGIN` y `TRUST_PROXY=1`. El primer administrador se crea ejecutando una vez `create-admin.cli.js` contra la base de Neon desde una máquina local.
5. **Límites**: el plan gratuito duerme el Space tras 48 horas sin visitas (se despierta con la siguiente, en uno o dos minutos) y no hay almacenamiento persistente local: todo va a Neon.
6. **Trabajo pendiente**: Dockerfile combinado, despliegue al Space desde GitHub Actions y migraciones que corran al arrancar o desde fuera.
