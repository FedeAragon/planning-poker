# syntax=docker/dockerfile:1.7
FROM node:22-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

RUN pnpm install --frozen-lockfile \
  --filter @planning-poker/server \
  --filter @planning-poker/shared

COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

RUN pnpm --filter @planning-poker/server exec prisma generate

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health > /dev/null || exit 1

CMD ["pnpm", "--filter", "@planning-poker/server", "exec", "tsx", "src/index.ts"]
