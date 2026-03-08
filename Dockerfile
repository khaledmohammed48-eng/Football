# ── Stage 1: Install & Build ──────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app

# Prisma needs OpenSSL at build time
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy everything first so workspace symlinks resolve correctly
COPY . .

# Install dependencies
RUN npm install

# Dummy build-time env vars so next build doesn't crash on missing secrets
ENV NEXTAUTH_SECRET=build-placeholder
ENV DATABASE_URL=file:/tmp/build.db
ENV NEXTAUTH_URL=http://localhost:3000

# prisma generate only produces JS/TS client — no native binary execution needed
RUN cd apps/web && npx prisma generate

# Build Next.js (prisma migrate runs at runtime via startup.sh, not here)
RUN cd apps/web && npm run build

# ── Stage 2: Lean production image ────────────────────────
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Prisma needs OpenSSL at runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
