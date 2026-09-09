FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
# Copy prisma schema so we can generate the client here and cache it
COPY prisma ./prisma
RUN npm ci && npx prisma generate

# Production-only dependencies, kept in a separate stage so the runner
# image doesn't carry devDependencies (eslint, typescript, ...).
# `prisma` is a regular dependency (not dev) because the container needs
# the CLI at start-up to run `prisma migrate deploy`.
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
# Copy only the necessary files for building to maximize cache hits
COPY src ./src
COPY public ./public
COPY next.config.ts .
COPY tsconfig.json .
COPY package.json .
COPY prisma ./prisma

# Next.js disables telemetry locally, but just in case
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# The sqlite database lives on a mounted volume, not baked into the
# image. It's created and migrated by docker-entrypoint.sh on start.
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Bring in production-only node_modules first (this is where the Prisma
# CLI + engines used by docker-entrypoint.sh come from). The standalone
# copy below overwrites the `next`/`@next` entries with the smaller,
# output-traced versions Next.js actually needs at runtime.
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma schema + migrations, needed at start-up to run migrate deploy
COPY --chown=nextjs:nodejs prisma ./prisma
COPY --chown=nextjs:nodejs prisma.config.ts ./
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# Points at the mounted volume created above; override at deploy time to
# use a different path or a non-sqlite database.
ENV DATABASE_URL="file:/app/data/prod.db"

# Mount a volume at /app/data to persist the sqlite database across
# restarts/upgrades. Pending migrations are applied automatically before
# the server starts (see docker-entrypoint.sh).
ENTRYPOINT ["./docker-entrypoint.sh"]
