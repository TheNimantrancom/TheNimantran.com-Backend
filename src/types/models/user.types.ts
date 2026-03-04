import { Document, Types,Model } from "mongoose"

export interface IUserModel
  extends Model<IUser> {
  paginate: any
}
export const ROLES = ["user", "admin", "retailer", "franchise"] as const

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}

export {}
export type Role = (typeof ROLES)[number]
export type WholesalerStatus =
  | "none"
  | "pending"
  | "approved"
  | "declined"

export interface IUser extends Document {
  _id: Types.ObjectId
  googleId?: string
  name: string
  email: string
  password?: string
  phone?: string
  roles: Role[]
  wholesalerStatus: WholesalerStatus
  isBanned: boolean
  isVerified: boolean
  createdAt: Date
  updatedAt: Date


  isPasswordCorrect(password: string): Promise<boolean>
  generateAccessToken(): string
  generateRefreshToken(): string
}