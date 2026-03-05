import mongoose, {
  Schema,
  Types,
} from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import mongoosePaginate from "mongoose-paginate-v2"
import { IUser, IUserModel,ROLES } from "../types/models/user.types.js"



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
   isEmailVerified:{
  type:Boolean,
  default:false
   }
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

userSchema.pre("save", async function (next) {
  const user = this as IUser

  if (!user.isModified("password")) return next()
  if (!user.password) return next()

  user.password = await bcrypt.hash(user.password, 12)
  next()
})

userSchema.methods.isPasswordCorrect = async function (
  this: IUser,
  password: string
): Promise<boolean> {
  if (!this.password) return false
  return bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function (this: IUser): string {
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
    { expiresIn: expiry as jwt.SignOptions["expiresIn"] }
  )
}

userSchema.methods.generateRefreshToken = function (this: IUser): string {
  const secret = process.env.REFRESH_TOKEN_SECRET
  const expiry = process.env.REFRESH_TOKEN_EXPIRY

  if (!secret || !expiry) {
    throw new Error("Refresh token env variables missing")
  }

  return jwt.sign(
    { _id: this._id },
    secret,
    { expiresIn: expiry as jwt.SignOptions["expiresIn"] }
  )
}

userSchema.set("toJSON", {
  transform(_doc, ret: Partial<IUser> & { _id?: Types.ObjectId; id?: string }) {
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