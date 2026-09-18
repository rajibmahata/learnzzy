# Learnzzy MCP — unified Docker image for tutor/oer/ncert.
# Multi-stage, non-root, healthcheck, minimal surface.
# Build: docker build -t learnzzy-mcp -f services/mcp/Dockerfile .
# Run with PROVIDER=tutor-mcp|oer-mcp|ncert-mcp and PORT.

FROM node:20-alpine AS base
WORKDIR /app

# Install deps (none beyond Node stdlib, but keep layer for future)
COPY package.json ./
RUN npm install --omit=dev 2>&1 | tail -n 20; echo "deps ok"; \
    addgroup -S appgroup && adduser -S appuser -G appgroup

COPY src ./src

# Data directory for persistent volumes (SQLite/JSON/Qdrant indexes)
RUN mkdir -p /data && chown -R appuser:appgroup /data /app

USER appuser
ENV NODE_ENV=production
EXPOSE 3001 3002 3003

# Healthcheck hits the provider-specific health endpoint; the server
# normalizes /health across all providers, so one check works for all.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3001}/health || exit 1

CMD ["node", "src/server.js"]
