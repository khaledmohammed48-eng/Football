# ── Stage 1: Install & Build ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy everything first so workspace symlinks resolve correctly
COPY . .

# Install and build
RUN npm install

# Dummy build-time env vars so next build doesn't crash on missing secrets
ENV NEXTAUTH_SECRET=build-placeholder
ENV DATABASE_URL=file:/tmp/build.db
ENV NEXTAUTH_URL=http://localhost:3000

RUN cd apps/web && npx prisma generate
# Create the build-time SQLite schema so Prisma queries don't fail during pre-rendering
RUN cd apps/web && npx prisma migrate deploy
RUN cd apps/web && npm run build

# ── Stage 2: Lean production image ────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/packages/ packages/
COPY --from=builder /app/apps/web/package*.json apps/web/
COPY --from=builder /app/apps/web/node_modules apps/web/node_modules/
COPY --from=builder /app/apps/web/.next apps/web/.next/
COPY --from=builder /app/apps/web/public apps/web/public/
COPY --from=builder /app/apps/web/prisma apps/web/prisma/
COPY --from=builder /app/apps/web/startup.sh apps/web/startup.sh

RUN chmod +x apps/web/startup.sh

# SQLite data lives in a Railway volume mounted at /data
RUN mkdir -p /data

EXPOSE 3000

WORKDIR /app/apps/web
CMD ["./startup.sh"]
