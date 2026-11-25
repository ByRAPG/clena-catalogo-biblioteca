# Imagen base fijada por etiqueta y digest (Debian bookworm, glibc: necesario
# para ONNX Runtime más adelante). Para actualizarla, cambiar etiqueta y digest.
ARG NODE_IMAGE=node:26.13.1-bookworm-slim@sha256:0042e17d232a87a2cd485be1da7900fca4d10a4ad11b29e9285da1d2e54798c9

# ---------- Base común: OpenSSL (lo necesita Prisma en slim) y pnpm ----------
FROM ${NODE_IMAGE} AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# Node 25+ ya no incluye corepack: pnpm se instala con la versión de packageManager.
RUN npm install -g pnpm@12.18.0
WORKDIR /app

# ---------- Desarrollo (docker-compose.yml, target: development) ----------
FROM base AS development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "pnpm run prisma:migrate:deploy && pnpm run prisma:seed && pnpm run start:dev"]

# ---------- Compilación: dependencias completas + nest build ----------
FROM development AS build
RUN pnpm run build

# ---------- Dependencias solo de producción (postinstall corre prisma generate) ----------
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --prod --frozen-lockfile \
    && pnpm store prune

# ---------- Modelo de embeddings: revisión fijada y SHA-256 por archivo ----------
# Solo esta etapa usa la red; en ejecución el modelo se carga desde /app/models.
FROM ${NODE_IMAGE} AS model
WORKDIR /fetch
COPY scripts/fetch-embedding-model.mjs ./
RUN node fetch-embedding-model.mjs /models

# ---------- Producción: runtime mínima, sin root ----------
FROM ${NODE_IMAGE} AS production
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
# En ejecución no se instala nada: se quitan npm, npx, corepack y yarn de la
# imagen base (menos superficie de ataque y menos avisos de los escáneres).
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=model --chown=node:node /models ./models
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node package.json ./
COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 0555 docker-entrypoint.sh
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
# Aplica migraciones y arranca `node dist/main` como PID 1 (recibe SIGTERM).
ENTRYPOINT ["./docker-entrypoint.sh"]
