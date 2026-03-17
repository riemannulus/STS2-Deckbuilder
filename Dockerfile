# Stage 1: Install dependencies
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Stage 2: Production
FROM oven/bun:1-slim
WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy app code + dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY index.ts package.json tsconfig.json ./
COPY scripts/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Data volume: DB + downloaded images persist here
VOLUME ["/app/data"]

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/graphql?query=%7B__typename%7D || exit 1

ENTRYPOINT ["./entrypoint.sh"]
