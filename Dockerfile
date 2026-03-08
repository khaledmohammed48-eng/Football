# ── Stage 1: Install & Build ──────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy everything first so workspace symlinks resolve correctly
COPY . .

# Install, dedupe to guarantee single React instance, then build
RUN npm install --prefer-dedupe
RUN cd apps/web && npx prisma generate
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
