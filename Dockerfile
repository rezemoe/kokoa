FROM node:22-slim AS builder

WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM node:22-slim

WORKDIR /app

# Expose volume for PGlite database
VOLUME ["/app/data"]
ENV DATABASE_DIR="/app/data/pglite"
ENV NODE_ENV="production"
ENV PORT=3000

COPY --from=builder /app/.output /app/.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
