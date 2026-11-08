FROM node:22-alpine AS development

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "pnpm run prisma:migrate:deploy && pnpm run prisma:seed && pnpm run start:dev"]

FROM development AS build

RUN pnpm run build
