import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoosePaginate from "mongoose-paginate-v2"

export const ROLES = ["user", "admin", "retailer", "franchise"] as const

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

export interface IUserModel
  extends Model<IUser> {
  paginate: any
}

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      index: true,
    },

    name: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      trim: true,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
    },

    roles: {
      type: [String],
      default: ["user"],
      enum: ROLES,
    },

    wholesalerStatus: {
      type: String,
      enum: ["none", "pending", "approved", "declined"],
      default: "none",
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

/* =========================
   PASSWORD HASHING
========================= */

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next()

  if (!this.password) return next()

  this.password = await bcrypt.hash(this.password, 12)
  next()
})

/* =========================
   METHODS
========================= */

userSchema.methods.isPasswordCorrect = async function (
  password: string
): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.ACCESS_TOKEN_SECRET
  const expiry = process.env.ACCESS_TOKEN_EXPIRY

  if (!secret || !expiry) {
    throw new Error("Access token env variables missing")
  }

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      roles: this.roles,
    },
    secret,
    { expiresIn: expiry }
  )
}

userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.REFRESH_TOKEN_SECRET
  const expiry = process.env.REFRESH_TOKEN_EXPIRY

  if (!secret || !expiry) {
    throw new Error("Refresh token env variables missing")
  }

  return jwt.sign({ _id: this._id }, secret, {
    expiresIn: expiry,
  })
}

/* =========================
   JSON TRANSFORM
========================= */

userSchema.set("toJSON", {
  transform(_doc, ret: Partial<IUser> & { _id?: Types.ObjectId }) {
    if (ret._id) {
      ret.id = ret._id.toString()
      delete ret._id
    }

    delete ret.password
    delete (ret as any).__v

    return ret
  },
})

userSchema.plugin(mongoosePaginate)

export const User = mongoose.model<IUser, IUserModel>(
  "User",
  userSchema
)