import express, {
  Application,
  Request,
  Response,
  NextFunction,
} from "express"
import cors, { CorsOptions } from "cors"
import cookieParser from "cookie-parser"
import passport from "passport"
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import adminRoutes from "./routes/admin/index.js"
import allRouter from "./routes/index.js"
import "./middlewares/passport.js"
import { globalLimiter } from "./utils/limiter.js"
import ApiError from "./utils/apiError.js"
import ApiResponse from "./utils/apiResponse.js"
import path from "path"
import { fileURLToPath } from "url";

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
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("trust proxy", 1)

app.use(cors(corsOptions))

app.use(express.json({ limit: "16mb" }))
app.use(express.urlencoded({ extended: true, limit: "16mb" }))

app.use(express.static("public"))

app.use(cookieParser())
app.use(passport.initialize())
app.use(globalLimiter)

// Routes
app.use("/api", allRouter)
app.use("/api", adminRoutes) 
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, null, "Server is running"));
});
const swaggerOptions = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "TheNimantran.com API",
      version: "1.0.0",
      description: "TheNimantran.com API Documentation",
    },
    servers: [
      { url: "http://localhost:8000/api", description: "Local server" },
      { url: `${process.env.BACKEND_URL}/api`, description: "Production server" },
    ]
  },
apis: [path.join(__dirname, "../src/doc/swagger/*.yaml")]
}
const swaggerSpec = swaggerJSDoc(swaggerOptions)

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))
// app.use("*", (req: Request, res: Response) => {
//   res.status(404).json(
//     new ApiResponse(404, null, `Cannot ${req.method} ${req.originalUrl}`)
//   );
// });

app.use(
  (
    err: Error | ApiError,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    let statusCode = 500;
    let message = "Internal Server Error";
    let errors: unknown[] = [];
    let stack: string | undefined = undefined;

    if (err instanceof ApiError) {
      statusCode = err.statusCode;
      message = err.message;
      errors = err.errors || [];
    } 
    else if ('statusCode' in err && typeof err.statusCode === 'number') {
      statusCode = err.statusCode;
      message = err.message;
    }
    else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
      statusCode = 409;
      message = "Duplicate entry found";
      const field = Object.keys((err as any).keyPattern)[0];
      errors = [`${field} already exists`];
    }
    else if (err.name === 'ValidationError') {
      statusCode = 400;
      message = "Validation Error";
      const validationErrors = (err as any).errors;
      errors = Object.values(validationErrors).map((e: any) => e.message);
    }
    else if (err.name === 'CastError') {
      statusCode = 400;
      message = "Invalid ID format";
      errors = [(err as any).stringValue];
    }
    else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = "Invalid token";
      errors = [err.message];
    }
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = "Token expired";
      errors = [err.message];
    }

    if (process.env.NODE_ENV === "development") {
      stack = err.stack;
      console.error(`[${new Date().toISOString()}] Error:`, {
        statusCode,
        message,
        errors,
        stack,
        url: req.url,
        method: req.method,
        ip: req.ip
      });
    } else {
      console.error(`[${new Date().toISOString()}] ${statusCode} - ${message} - ${req.method} ${req.url}`);
    }

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors: errors.length > 0 ? errors : undefined,
      data: null,
      ...(stack && { stack }) 
    });
  }
);

export default app;