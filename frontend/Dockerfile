# Pin the runtime instead of using the moving node:22-alpine tag. The Debian
# image also avoids intermittent npm lifecycle failures observed on Alpine.
ARG NODE_IMAGE=node:22.14.0-bookworm-slim
ARG NPM_VERSION=11.4.2

# Stage 1: Install dependencies
FROM ${NODE_IMAGE} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 300000 \
    && npm config set maxsockets 4 \
    && npm install --global npm@${NPM_VERSION} --no-audit --no-fund \
    && npm ci --no-audit --no-fund --prefer-offline

# Stage 2: Build the source code
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The browser calls the frontend's same-origin /api path. Next.js proxies it
# to this backend URL, so the HttpOnly session cookie stays first-party.
ARG BACKEND_URL=http://backend:8000
ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Stage 3: Production runner
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public

# Leverage standalone output to drastically minimize image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
