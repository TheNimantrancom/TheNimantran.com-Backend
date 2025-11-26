import mongoose from "mongoose";
import redis from "./path/to/redisClient.js"; 
import {Router} from "express"




const router = Router();

router.get("/health", async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    mongo: "unknown",
    redis: "unknown",
  };

  try {

    health.mongo = mongoose.connection.readyState === 1 ? "connected" : "disconnected";

    if (redis) {
      await redis.ping();
      health.redis = "connected";
    }

    res.status(200).json(health);
  } catch (err) {
    health.message = err.message;
    res.status(503).json(health);
  }
});

export default router;
