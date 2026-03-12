import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import ApiError from "../utils/apiError.js"

interface WarehouseJwtPayload {
  warehouseId: string
  role: "warehouse"
}


declare global {
  namespace Express {
    interface Request {
      warehouse?: WarehouseJwtPayload
    }
  }
}

const JWT_SECRET = process.env.WAREHOUSE_JWT_SECRET!

export const verifyWarehouseToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {

  const token: string | undefined =
    req.cookies?.warehouseToken ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "")

  if (!token) {
    throw new ApiError(401, "Warehouse authentication token missing")
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as WarehouseJwtPayload

    if (decoded.role !== "warehouse") {
      throw new ApiError(403, "Forbidden — not a warehouse token")
    }

    req.warehouse = decoded
    next()
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError(401, "Invalid or expired warehouse token")
  }
}