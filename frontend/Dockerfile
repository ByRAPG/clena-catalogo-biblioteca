FROM node:22-alpine AS development

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]

FROM development AS build

RUN pnpm run build
