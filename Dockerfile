FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
# Copy prisma schema so we can generate the client here and cache it
COPY prisma ./prisma
RUN npm ci && npx prisma generate

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

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set permissions for the prisma sqlite database directory if mounted
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
# Copy the local dev.db into the image so the sqlite tables exist!
COPY --chown=nextjs:nodejs dev.db /app/data/dev.db

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Because we are using an sqlite database and Prisma libSql, ensure any generated prisma engine is copied
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma/
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma/

USER nextjs

EXPOSE 3000

ENV PORT=3000
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"

ENV DATABASE_URL="file:/app/data/dev.db"

# Note: Supply a DATABASE_URL env var during deployment like DATABASE_URL="file:/app/data/prod.db"
# And run migrations or push db structure before starting the server.
CMD ["node", "server.js"]
