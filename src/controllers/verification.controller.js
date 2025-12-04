import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendMail.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import { User }from "../models/user.model.js";
// utils
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// unified redis key builder
const otpKeyBuilder = (email, purpose) =>
  `otp:${email}:${purpose}:data`;

// Verify OTP
const verifyOtp = async (email, otp, purpose) => {
  const key = otpKeyBuilder(email, purpose);

  const hashedOtp = await redisClient.get(key);
  if (!hashedOtp) return false;

  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);

  if (isOtpCorrect) {
    await redisClient.del(key);
  }

  return isOtpCorrect;
};

const allowedPurposes = [
  "register",
  "login",
  "reset-password",
  "change-email",
  "verify-email",
];

// SEND OTP
const sendOTP = asyncHandler(async (req, res) => {
  const OTP_EXPIRY = 5 * 60;
  const RATE_LIMIT = 10;
  const RESEND_LIMIT = 60;

  const { purpose } = req.params;

  if (!purpose || !allowedPurposes.includes(purpose)) {
    throw new ApiError(400, "Invalid OTP purpose");
  }

  const email = req.body?.email || req.params?.email || req.user?.email;
  if (!email) throw new ApiError(400, "Email is required");

  const cleanEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: cleanEmail });

  if (purpose === "login" || purpose === "reset-password") {
    if (!user) throw new ApiError(404, "User does not exist");
  }

  if (purpose === "register") {
    if (user) throw new ApiError(400, "User already registered");
  }

  const now = Date.now();

  // Cooldown key
  const lastSentKey = `otp:${cleanEmail}:${purpose}:lastSent`;
  const lastSent = await redisClient.get(lastSentKey);

  if (lastSent && now - parseInt(lastSent) < RESEND_LIMIT * 1000) {
    throw new ApiError(429, "Please wait before requesting another OTP.");
  }

  // Rate limit
  const rateKey = `otp:${cleanEmail}:${purpose}:count`;
  const sentCount = await redisClient.get(rateKey);

  if (sentCount && parseInt(sentCount) >= RATE_LIMIT) {
    throw new ApiError(429, "OTP limit exceeded. Try again after 1 hour.");
  }

  // Generate + hash
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const otpKey = otpKeyBuilder(cleanEmail, purpose);

  await redisClient.del(otpKey);
  await redisClient.set(otpKey, hashedOtp, { EX: OTP_EXPIRY });

  await redisClient.set(lastSentKey, now.toString(), { EX: RESEND_LIMIT });
  await redisClient.incr(rateKey);
  await redisClient.expire(rateKey, 3600);

  await sendEmail(
    cleanEmail,
    `Your OTP for ${purpose.replace("-", " ")}`,
    `Your OTP is: ${otp}`
  );

  return res
    .status(202)
    .json(new ApiResponse(200, {}, "OTP has been sent successfully"));
});

// CHECK OTP
const checkOtp = asyncHandler(async (req, res) => {
  const { purpose } = req.params;
  const { email, otp } = req.body;

  if (!allowedPurposes.includes(purpose)) {
    throw new ApiError(400, "Invalid OTP purpose");
  }

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const cleanEmail = email.toLowerCase().trim();

  const isCorrect = await verifyOtp(cleanEmail, otp, purpose);
  if (!isCorrect) throw new ApiError(400, "OTP is incorrect or expired");

  if (purpose === "register") {
    const token = jwt.sign(
      { email: cleanEmail },
      process.env.REGISTER_TOKEN_SECRET,
      { expiresIn: process.env.REGISTER_TOKEN_EXPIRY }
    );
    res.cookie("emailVerifiedToken", token, options);
  }

  if (purpose === "reset-password") {
    const token = jwt.sign(
      { email: cleanEmail },
      process.env.RESETPASS_TOKEN_SECRET,
      { expiresIn: process.env.RESETPASS_TOKEN_EXPIRY }
    );
    res.cookie("resetPassToken", token, options);
  }

  return res.status(200).json(
    new ApiResponse(200, { isCorrect: true }, "OTP verified successfully")
  );
});

export { sendOTP, verifyOtp, checkOtp };
