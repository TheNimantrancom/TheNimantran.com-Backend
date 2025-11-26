import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoosePaginate from "mongoose-paginate-v2";
const ROLES = ["user", "admin", "retailer", "franchise"];

const userSchema = new mongoose.Schema(
  {
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
      required: [true, "Password is required"],
      trim: true,
      select: false, 
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^[6-9]\d{9}$/.test(v); 
        },
        message: (props) =>
          `${props.value} is not a valid phone number.`,
      },
    },
    roles: {
      type: [String],
      default: ["user"],
      enum: ROLES,
    },
wholesalerStatus: {
  type: String,
  enum: ["none", "pending", "approved", "declined"],
  default: "none"
},
    isBanned: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
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
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
userSchema.plugin(mongoosePaginate);
export const User = mongoose.model("User", userSchema);
export { ROLES };
