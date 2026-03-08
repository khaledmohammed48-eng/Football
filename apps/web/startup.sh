#!/bin/sh
set -e

echo "▶ Running database migrations..."
npx prisma migrate deploy

echo "▶ Seeding super admin..."
node prisma/seed-prod.js

echo "▶ Starting Next.js on port ${PORT:-3000}..."
exec npx next start -p "${PORT:-3000}"
