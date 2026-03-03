import { Request, Response } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import bcrypt from "bcrypt"
import { redisClient } from "../middlewares/otp.middleware.js"
import { User } from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { options } from "../middlewares/auth.middleware.js"
import Order from "../models/order.model.js"
import mongoose from "mongoose"
import emailService from "../services/emailService.js"

/* =========================
   TYPES
========================= */

type OtpPurpose =
  | "register"
  | "login"
  | "reset-password"
  | "change-email"
  | "verify-email"
  | "confirm-order"

interface SendOtpParams {
  purpose: OtpPurpose
}

interface CheckOtpBody {
  email: string
  otp: string
}

/* =========================
   UTILITIES
========================= */

export const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString()

const otpKeyBuilder = (
  email: string,
  purpose: OtpPurpose
) => `otp:${email}:${purpose}:data`

/* =========================
   VERIFY OTP (Reusable)
========================= */

export const verifyOtp = async (
  email: string,
  otp: string,
  purpose: OtpPurpose
): Promise<boolean> => {
  const key = otpKeyBuilder(email, purpose)

  const hashedOtp = await redisClient.get(key)
  if (!hashedOtp) return false

  const cleanOtp = otp.trim()
  const isCorrect = await bcrypt.compare(
    cleanOtp,
    hashedOtp
  )

  if (isCorrect) {
    await redisClient.del(key)
  }

  return isCorrect
}

/* =========================
   SEND OTP
========================= */

export const sendOTP = asyncHandler(
  async (
    req: Request<SendOtpParams>,
    res: Response
  ): Promise<Response> => {
    const { purpose } = req.params

    const allowedPurposes: OtpPurpose[] = [
      "register",
      "login",
      "reset-password",
      "change-email",
      "verify-email",
      "confirm-order",
    ]

    if (!allowedPurposes.includes(purpose)) {
      throw new ApiError(400, "Invalid OTP purpose")
    }

    const email =
      req.body?.email ||
      req.params?.email ||
      req.user?.email

    if (!email)
      throw new ApiError(400, "Email required")

    const cleanEmail = email
      .toLowerCase()
      .trim()

    const user = await User.findOne({
      email: cleanEmail,
    })

    if (
      (purpose === "login" ||
        purpose === "reset-password") &&
      !user
    ) {
      throw new ApiError(404, "User not found")
    }

    if (
      purpose === "register" &&
      user?.isVerified
    ) {
      throw new ApiError(
        400,
        "User already registered"
      )
    }

    const OTP_EXPIRY = 300
    const RESEND_LIMIT = 60
    const RATE_LIMIT = 1000

    const now = Date.now()

    const lastSentKey = `otp:${cleanEmail}:${purpose}:lastSent`
    const rateKey = `otp:${cleanEmail}:${purpose}:count`
    const otpKey = otpKeyBuilder(
      cleanEmail,
      purpose
    )

    const lastSent =
      await redisClient.get(lastSentKey)

    if (
      lastSent &&
      now - parseInt(lastSent) <
        RESEND_LIMIT * 1000
    ) {
      throw new ApiError(
        429,
        "Please wait before requesting another OTP."
      )
    }

    const sentCount =
      await redisClient.get(rateKey)

    if (
      sentCount &&
      parseInt(sentCount) >= RATE_LIMIT
    ) {
      throw new ApiError(
        429,
        "OTP limit exceeded."
      )
    }

    const otp = generateOTP()
    const hashedOtp = await bcrypt.hash(
      otp,
      10
    )

    await redisClient.set(otpKey, hashedOtp, {
      EX: OTP_EXPIRY,
    })

    await redisClient.set(
      lastSentKey,
      now.toString(),
      { EX: RESEND_LIMIT }
    )

    await redisClient.incr(rateKey)
    await redisClient.expire(rateKey, 3600)

    /* Send email based on purpose */
    if (purpose === "register") {
      await emailService.sendRegistrationOTP(
        cleanEmail,
        user?.name || "User",
        otp
      )
    }

    if (purpose === "login") {
      await emailService.sendLoginOTP(
        cleanEmail,
        user!.name,
        otp
      )
    }

    if (purpose === "reset-password") {
      await emailService.sendPasswordResetOTP(
        cleanEmail,
        user!.name,
        otp
      )
    }

    if (purpose === "confirm-order") {
      await emailService.sendVerifyOrderOTP(
        cleanEmail,
        otp
      )
    }

    return res
      .status(202)
      .json(
        new ApiResponse(
          200,
          {},
          "OTP sent successfully"
        )
      )
  }
)

/* =========================
   CHECK OTP
========================= */

export const checkOtp = asyncHandler(
  async (
    req: Request<{ purpose: OtpPurpose }>,
    res: Response
  ): Promise<Response> => {
    const { purpose } = req.params
    const { email, otp } =
      req.body as CheckOtpBody

    if (!email || !otp)
      throw new ApiError(
        400,
        "Email and OTP required"
      )

    const cleanEmail = email
      .toLowerCase()
      .trim()

    const cleanOtp = otp.trim()

    if (cleanOtp.length !== 6) {
      throw new ApiError(
        400,
        "OTP must be 6 digits"
      )
    }

    const isCorrect = await verifyOtp(
      cleanEmail,
      cleanOtp,
      purpose
    )

    if (!isCorrect) {
      throw new ApiError(
        400,
        "OTP incorrect or expired"
      )
    }

    /* REGISTER FLOW */
    if (purpose === "register") {
      const token = jwt.sign(
        { email: cleanEmail },
        process.env.REGISTER_TOKEN_SECRET as string,
        {
          expiresIn:
            process.env.REGISTER_TOKEN_EXPIRY,
        }
      )

      res.cookie(
        "emailVerifiedToken",
        token,
        options
      )
    }

    /* RESET PASSWORD FLOW */
    if (purpose === "reset-password") {
      const token = jwt.sign(
        { email: cleanEmail },
        process.env.RESETPASS_TOKEN_SECRET as string,
        {
          expiresIn:
            process.env.RESETPASS_TOKEN_EXPIRY,
        }
      )

      res.cookie(
        "resetPassToken",
        token,
        options
      )
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { isCorrect: true },
        "OTP verified successfully"
      )
    )
  }
)