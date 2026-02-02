FROM oven/bun:1.3.8-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Install dependencies
RUN bun install --frozen-lockfile --ignore-scripts

# Build Stage: full source copy and build
FROM base AS build
COPY . .

# Run the monorepo build which produces client/dist and server/dist
# build:single runs: bun run build && bun run copy:static && bun run build:server
RUN bun run build:single

# Prune dev dependencies for production
RUN bun install --production --frozen-lockfile --ignore-scripts

# Runtime Stage: minimal image with only runtime artifacts
FROM oven/bun:1.3.8-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4242

# Create a non-root user for runtime
RUN addgroup -S app && adduser -S -G app app

# Copy runtime artifacts from build stage
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/node_modules ./node_modules

# Position drizzle migrations where the code expects them (../../drizzle from server/dist/db)
COPY --from=build /app/server/drizzle ./server/drizzle

# Set up the server directory
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/static ./server/static

COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/shared/dist ./shared/dist

# Ensure the app user has permissions to the /app directory (for SQLite DB creation)
RUN chown -R app:app /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Hardening and metadata
USER app
LABEL org.opencontainers.image.source="https://github.com/kid1412621/beavarr"

# Healthcheck targeting the API
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/api/hello || exit 1

EXPOSE 4242

# Run from the server directory so ./static resolves correctly
WORKDIR /app/server
CMD ["bun", "dist/index.js"]