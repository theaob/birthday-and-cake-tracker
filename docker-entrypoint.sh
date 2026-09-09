#!/bin/sh
set -e

# Apply any pending Prisma migrations against the mounted database before
# starting the server. DATABASE_URL defaults to the volume-mounted sqlite
# file set in the Dockerfile; override it at deploy time if needed.
npx prisma migrate deploy --schema=./prisma/schema.prisma

exec node server.js
