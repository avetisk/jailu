# syntax=docker/dockerfile:1

# Dev image for the Hono API. Node is pinned to the repo's 24 (.nvmrc / CI). The whole
# pnpm workspace is installed because @jailu/api consumes @jailu/shared as *source*
# (CLAUDE.md — path aliases: packages are read as .ts, never built). docker-compose
# bind-mounts src for hot reload and injects env, so there is no in-process .env loader.
FROM node:24-alpine

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

# Install against the manifests + lockfile only, so source edits don't bust this layer.
# Every workspace package.json must be present for --frozen-lockfile to match the lockfile.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

# App source (overlaid by compose bind mounts during dev).
COPY . .

EXPOSE 3000
CMD ["pnpm", "--filter", "@jailu/api", "dev"]
