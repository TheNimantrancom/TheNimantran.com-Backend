import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from "express"
import cors, { CorsOptions } from "cors"
import cookieParser from "cookie-parser"
import passport from "passport"

import adminRoutes from "./routes/admin/index.js"
import allRouter from "./routes/index.js"
import "./middlewares/passport.js"

const app: Application = express()

const { FRONT1, FRONT2 } = process.env

const corsOptions: CorsOptions = {
  origin: [
    "http://localhost:3001",
    "http://localhost:3000",
    FRONT2 as string,
    FRONT1 as string,
  ].filter(Boolean),
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}

app.set("trust proxy", 1)

app.use(cors(corsOptions))

app.use(express.json({ limit: "16mb" }))
app.use(express.urlencoded({ extended: true, limit: "16mb" }))

app.use(express.static("public"))

app.use(cookieParser())
app.use(passport.initialize())

app.use("/api", allRouter)
app.use("/api", adminRoutes)

interface CustomError extends Error {
  statusCode?: number
  errors?: unknown[]
}

app.use(
  (
    err: CustomError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    const statusCode: number = err.statusCode || 500

    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
      errors: err.errors || [],
      stack:
        process.env.NODE_ENV === "development"
          ? err.stack
          : undefined,
    })
  }
)

export default app