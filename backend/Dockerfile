# ─────────────────────────────────────────────
#  Stage 1 — Install dependencies
# ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first for better layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# ─────────────────────────────────────────────
#  Stage 2 — Production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner

LABEL maintainer="QuizMaster Team"
LABEL description="QuizMaster API — Node.js/Express backend"

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Own the directory as the non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

# Healthcheck — ping the /api/health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
