FROM oven/bun:1-debian AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY src/ ./src/
COPY drizzle.config.ts tsconfig.json ./

# Install Playwright OS dependencies (requires debian, alpine won't work)
RUN bunx playwright install --with-deps chromium

ENV NODE_ENV=production
EXPOSE 3001

CMD ["bun", "src/index.ts"]
