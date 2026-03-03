import { createClient, RedisClientType } from "redis"

/* =========================
   REDIS CONFIG
========================= */

const host: string = process.env.REDIS_HOST || "redis"

const port: number = process.env.REDIS_PORT
  ? Number(process.env.REDIS_PORT)
  : 6379

export const redisClient: RedisClientType =
  createClient({
    socket: {
      host,
      port,
    },
  })

/* =========================
   ERROR HANDLING
========================= */

redisClient.on("error", (err: unknown) => {
  console.error("Redis Client Error:", err)
})

/* =========================
   CONNECT
========================= */

await redisClient.connect()