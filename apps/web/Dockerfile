# syntax=docker/dockerfile:1

# Dev image for the Vite/React SPA. Same whole-workspace install as the API image
# (@jailu/web also reads @jailu/shared as source). In dev, compose bind-mounts src and
# injects env; Vite binds 0.0.0.0 and proxies /api to the api service. No Caddy here —
# the static production build behind a Caddy edge belongs to the deploy slice (ADR-0002).
FROM node:24-alpine

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 5173
CMD ["pnpm", "--filter", "@jailu/web", "dev"]
