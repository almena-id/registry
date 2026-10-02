# syntax=docker/dockerfile:1

# ---- dependencies ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* variables are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_REGISTRY_WEB_URL=https://registry.almena.id
ARG NEXT_PUBLIC_REGISTRY_API_URL=https://api.almena.id
ENV NEXT_PUBLIC_REGISTRY_WEB_URL=$NEXT_PUBLIC_REGISTRY_WEB_URL \
    NEXT_PUBLIC_REGISTRY_API_URL=$NEXT_PUBLIC_REGISTRY_API_URL
# year.month.sequence, set by the image workflow; /health reports it.
ARG ALMENA_VERSION=dev
ENV ALMENA_VERSION=$ALMENA_VERSION
RUN npm run build

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ARG ALMENA_VERSION=dev
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    ALMENA_VERSION=$ALMENA_VERSION
RUN adduser --system --uid 10001 --no-create-home registry
COPY --from=build --chown=registry /app/.next/standalone ./
COPY --from=build --chown=registry /app/.next/static ./.next/static
COPY --from=build --chown=registry /app/public ./public
USER registry
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:3000/health"]

CMD ["node", "server.js"]
