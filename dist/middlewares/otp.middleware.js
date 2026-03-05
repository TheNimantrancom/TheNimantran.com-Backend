import { createClient } from "redis";
const host = process.env.REDIS_HOST || "redis";
const port = process.env.REDIS_PORT
    ? Number(process.env.REDIS_PORT)
    : 6379;
export const redisClient = createClient({
    socket: {
        host,
        port,
    },
});
redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
});
await redisClient.connect();
