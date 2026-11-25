FROM node:26-alpine AS development

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]

# ---------- Compilación del bundle estático ----------
# La URL de la API se fija en el build (Vite la incrusta en el JS). En
# producción es relativa al mismo origen: el servidor web reenvía /api/* al
# backend. Para otra URL: --build-arg VITE_API_URL=https://api.ejemplo.org/api/v1
FROM development AS build
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm run build

# ---------- Producción: Caddy sin root, solo estáticos + proxy a la API ----------
# Etiqueta y digest fijados; para actualizar, cambiar ambos.
FROM caddy:2.11.9-alpine@sha256:003a97808e781aa9f7e75cc2f43d34d461099031faf5e20faefb9f61126836f0 AS production
COPY --chown=65532:65532 Caddyfile /etc/caddy/Caddyfile
COPY --from=build --chown=65532:65532 /app/dist /srv
# /data (certificados) y /config son volúmenes: deben ser del usuario sin privilegios.
RUN mkdir -p /data/caddy /config/caddy     && chown -R 65532:65532 /data /config
USER 65532:65532
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3     CMD ["wget", "-q", "--spider", "http://127.0.0.1:8081/healthz"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
