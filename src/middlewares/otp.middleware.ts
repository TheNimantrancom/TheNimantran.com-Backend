import { createClient, RedisClientType } from "redis"



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


redisClient.on("error", (err: unknown) => {
  console.error("Redis Client Error:", err)
})



await redisClient.connect()    