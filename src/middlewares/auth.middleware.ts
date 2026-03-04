import { Request, Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import { User } from "../models/user.model.js"
import {IUser} from "../types/models/user.types.js"



interface ITokenPayload extends JwtPayload {
  _id: string
}


export const verifyJWT = asyncHandler(
  async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    let token: string | null = null

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken
    } else if (
      req.headers.authorization?.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1]
    }

    if (!token) {
      throw new ApiError(401, "Access token missing or invalid")
    }

    const secret = process.env.ACCESS_TOKEN_SECRET

    if (!secret) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined")
    }

    let decoded: ITokenPayload

    try {
      decoded = jwt.verify(token, secret) as ITokenPayload
    } catch {
      throw new ApiError(
        401,
        "Access token is invalid or expired"
      )
    }

    const user: IUser | null = await User.findById(
      decoded._id
    ).select("-password")

    if (!user) {
      throw new ApiError(
        404,
        "User not found for this token"
      )
    }

    req.user = user
    next()
  }
)



export const options = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}