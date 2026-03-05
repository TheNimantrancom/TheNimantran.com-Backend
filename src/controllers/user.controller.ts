import { Request, Response, NextFunction } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import  {User}  from "../models/user.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import { redisClient } from "../middlewares/otp.middleware.js"
import bcrypt from "bcrypt"
import jwt, { JwtPayload } from "jsonwebtoken"
import { options } from "../middlewares/auth.middleware.js"
import WholesalerApplication from "../models/wholesaler.model.js"
import emailService from "../services/emailService.js"
import { IUser } from "../types/models/user.types.js"
import { z } from "zod";

interface RegisterTokenPayload extends JwtPayload {
  email: string
}

interface ResetTokenPayload extends JwtPayload {
  email: string
}

const sanitizeUser = (userDoc: any) => {
  if (!userDoc) return null

  const obj =
    typeof userDoc.toObject === "function"
      ? userDoc.toObject()
      : { ...userDoc }

  delete obj.password
  delete obj.refreshToken
  delete obj.__v
  delete obj.$__
  delete obj._doc

  if (obj._id && !obj.id) {
    obj.id = obj._id
  }

  return obj
}

const generateAccessAndRefreshToken = async (userId: string) => {
  const user:any = await User.findById(userId)
  if (!user) throw new ApiError(404, "User not found")

  const refreshToken = user.generateRefreshToken()
  const accessToken = user.generateAccessToken()

  user.refreshToken  = refreshToken
  await user.save({ validateBeforeSave: false })

  return { refreshToken, accessToken }
}

const parseBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value
  if (typeof value === "string") return value.toLowerCase() === "true"
  return false
}
const registerUserSchema = z.object({
  name: z
    .string()
    .min(3, "Name should be at least 3 characters long")
    .max(40, "Name too large")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .min(5, "Email should be at least 5 characters long")
    .max(50, "Email too large"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  password: z
    .string()
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/,
      "Password must be at least 8 characters long with at least 1 letter, 1 number, and 1 special character (@$!%*?&)"
    ),
});

const registerUser = asyncHandler(async (req: Request, res: Response) => {
   console.log("Yes the backend api is hitted");

  const validatedData = registerUserSchema.parse(req.body);
  let { name, email, password } = validatedData;

  email = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email
  })
    .select("_id isEmailVerified")
    .lean();

  if (existingUser?.isEmailVerified) {
    throw new ApiError(400, "User with this email or username already exists");
  }

  if (existingUser && !existingUser.isEmailVerified) {
    await User.deleteOne({ _id: existingUser._id });
  }


  const user = await User.create({
    name,
    email,
    password,
  
  });

  const response = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,

  };

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        response,
        "Details saved. Verify your email to complete registration."
      )
    );
});

const loginUser = asyncHandler(async (req: Request, res: Response) => {

  const {password, email } = req.body
    let query: Record<string, string> = {}

   if (/\S+@\S+\.\S+/.test(email.trim())) {
      query.email = email.trim().toLowerCase()
    } else {
      throw new ApiError(400, "Invalid email  format")
    }

     const user = await User.findOne(query).select("+password")

    if (!user) throw new ApiError(404, "User not found")

    if (!user.password) {
      throw new ApiError(400, "Try Login with Google")
    }

    const isPasswordCorrect =
      await user.isPasswordCorrect(password);

    if (!isPasswordCorrect)
      throw new ApiError(401, "Incorrect password");
  

  const { refreshToken, accessToken } =
    await generateAccessAndRefreshToken(user._id.toString())

  const userSafe = sanitizeUser(user)

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          ...userSafe,
          isEmailVerified: userSafe?.isEmailVerified ?? false,
        },
        "Login successful"
      )
    )
})

export const googleCallbackLogin = asyncHandler(
  async (req: Request, res: Response) => {
    const googleUser = req.user as any

    let user = await User.findOne({
      email: googleUser.email,
    })

    if (!user) {
      user = await User.create({
        googleId: googleUser.googleId,
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        roles: ["user"],
        wholesalerStatus: "none",
        isVerified: true,
      })

      await emailService.sendWelcomeEmail(
        googleUser.email,
        googleUser.name
      )
    }

    const { refreshToken, accessToken } =
      await generateAccessAndRefreshToken(
        user._id.toString()
      )

    res
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)

    res.redirect(`https://thenimantran.com/`)
  }
)

const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  return res
    .status(202)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200,
        {},
        "User logged out successfully"
      )
    )
})

const updateProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as IUser)?._id

    const { name, email, otp, phone } = req.body

    const updates: Record<string, any> = {}

    if (name?.trim()) updates.name = name.trim()

    if (phone && /^\d{10}$/.test(phone))
      updates.phone = phone

    if (email && /\S+@\S+\.\S+/.test(email)) {
      const hashedOtp = await redisClient.get(
        `otp:data:${email}`
      )

      if (!hashedOtp)
        throw new ApiError(
          404,
          "OTP expired or not found"
        )

      const isVerified = await bcrypt.compare(
        otp,
        hashedOtp
      )

      if (!isVerified)
        throw new ApiError(
          400,
          "Email not verified by OTP"
        )

      updates.email = email
      updates.isVerified = true
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      {
        new: true,
        runValidators: true,
      }
    )

    const userSafe = sanitizeUser(updatedUser)

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            ...userSafe,
            isVerified: userSafe?.isVerified ?? false,
          },
          "Profile updated"
        )
      )
  }
)

const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.cookies?.refreshToken

    if (!token)
      throw new ApiError(400, "Refresh token missing")

    let decoded: JwtPayload

    try {
      decoded = jwt.verify(
        token,
        process.env
          .REFRESH_TOKEN_SECRET as string
      ) as JwtPayload
    } catch {
      throw new ApiError(401, "Invalid refresh token")
    }

    const user:any= await User.findById(decoded._id).select(
      "+refreshToken"
    )

    if (!user) throw new ApiError(404, "User not found")

    if (user.refreshToken !== token) {
      throw new ApiError(403, "Refresh token mismatch")
    }

    const { accessToken, refreshToken } =
      await generateAccessAndRefreshToken(
        user._id.toString()
      )

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Token refreshed"
        )
      )
  }
)

const getCurrentUser = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as IUser)?._id

    const user = await User.findById(userId)

    if (!user) throw new ApiError(404, "User not found")

    const userSafe = sanitizeUser(user)

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            ...userSafe,
            isVerified: userSafe?.isVerified ?? false,
          },
          "User fetched successfully"
        )
      )
  }
)

export const applyWholesaler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req.user as IUser)._id

    const pendingApp =
      await WholesalerApplication.findOne({
        user: userId,
        status: "pending",
      })

    if (pendingApp) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            200,
            {},
            "You already have pending Application"
          )
        )
    }

    const declinedApp =
      await WholesalerApplication.findOne({
        user: userId,
        status: "declined",
      }).sort({ reviewedAt: -1 })

    if (declinedApp) {
      const threeDaysAgo = new Date(
        Date.now() - 3 * 24 * 60 * 60 * 1000
      )

      if (
        declinedApp.reviewedAt &&
        declinedApp.reviewedAt > threeDaysAgo
      ) {
        const daysLeft = Math.ceil(
          (declinedApp.reviewedAt.getTime() +
            3 * 24 * 60 * 60 * 1000 -
            Date.now()) /
            (24 * 60 * 60 * 1000)
        )

        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              {},
              `You can reapply after ${daysLeft} day(s).`
            )
          )
      }
    }

    const {
      businessName,
      email,
      ownerName,
      gstNumber,
      businessAddress,
      contactNumber,
    } = req.body

    const application =
      await WholesalerApplication.create({
        user: userId,
        email,
        businessName,
        ownerName,
        gstNumber,
        businessAddress,
        contactNumber,
        status: "pending",
      })

    await User.findByIdAndUpdate(userId, {
      wholesalerStatus: "pending",
    })

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          application,
          "Application submitted successfully."
        )
      )
  }
)

const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const otpToken = req.cookies?.resetPassToken
    const { password } = req.body

    if (!password)
      throw new ApiError(
        400,
        "New password is required"
      )

    if (!otpToken)
      throw new ApiError(
        400,
        "Verify with otp first"
      )

    const resetPassToken = jwt.verify(
      otpToken,
      process.env
        .RESETPASS_TOKEN_SECRET as string
    ) as ResetTokenPayload

    if (!resetPassToken)
      throw new ApiError(
        401,
        "Not authorized to change password"
      )

    const user = await User.findOneAndUpdate(
      { email: resetPassToken.email },
      {
        $set: { password },
      },
      { new: true }
    )

    if (!user)
      throw new ApiError(
        400,
        "Unable to update password ,Try later!"
      )

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          "Password changed successfully"
        )
      )
  }
)

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  resetPassword
}