# ─────────────────────────────────────────────
#  Stage 1 — Build the React application
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

LABEL stage="builder"

WORKDIR /app

# Copy manifests for dependency caching
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
#  Stage 2 — Serve with Nginx (pulled from Hub)
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

LABEL maintainer="QuizMaster Team"
LABEL description="QuizMaster UI — React frontend served by Nginx"

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built React app from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config with API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
