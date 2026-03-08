# ── Stage 1: Install & Build ──────────────────────────────
# Bullseye has OpenSSL 1.1 — what Prisma's auto-detection expects
FROM node:20-bullseye-slim AS builder
WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm install

ENV NEXTAUTH_SECRET=build-placeholder
ENV DATABASE_URL=file:/tmp/build.db
ENV NEXTAUTH_URL=http://localhost:3000

RUN cd apps/web && npx prisma generate
RUN cd apps/web && npm run build

# ── Stage 2: Lean production image ────────────────────────
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

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
RUN mkdir -p /data

EXPOSE 3000
WORKDIR /app/apps/web
CMD ["./startup.sh"]
