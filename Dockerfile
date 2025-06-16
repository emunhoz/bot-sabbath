FROM oven/bun:alpine AS base

# Install Playwright system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    font-noto \
    libstdc++ \
    dbus-x11 \
    ca-certificates

# Configure Playwright to use system Chromium
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_BROWSERS_PATH=0
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# ---------

FROM base AS deps

WORKDIR /app

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile

# No need to install browsers - we're using system Chromium

# ---------

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV BUN_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 app

RUN chown app:bunjs .

# Copy application code and install dependencies
COPY --chown=app:bunjs . .
COPY --from=deps /app/node_modules ./node_modules

USER app

EXPOSE 3333

ENV PORT=3333
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["bun", "run", "src/index.ts"]