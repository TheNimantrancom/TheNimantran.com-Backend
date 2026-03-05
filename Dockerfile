FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update && apt-get install -y curl libvips-dev && rm -rf /var/lib/apt/lists/*

RUN groupadd -r nodegroup && useradd -r -g nodegroup nodeuser

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev --include=optional

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

RUN chown -R nodeuser:nodegroup /app

USER nodeuser

ENV NODE_ENV=production

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "-r", "dotenv/config", "dist/index.js"]