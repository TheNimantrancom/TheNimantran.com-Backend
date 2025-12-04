import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoosePaginate from "mongoose-paginate-v2";

const ROLES = ["user", "admin", "retailer", "franchise"];

const userSchema = new mongoose.Schema(
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
      select: false, // never return password by default
    },

    phone: {
      type: String,
      required: false,
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
    }
  },
  {
    timestamps: true,
  }
);

// Pre-save hook for hashing passwords
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

// JWT: Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      roles: this.roles,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// JWT: Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

// Optional: global JSON transform to hide internal fields
userSchema.set("toJSON", {
  transform(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

userSchema.plugin(mongoosePaginate);

export const User = mongoose.model("User", userSchema);
export { ROLES };
