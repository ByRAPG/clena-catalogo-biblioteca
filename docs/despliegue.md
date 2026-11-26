# Despliegue con URL pública (T-07)

Esta guía publica la Biblioteca en internet de dos formas: con Google Cloud Run + Neon (opción B, la de la entrega, con URL fija y sin depender de ningún equipo) o, de respaldo, con un túnel rápido de Cloudflare desde un equipo propio (opción A).

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

## Opción B: Google Cloud Run + Neon (URL fija)

- **URL publicada:** https://buscafacil.lzayrox.dev/
- **Salud de la API:** https://buscafacil.lzayrox.dev/api/v1/health

Una sola imagen con la API y la web (`deploy/cloud-run/`), en Cloud Run, con la base de datos en Neon (Postgres administrado con pgvector). No depende de ningún PC y da una URL fija (dominio personalizado sobre el servicio `busca-facil` en `us-east5`, o la dirección por defecto `https://<servicio>-<hash>.<región>.run.app`). La opción A queda como respaldo.

Se descartó Hugging Face Spaces: desde noviembre de 2026 los Spaces de Docker en CPU gratuita exigen suscripción PRO.

### Imagen

- `deploy/cloud-run/Dockerfile`: mismas etapas e imágenes base (fijadas por digest) que `backend/Dockerfile` y `frontend/Dockerfile`, y el binario de Caddy copiado de la imagen oficial. Corre sin root (uid 1000) y solo escribe en `/tmp`.
- `deploy/cloud-run/start.sh`: aplica `prisma migrate deploy`, arranca la API en `127.0.0.1:3000` y Caddy en `$PORT` (8080). Si uno de los dos se cae, el contenedor sale y Cloud Run lo reinicia.
- `deploy/cloud-run/Caddyfile`: igual que `frontend/Caddyfile` (CSP, cabeceras, límite de 2 MB), con HTTP en `$PORT` (el TLS lo pone Google). La IP real se lee de `X-Forwarded-For` de derecha a izquierda (`trusted_proxies_strict`), confiando solo en los rangos privados y en `169.254.0.0/16`.

Prueba local (desde la raíz del repo):

```bash
docker build -f deploy/cloud-run/Dockerfile -t busca-facil .
docker run --rm -p 8080:8080 -e PORT=8080 --env-file cloud-run.env.local busca-facil   # *.local nunca se sube (está en .gitignore)
```

### Base de datos (Neon)

1. Proyecto con Postgres 16 o superior en la región más cercana a la de Cloud Run (Neon `aws-us-east-2`, Ohio, queda junto a `us-east5`, Columbus). Copiar la cadena **directa** (sin `-pooler`), con `sslmode=require`.
2. Desde un PC con el repo: `DATABASE_URL=<cadena> pnpm run prisma:migrate:deploy`, después `pnpm run prisma:seed` (datos ficticios), `pnpm run iam:create-admin` y `pnpm run search:reindex`, todo en `backend/`. Las migraciones también corren al arrancar el contenedor (`prisma migrate deploy` toma un bloqueo en la base: con la cadena directa, dos arranques a la vez no chocan).

### Variables del servicio

`DATABASE_URL`, `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET` (aleatorios, de 32 caracteres o más) van como secretos (Secret Manager). El resto son variables normales: `NODE_ENV=production`, `TRUST_PROXY=1`, `CORS_ORIGIN` y `PUBLIC_WEB_URL` (la URL `https://...run.app` del servicio), `SEMANTIC_SEARCH=on`, `EMBEDDING_PROVIDER=local`, `EMBEDDING_MODEL_PATH=/app/models`, `SEARCH_MIN_SIMILARITY=0.84`, `SEARCH_RELATIVE_CUTOFF=0.04` y `SEARCH_LEXICAL_WEIGHT=2`. `PORT` lo fija Cloud Run.

### Desplegar

En Cloud Shell (ya trae `gcloud`, `docker`, `git` y `openssl`), desde la raíz del repo clonado:

