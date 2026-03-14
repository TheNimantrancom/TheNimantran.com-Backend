import { Request, Response } from "express"
import jwt from "jsonwebtoken"
import asyncHandler from "../../utils/asyncHandler.js"
import ApiError from "../../utils/apiError.js"
import ApiResponse from "../../utils/apiResponse.js"
import { Warehouse, IWarehouse } from "../../models/warehouse.model.js"
import { options } from "../../middlewares/auth.middleware.js"



const JWT_SECRET = process.env.WAREHOUSE_JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.WAREHOUSE_JWT_EXPIRES_IN || "7d"


const signToken = (warehouseId: string): string =>

 
  jwt.sign({ warehouseId, role: "warehouse" }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions)


const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}


const sanitize = (warehouse: IWarehouse) => {
  const obj = warehouse.toObject()
  delete obj.password
  return obj
}


export const createWarehouse = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const {
      name,
      city,
      address,
      lat,
      lng,
      deliveryRadius,
      managerName,
      contactEmail,
      contactPhone,
      password,
    }: {
      name: string
      city: string
      address: string
      lat: number
      lng: number
      deliveryRadius?: number
      managerName?: string
      contactEmail: string
      contactPhone?: string
      password: string
    } = req.body

    // ── Validation ────────────────────────────────────────────────────
    if (!name || !city || !address || !contactEmail || !password) {
      throw new ApiError(400, "name, city, address, contactEmail and password are required")
    }

    if (!lat || !lng) {
      throw new ApiError(400, "lat and lng are required to set warehouse location")
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters")
    }

    const existing = await Warehouse.findOne({ contactEmail: contactEmail.toLowerCase() })
    if (existing) {
      throw new ApiError(409, "A warehouse with this email already exists")
    }


    const warehouse = await Warehouse.create({
      name,
      city,
      address,
      location: {
        type: "Point",
        coordinates: [lng, lat], 
      },
      deliveryRadius: deliveryRadius ?? 10_000,
      managerName,
      contactEmail,
      contactPhone,
      password,   // plain text — model hashes it before saving
      isActive: true,
    })

    return res.status(201).json(
      new ApiResponse(201, sanitize(warehouse), "Warehouse created successfully")
    )
  }
)



export const warehouseLogin = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { email, password }: { email: string; password: string } = req.body

    if (!email || !password) {
      throw new ApiError(400, "Email and password are required")
    }

  
    const warehouse = await Warehouse.findOne({
      contactEmail: email.toLowerCase(),
    }).select("+password")

    if (!warehouse) {
      throw new ApiError(401, "Invalid credentials")
    }

    if (!warehouse.isActive) {
      throw new ApiError(403, "This warehouse account has been deactivated")
    }

    const isMatch = await warehouse.comparePassword(password)
    if (!isMatch) {
      throw new ApiError(401, "Invalid credentials")
    }

    const token = signToken(String(warehouse._id))

    return res
      .status(200)
      .cookie("warehouseToken", token, options)
      .json(
        new ApiResponse(
          200,
          { warehouse: sanitize(warehouse), token },
          "Logged in successfully"
        )
      )
  }
)



export const warehouseLogout = asyncHandler(
  async (_req: Request, res: Response): Promise<Response> => {
    return res
      .status(200)
      .clearCookie("warehouseToken", { httpOnly: true, secure: cookieOptions.secure })
      .json(new ApiResponse(200, null, "Logged out successfully"))
  }
)

export const getWarehouseProfile = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
   
    const warehouse = await Warehouse.findById(
      (req as any).warehouse?.warehouseId
    )

    if (!warehouse) throw new ApiError(404, "Warehouse not found")

    return res.status(200).json(
      new ApiResponse(200, sanitize(warehouse), "Profile fetched successfully")
    )
  }
)