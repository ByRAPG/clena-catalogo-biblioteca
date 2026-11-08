FROM node:lts-alpine

RUN npm install -g corepack && corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "pnpm run prisma:migrate:deploy && pnpm run start:dev"]
