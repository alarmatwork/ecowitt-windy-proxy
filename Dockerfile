# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile – EcoWitt → Windy Proxy
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: install production dependencies only
FROM node:20-alpine AS deps
WORKDIR /build
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: final image
FROM node:20-alpine AS runtime
LABEL maintainer="you@example.com"
LABEL description="EcoWitt weather station → Windy virtual PWS proxy"

WORKDIR /app

# Copy production deps from stage 1
COPY --from=deps /build/node_modules ./node_modules

# Copy application source
COPY src/ ./src/
COPY package.json ./

# Create the data directory and give the node user write access
RUN mkdir -p /app/data && chown -R node:node /app/data

# Expose the listener port
EXPOSE 8888

# Drop privileges for security
USER node

# Health check so orchestrators know when we're ready
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:8888/health || exit 1

ENV NODE_ENV=production \
    PORT=8888 \
    DATA_DIR=/app/data

CMD ["node", "src/server.js"]
