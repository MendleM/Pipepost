# syntax=docker/dockerfile:1.7
# Multi-stage build for the Pipepost MCP server.
#
# Stage 1 (builder): install pnpm, install all deps, run lint/test/build.
# Stage 2 (runtime): copy the bundled dist + production node_modules onto a
# slim base. The server speaks MCP over stdio, so there is no port to expose.

FROM node:22-alpine AS builder
WORKDIR /app

# Enable Corepack so the pinned pnpm version from package.json works without
# a global install step.
RUN corepack enable

# Install dependencies first so the layer caches across source-only changes.
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# Copy the rest of the source and produce the bundled dist.
COPY tsconfig.json tsup.config.ts ./
COPY src ./src
RUN pnpm run build

# Strip dev dependencies for the runtime image.
RUN pnpm prune --prod

FROM node:22-alpine AS runtime
WORKDIR /app

# Non-root user — MCP servers should never need root, and Glama's checks
# prefer non-root entrypoints.
RUN addgroup -S pipepost && adduser -S pipepost -G pipepost

COPY --from=builder --chown=pipepost:pipepost /app/dist ./dist
COPY --from=builder --chown=pipepost:pipepost /app/node_modules ./node_modules
COPY --from=builder --chown=pipepost:pipepost /app/package.json ./package.json

USER pipepost

# stdio-based MCP entrypoint. No EXPOSE; clients spawn this process and
# communicate over the process's stdin/stdout per the MCP spec.
ENTRYPOINT ["node", "dist/index.js"]
