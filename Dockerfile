FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build


FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl libvips \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -r nodejs && useradd -r -g nodejs nodejs

COPY --from=builder /app/package.json /app/package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund \
 && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN chown -R nodejs:nodejs /app

USER nodejs

ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "-r", "dotenv/config", "dist/index.js"]