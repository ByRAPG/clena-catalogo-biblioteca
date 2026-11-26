# Imagen única para Google Cloud Run (u otro servicio de un solo contenedor):
# API (NestJS) + SPA (Caddy), sin root (uid 1000), escucha en $PORT (8080).
# Se construye desde la raíz del repo:
#   docker build -f deploy/cloud-run/Dockerfile -t busca-facil .
# Etapas equivalentes a backend/Dockerfile y frontend/Dockerfile (mismas
# imágenes base y el mismo modelo con SHA-256 verificado).
ARG NODE_IMAGE=node:26.13.1-bookworm-slim@sha256:0042e17d232a87a2cd485be1da7900fca4d10a4ad11b29e9285da1d2e54798c9
ARG CADDY_IMAGE=caddy:2.11.9-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0

FROM ${NODE_IMAGE} AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Node 25+ ya no incluye corepack: pnpm se instala con la versión de packageManager.
RUN npm install -g pnpm@12.18.0
WORKDIR /app

# ---------- API: compilación ----------
FROM base AS build
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
COPY backend/prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY backend/ .
RUN pnpm run build

# ---------- API: dependencias de producción ----------
FROM base AS prod-deps
ENV NODE_ENV=production
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
COPY backend/prisma ./prisma
RUN pnpm install --prod --frozen-lockfile && pnpm store prune

# ---------- Modelo de embeddings (revisión y SHA-256 fijados) ----------
FROM ${NODE_IMAGE} AS model
WORKDIR /fetch
COPY backend/scripts/fetch-embedding-model.mjs ./
RUN node fetch-embedding-model.mjs /models

# ---------- Frontend: bundle estático ----------
FROM node:26-alpine AS web-build
# Node 25+ ya no incluye corepack: pnpm se instala con la versión de packageManager.
RUN npm install -g pnpm@12.18.0
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ .
ENV VITE_API_URL=/api/v1
RUN pnpm run build

FROM ${CADDY_IMAGE} AS caddy

# ---------- Final: Node + Caddy, sin root ----------
FROM ${NODE_IMAGE} AS production
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=caddy /usr/bin/caddy /usr/local/bin/caddy
ENV NODE_ENV=production \
    PORT=8080 \
    HOME=/tmp \
    XDG_DATA_HOME=/tmp/caddy-data \
    XDG_CONFIG_HOME=/tmp/caddy-config
WORKDIR /app
COPY --from=prod-deps --chown=1000:1000 /app/node_modules ./node_modules
COPY --from=build --chown=1000:1000 /app/dist ./dist
COPY --from=model --chown=1000:1000 /models ./models
COPY --chown=1000:1000 backend/prisma ./prisma
COPY --chown=1000:1000 backend/package.json ./
COPY --from=web-build --chown=1000:1000 /app/dist /srv
COPY --chown=1000:1000 deploy/cloud-run/Caddyfile /etc/caddy/Caddyfile
COPY --chown=1000:1000 deploy/cloud-run/start.sh /app/start.sh
RUN chmod 0555 /app/start.sh
USER 1000
EXPOSE 8080
CMD ["/app/start.sh"]
