import { Request, Response } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import { User, IUser } from "../models/user.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import { redisClient } from "../middlewares/otp.middleware.js"
import bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"
import { verifyOtp } from "./verification.controller.js"
import { options } from "../middlewares/auth.middleware.js"
import WholesalerApplication from "../models/wholesaler.model.js"
import emailService from "../services/emailService.js"

/* =========================
   SANITIZE USER
========================= */

const sanitizeUser = (userDoc: IUser | null) => {
  if (!userDoc) return null

  const obj =
    typeof (userDoc as any).toObject === "function"
      ? (userDoc as any).toObject()
      : { ...userDoc }

  delete obj.password
  delete obj.refreshToken
  delete obj.__v

  if (obj._id && !obj.id) {
    obj.id = obj._id
  }

  return obj
}

/* =========================
   TOKEN GENERATION
========================= */

const generateAccessAndRefreshToken = async (
  userId: string
) => {
  const user = await User.findById(userId)
  if (!user) throw new ApiError(404, "User not found")

  const refreshToken = user.generateRefreshToken()
  const accessToken = user.generateAccessToken()

  user.refreshToken = refreshToken
  await user.save({ validateBeforeSave: false })

  return { refreshToken, accessToken }
}

/* =========================
   REGISTER
========================= */

interface RegisterBody {
  name: string
  email: string
  password: string
  phone: string
}

export const registerUser = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { name, email, password, phone } =
      req.body as RegisterBody

    if (!name || !email || !password || !phone) {
      throw new ApiError(400, "All fields are required")
    }

    const registerToken =
      req.cookies?.emailVerifiedToken

    if (!registerToken) {
      throw new ApiError(400, "Email not verified")
    }

    jwt.verify(
      registerToken,
      process.env.REGISTER_TOKEN_SECRET as string
    )

    if (!/^\d{10}$/.test(phone)) {
      throw new ApiError(400, "Invalid phone")
    }

    const existing = await User.findOne({
      email: email.toLowerCase(),
    })

    if (existing) {
      throw new ApiError(409, "Email already in use")
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      isVerified: true,
    })

    await emailService.sendWelcomeEmail(
      email,
      name
    )

    return res.status(201).json(
      new ApiResponse(
        201,
        sanitizeUser(user),
        "User registered successfully"
      )
    )
  }
)

/* =========================
   LOGIN
========================= */

interface LoginBody {
  otp?: string
  email?: string
  emailOrPhone?: string
  password?: string
}

export const loginUser = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const {
      otp,
      email,
      emailOrPhone,
      password,
    } = req.body as LoginBody

    let user: IUser | null = null

    if (otp) {
      if (!email)
        throw new ApiError(400, "Email required")

      user = await User.findOne({ email })
      if (!user)
        throw new ApiError(404, "User not found")

      const otpVerified = await verifyOtp(
        email,
        otp,
        "login"
      )

      if (!otpVerified)
        throw new ApiError(400, "Invalid OTP")
    } else {
      if (!emailOrPhone || !password) {
        throw new ApiError(
          400,
          "Credentials required"
        )
      }

      const query = /^\d{10}$/.test(emailOrPhone)
        ? { phone: emailOrPhone }
        : { email: emailOrPhone.toLowerCase() }

      user = await User.findOne(query).select(
        "+password"
      )

      if (!user)
        throw new ApiError(404, "User not found")

      if (!user.password)
        throw new ApiError(
          400,
          "Use Google login"
        )

      const isValid =
        await user.isPasswordCorrect(password)

      if (!isValid)
        throw new ApiError(
          401,
          "Incorrect password"
        )
    }

    const { refreshToken, accessToken } =
      await generateAccessAndRefreshToken(
        user!._id.toString()
      )

    return res
      .cookie("refreshToken", refreshToken, options)
      .cookie("accessToken", accessToken, options)
      .status(200)
      .json(
        new ApiResponse(
          200,
          sanitizeUser(user),
          "Login successful"
        )
      )
  }
)

/* =========================
   REFRESH TOKEN
========================= */

export const refreshAccessToken =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      const token = req.cookies?.refreshToken
      if (!token)
        throw new ApiError(
          400,
          "Refresh token missing"
        )

      const decoded = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as JwtPayload

      const user = await User.findById(
        decoded._id
      ).select("+refreshToken")

      if (!user)
        throw new ApiError(404, "User not found")

      if (user.refreshToken !== token) {
        throw new ApiError(
          403,
          "Token mismatch"
        )
      }

      const tokens =
        await generateAccessAndRefreshToken(
          user._id.toString()
        )

      return res
        .cookie("accessToken", tokens.accessToken, options)
        .cookie("refreshToken", tokens.refreshToken, options)
        .status(200)
        .json(
          new ApiResponse(
            200,
            tokens,
            "Token refreshed"
          )
        )
    }
  )