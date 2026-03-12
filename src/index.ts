import app from "./app.js"
import { connectDB } from "./dB/db.connect.js"
import { createServer } from "http"
import path from "path"
import { fileURLToPath } from "url"
import { initWarehouseSocket } from "./sockets/warehouse.socket.js"
import { Server } from "socket.io"
import ApiError from "./utils/apiError.js"
import jwt from "jsonwebtoken"
import cookie from "cookie"

const PORT: number = Number(process.env.PORT) || 1000

const __filename: string = fileURLToPath(import.meta.url)
const __dirname: string = path.dirname(__filename)

interface SocketData {
  userId?: string
  email?: string
  fullName?: string
}

let io: Server<any, any, any, SocketData> | null = null

const server = createServer(app)

export const getIO = (): Server<any, any, any, SocketData> => {
  if (!io) {
    throw new Error("Socket.IO not initialized")
  }
  return io
}

const initializeApplication = async (): Promise<void> => {
  try {
    console.log("Starting application initialization...")

    await connectDB()
    console.log("Database connected successfully")

    io = new Server<any, any, any, SocketData>(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST"]
      },
      transports: ["websocket", "polling"],
      maxHttpBufferSize: 1e6,
      pingTimeout: 30000,
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
      }
    })

    console.log("Socket.IO server initialized")

    io.use((socket, next) => {
      try {
        const rawCookies = socket.handshake.headers.cookie

        if (!rawCookies) {
          return next(new Error("Authentication error: No cookies"))
        }

        const parsed = cookie.parse(rawCookies)
        const token = parsed.accessToken

        if (!token) {
          return next(new Error("Authentication error: Token missing"))
        }

        if (!process.env.ACCESS_TOKEN_SECRET) {
          return next(new Error("Server misconfiguration"))
        }

        const decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET
        ) as {
          _id: string
          fullName: string
          email: string
        }

        socket.data.userId = decoded._id
        socket.data.fullName = decoded.fullName
        socket.data.email = decoded.email

        next()
      } catch {
        next(new Error("Authentication error: Invalid token"))
      }
    })

    io.on("connection", (socket) => {
      console.log(`Client connected: ${socket.id}`)

      if (!io) {
        throw new ApiError(500, "Server busy")
      }

      initWarehouseSocket(socket, io)

      socket.on("disconnect", (reason) => {
        console.log(`Client disconnected: ${socket.id} Reason: ${reason}`)
      })

      socket.on("error", (error) => {
        console.error(`Socket error for ${socket.id}:`, error)
      })
    })

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`)
      console.log(`WebSocket transports: websocket, polling`)
    })

    server.on("error", (error) => {
      console.error("Server error:", error)
      process.exit(1)
    })

  } catch (error) {
    console.error("Failed to initialize application:", error)
    process.exit(1)
  }
}

const setupGracefulShutdown = (): void => {
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, starting graceful shutdown...`)

    if (io) {
      io.close(() => console.log("Socket.IO closed"))
    }

    server.close(() => {
      console.log("HTTP server closed")
      process.exit(0)
    })

    setTimeout(() => {
      console.log("Forcing shutdown after timeout")
      process.exit(1)
    }, 10000)
  }

  process.on("SIGINT", () => shutdown("SIGINT"))
  process.on("SIGTERM", () => shutdown("SIGTERM"))

  process.on("uncaughtException", (error: Error) => {
    console.error("Uncaught Exception:", error)
    shutdown("uncaughtException")
  })

  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason)
    shutdown("unhandledRejection")
  })
}

initializeApplication()
setupGracefulShutdown()

export { io }