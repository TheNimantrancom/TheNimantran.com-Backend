FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

FROM node:20-slim AS runner

WORKDIR /app

RUN groupadd -r nodegroup && useradd -r -g nodegroup nodeuser
USER nodeuser

COPY --from=builder /app /app

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "-r", "dotenv/config", "--experimental-json-modules", "src/index.js"]
