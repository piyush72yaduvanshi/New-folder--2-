# ── Pravzo Unified Backend — Production Dockerfile ─────────────────────────
FROM node:20-alpine AS base

# Security: run as non-root
RUN addgroup -g 1001 -S pravzo && adduser -u 1001 -S pravzo -G pravzo

WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Production image ──────────────────────────────────────────────────────────
FROM base AS runner

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create logs directory with correct ownership
RUN mkdir -p logs && chown -R pravzo:pravzo /app

USER pravzo

EXPOSE 5000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
