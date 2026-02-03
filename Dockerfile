FROM oven/bun:alpine AS base
WORKDIR /app

# --- Step 1: Install All Dependencies ---
FROM base AS deps
COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install all dependencies
RUN bun install --frozen-lockfile --ignore-scripts


# --- Step 2: Build Stage ---
FROM deps AS builder
COPY tsconfig.json turbo.json ./

# Turbo will automatically build shared, server, and client in the correct order
COPY shared/ ./shared/
COPY server/ ./server/
COPY client/ ./client/
RUN bun run build


# --- Step 3: Final Runtime Image ---
FROM oven/bun:alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4242

# Create a non-root user
RUN addgroup -S app && adduser -S -G app app

# Copy artifacts from builder
COPY --from=builder /app/server/dist/index.js ./server/dist/index.js
COPY --from=builder /app/server/drizzle ./server/drizzle
COPY --from=builder /app/client/dist ./server/static

# System utilities and hardening
RUN chown -R app:app /app

USER app
LABEL org.opencontainers.image.title="beavarr"
LABEL org.opencontainers.image.version="0.1.0"
LABEL org.opencontainers.image.description="LLM armed *arr stack watch experience"
LABEL org.opencontainers.image.source="https://github.com/kid1412621/beavarr"
LABEL org.opencontainers.image.licenses="MIT"

EXPOSE 4242

# Start the server
WORKDIR /app/server
CMD ["bun", "dist/index.js"]