```bash
PROJECT=$(gcloud config get-value project)
PN=$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')
SA="serviceAccount:${PN}-compute@developer.gserviceaccount.com"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com secretmanager.googleapis.com
gcloud artifacts repositories create busca-facil --repository-format=docker --location=us-east5

# Secretos: el valor nunca va al repo ni queda en pantalla o en el historial.
read -rs DB && printf '%s' "$DB" | gcloud secrets create database-url --data-file=- && unset DB
openssl rand -hex 48 | tr -d '\n' | gcloud secrets create jwt-access --data-file=-
openssl rand -hex 48 | tr -d '\n' | gcloud secrets create jwt-refresh --data-file=-
# Cloud Run (cuenta de servicio por defecto) solo puede leer estos tres secretos.
for s in database-url jwt-access jwt-refresh; do
  gcloud secrets add-iam-policy-binding "$s" --member="$SA" --role=roles/secretmanager.secretAccessor
done

# Imagen (unos 10 minutos: compila y descarga el modelo verificando su SHA-256).
gcloud builds submit --region=us-east5 --config=deploy/cloud-run/cloudbuild.yaml .

gcloud run deploy busca-facil \
  --image="us-east5-docker.pkg.dev/${PROJECT}/busca-facil/app:latest" \
  --region=us-east5 --allow-unauthenticated --port=8080 \
  --memory=2Gi --cpu=1 --min-instances=0 --max-instances=1 --timeout=60 \
  --startup-probe=httpGet.path=/api/v1/health,httpGet.port=8080,periodSeconds=5,timeoutSeconds=3,failureThreshold=36 \
  --set-secrets=DATABASE_URL=database-url:latest,JWT_ACCESS_SECRET=jwt-access:latest,JWT_REFRESH_SECRET=jwt-refresh:latest \
  --set-env-vars=NODE_ENV=production,TRUST_PROXY=1,SEMANTIC_SEARCH=on,EMBEDDING_PROVIDER=local,EMBEDDING_MODEL_PATH=/app/models,SEARCH_MIN_SIMILARITY=0.84,SEARCH_RELATIVE_CUTOFF=0.04,SEARCH_LEXICAL_WEIGHT=2

# Con la URL que devuelve el despliegue anterior:
URL=$(gcloud run services describe busca-facil --region=us-east5 --format='value(status.url)')
gcloud run services update busca-facil --region=us-east5 \
  --update-env-vars=CORS_ORIGIN=$URL,PUBLIC_WEB_URL=$URL
```

- `--max-instances=1`: el límite de peticiones por IP vive en la memoria del proceso; con varias instancias cada una tendría el suyo.
- `--startup-probe`: Cloud Run no envía visitas hasta que la API responde (tras migrar y cargar el modelo), en vez de devolver 502 mientras arranca. Si la versión de `gcloud` no reconoce la opción, se quita esa línea y el servicio funciona igual (solo puede dar 502 unos segundos al arrancar).
- Cada build deja la imagen con dos etiquetas, `latest` y el id del build: para volver a una versión anterior, `gcloud run deploy busca-facil --region=us-east5 --image=.../app:<id>`.
- Para actualizar tras un cambio en `main`: `git pull`, `gcloud builds submit ...` y `gcloud run deploy busca-facil --region=us-east5 --image=.../app:latest`.

### Comprobar

- `<url>/api/v1/health` responde `status: ok`, `database: up` y `semanticModel: ready`.
- La portada abre, una búsqueda por significado devuelve resultados y el administrador inicia sesión (cookie `HttpOnly; Secure; SameSite=Strict`).
- En los registros de Cloud Run, la IP de las peticiones es la del visitante, no una `169.254.x.x`.

### Costo

Con `--min-instances=0`, 2 GiB y pocas visitas, el gasto es de centavos al día y sale de los créditos de Google Cloud. Conviene crear una alerta de presupuesto (Facturación, Presupuestos y alertas) de 10 USD.

### Límites

- Con `--min-instances=0` el servicio se apaga sin visitas y el primer acceso tarda unos segundos (carga del modelo). Para la presentación, `--min-instances=1` durante ese día y volver a 0 después, para no gastar crédito.
- Neon gratuito suspende el cómputo por inactividad: la primera consulta tarda un poco más.
- `2Gi` de memoria: el modelo de embeddings necesita unos 350 MB más que la API sola.
