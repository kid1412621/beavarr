# Unified Base Stage
FROM oven/bun:alpine AS base
WORKDIR /app

# Copy package files (Done once for all stages)
COPY package.json bun.lock ./
COPY client/package.json ./client/
COPY server/package.json ./server/
COPY shared/package.json ./shared/

# Remove postinstall scripts to prevent premature build failures
RUN sed -i '/"postinstall":/d' package.json


# Client Build Stage
FROM base AS build-client
# Install ALL dependencies (for turbo & vite)
RUN bun install --frozen-lockfile
# Copy source code
COPY . .
# Run client build using package.json script
RUN bun run build:client


# Server Build Stage
FROM base AS build-server
# Install ALL dependencies (for turbo & tsc)
RUN bun install --frozen-lockfile
# Copy source code
COPY . .
# Run server build using package.json script
RUN bun run build:server


# Release Stage
FROM base AS release
# Install ONLY production dependencies for SERVER workspace
# This ignores client dependencies (React, etc)
RUN bun install --production --frozen-lockfile --filter server

# Copy artifacts from build-server
COPY --from=build-server /app/shared/dist ./shared/dist
COPY --from=build-server /app/shared/package.json ./shared/package.json

COPY --from=build-server /app/server/dist ./server/dist
COPY --from=build-server /app/server/package.json ./server/package.json

# Copy artifacts from build-client (static assets)
# Replicating "copy:static": cp -r client/dist server/static
COPY --from=build-client /app/client/dist ./server/static

# Copy root package.json
COPY --from=base /app/package.json .

# Runtime environment
ENV NODE_ENV=production
ENV PORT=4242
EXPOSE 4242

CMD ["bun", "run", "start:single"]