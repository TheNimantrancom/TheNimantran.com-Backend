import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyOtp } from "./verification.controller.js";
import { options } from "../middlewares/auth.middleware.js";
import WholesalerApplication from "../models/wholesaler.model.js";

/**
 * Utility to generate and save access & refresh tokens
 * 
 */
const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { refreshToken, accessToken };
};

/**
 * Parse string/boolean to boolean
 */
const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};

/**
 * REGISTER USER
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    throw new ApiError(400, "All fields are required");
  }

  if (!/^\d{10}$/.test(phone)) {
    throw new ApiError(400, "Phone number must be 10 digits");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const isExistingUser = await User.findOne({
    $or: [{ email }, { phone }],
  }).lean();
  if (isExistingUser) {
    throw new ApiError(409, "User with this email or phone already exists");
  }

  const user = await User.create({ name, email, password, phone });

  // const userSafe = await User.findById(user._id).select("-password -refreshToken");
      const {refreshToken:_refreshToken,password:_password,...userSafe}= user;


  return res
    .status(201)
    .json(new ApiResponse(201, userSafe, "User registered successfully"));
});

/**
 * LOGIN USER (password or OTP)
 */
const loginUser = asyncHandler(async (req, res) => {
  console.log("I have been hitted stage 1")
  let user;
  const { otp, emailOrPhone, password, email } = req.body;

  if (otp) {
    if (!email) throw new ApiError(400, "Email is required for OTP verification");

    user = await User.findOne({ email }).lean();
    if (!user) throw new ApiError(404, "User not found");

  console.log(`otp :${otp} and type : ${typeof otp}`)

    const otpVerified = await verifyOtp(email, otp);
    if (!otpVerified) throw new ApiError(400, "Invalid OTP");
  } else {
    if (!emailOrPhone || !password) {
      throw new ApiError(400, "Email/Phone and password are required");
    }

    let query = {};
    if (/^\d{10}$/.test(emailOrPhone.trim())) {
      query.phone = emailOrPhone.trim();
    } else if (/\S+@\S+\.\S+/.test(emailOrPhone.trim())) {
      query.email = emailOrPhone.trim().toLowerCase();
    } else {
      throw new ApiError(400, "Invalid email or phone format");
    }

    user = await User.findOne(query).select("+password");
    if (!user) throw new ApiError(404, "User not found");
  if(!user.password)
  {
   throw new ApiError(400,"Try Login with Google")
  }
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) throw new ApiError(401, "Incorrect password");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);
    const {refreshToken:_refreshToken,password:_password,...userSafe}= user;
  console.log("I have been hitted stage 2")
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, userSafe, "Login successful"));
});
export const googleCallbackLogin = asyncHandler(async(req, res) => {
    let user = await User.findOne({ email: req.user.email });

  if (!user) {
    user = await User.create({
      googleId: req.user.googleId,
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture,
      roles: ["user"],
      wholesalerStatus: "none"
    });
  }
    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);

  res.cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
  res.redirect(`https://thenimantran.com/`);
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  await User.findByIdAndUpdate(userId, { refreshToken: undefined });

  return res
    .status(202)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});


const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { name, email, otp, phone } = req.body;

  const updates = {};
  if (name?.trim()) updates.name = name.trim();
  if (/^\d{10}$/.test(phone)) updates.phone = phone;

  if (email && /\S+@\S+\.\S+/.test(email)) {
    const hashedOtp = await redisClient.get(`otp:data:${email}`);
    if (!hashedOtp) throw new ApiError(404, "OTP expired or not found");

    const isVerified = await bcrypt.compare(otp, hashedOtp);
    if (!isVerified) throw new ApiError(400, "Email not verified by OTP");

    updates.email = email;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, updatedUser, "Profile updated"));
});

/**
 * REFRESH ACCESS TOKEN
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(400, "Refresh token missing");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await User.findById(decoded._id);
  if (!user) throw new ApiError(404, "User not found");
  if (user.refreshToken !== token) {
    throw new ApiError(403, "Refresh token mismatch");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, { accessToken, refreshToken }, "Token refreshed"));
});

/**
 * GET CURRENT USER
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const user = await User.findById(userId).select("-password -refreshToken");

  return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
});


export const applyWholesaler = async (req, res) => {
  const userId = req.user._id;

  const pendingApp = await WholesalerApplication.findOne({ user: userId, status: "pending" });
  if (pendingApp) {
    return res.status(400).json( new ApiResponse(200,{},"You already have pending Application")  );
  }

  
  const declinedApp = await WholesalerApplication.findOne({ user: userId, status: "declined" })
    .sort({ reviewedAt: -1 }); // get latest decline
  if (declinedApp) {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    if (declinedApp.reviewedAt && declinedApp.reviewedAt > threeDaysAgo) {
      const daysLeft = Math.ceil((declinedApp.reviewedAt.getTime() + 3*24*60*60*1000 - Date.now()) / (24*60*60*1000));
      return res.status(400).json(     new ApiResponse(400,{},`You can reapply after ${daysLeft} day(s).`)  );
    }
  }

  const { businessName,email,ownerName, gstNumber, businessAddress, contactNumber } = req.body;

  const application = await WholesalerApplication.create({
    user: userId,
    email,
    businessName,
    ownerName, 
    gstNumber,
    businessAddress,
    contactNumber,
    status: "pending",
  });

  // Update user status to pending
  await User.findByIdAndUpdate(userId, { wholesalerStatus: "pending" });

  res.status(201).json({ message: "Application submitted successfully.", application });
};









export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
};
