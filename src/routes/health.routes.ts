import mongoose from "mongoose";
import { Router, Request, Response } from "express";
import { redisClient } from "../middlewares/otp.middleware.js";

const router = Router();

interface HealthStatus {
  uptime: number;
  message: string;
  timestamp: number;
  mongo: string;
  redis: string;
  mongoDetails?: {
    state: number;
    stateName: string;
    host?: string;
    name?: string;
  };
  redisDetails?: {
    connected: boolean;
    error?: string;
  };
}

const getMongoStateName = (state: number): string => {
  switch (state) {
    case 0:
      return "disconnected";
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "unknown";
  }
};

router.get("/health", async (req: Request, res: Response): Promise<Response> => {
  const health: HealthStatus = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    mongo: "unknown",
    redis: "unknown",
  };

  try {
    // Check MongoDB connection
    const mongoState = mongoose.connection.readyState;
    health.mongo = getMongoStateName(mongoState);
    
    // Add MongoDB details
    health.mongoDetails = {
      state: mongoState,
      stateName: getMongoStateName(mongoState),
      host: mongoose.connection.host || undefined,
      name: mongoose.connection.name || undefined
    };

    // Check Redis connection
    if (redisClient) {
      try {
        // Use ping to check Redis connection
        // Handle different Redis client types
        if (typeof redisClient.ping === 'function') {
          const pingResult:any = await redisClient.ping();
          
          // Check if ping returned successfully
          if (pingResult === 'PONG'  || pingResult === 'OK') {
            health.redis = "connected";
            health.redisDetails = {
              connected: true
            };
          } else {
            health.redis = "degraded";
            health.redisDetails = {
              connected: false,
              error: "Unexpected ping response"
            };
          }
        } 
        // For Redis v4+ which might use different method
        else if (typeof (redisClient as any).isReady !== 'undefined') {
          const isReady = (redisClient as any).isReady;
          health.redis = isReady ? "connected" : "disconnected";
          health.redisDetails = {
            connected: isReady
          };
        }
        else {
          // If ping method doesn't exist, assume it's working if client exists
          health.redis = "connected";
          health.redisDetails = {
            connected: true,
            error: "Ping method not available, assuming connected"
          };
        }
      } catch (redisError: any) {
        console.error("Redis health check failed:", redisError);
        health.redis = "disconnected";
        health.redisDetails = {
          connected: false,
          error: redisError?.message || "Failed to connect to Redis"
        };
      }
    } else {
      health.redis = "not_configured";
      health.redisDetails = {
        connected: false,
        error: "Redis client not initialized"
      };
    }

    // Determine overall health status
    const isMongoHealthy = mongoState === 1;
    const isRedisHealthy = health.redis === "connected" || health.redis === "not_configured";
    
    if (!isMongoHealthy || !isRedisHealthy) {
      health.message = "Degraded";
      return res.status(503).json(health);
    }

    return res.status(200).json(health);
  } catch (err: any) {
    console.error("Health check error:", err);
    health.message = err?.message || "Health check failed";
    return res.status(503).json(health);
  }
});

// Additional detailed health check endpoint
router.get("/health/detailed", async (req: Request, res: Response): Promise<Response> => {
  const detailedHealth: any = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {},
    system: {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    }
  };

  try {
    // MongoDB detailed status
    const mongoState = mongoose.connection.readyState;
    detailedHealth.services.mongodb = {
      status: getMongoStateName(mongoState),
      state: mongoState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      models: Object.keys(mongoose.connection.models),
      collections: await getCollectionNames()
    };

    // Redis detailed status
    if (redisClient) {
      try {
        if (typeof redisClient.ping === 'function') {
          await redisClient.ping();
          detailedHealth.services.redis = {
            status: "connected",
            connected: true
          };
        } else {
          detailedHealth.services.redis = {
            status: "connected",
            connected: true,
            note: "Ping method not available"
          };
        }
      } catch (redisError: any) {
        detailedHealth.services.redis = {
          status: "disconnected",
          connected: false,
          error: redisError?.message
        };
      }
    } else {
      detailedHealth.services.redis = {
        status: "not_configured",
        connected: false
      };
    }

    return res.status(200).json(detailedHealth);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to get detailed health status",
      message: err?.message
    });
  }
});

// Helper function to get collection names
async function getCollectionNames(): Promise<string[]> {
  try {
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray();
      return collections.map(col => col.name);
    }
    return [];
  } catch (error) {
    console.error("Error getting collections:", error);
    return [];
  }
}

// Simple ping endpoint for load balancers
router.get("/ping", (_req: Request, res: Response): Response => {
  return res.status(200).send("pong");
});

export default router;