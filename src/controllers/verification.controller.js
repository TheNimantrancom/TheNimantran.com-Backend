import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendMail.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import User from "../models/user.model.js";

// Generate 6-digit OTP
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Verify OTP
const verifyOtp = async (email, otp) => {
  const key = `otp:data:${email}`;
  const hashedOtp = await redisClient.get(key);

  if (!hashedOtp) return false;

  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);

  if (isOtpCorrect) {
    await redisClient.del(key);
  }

  return isOtpCorrect;
};

// Send OTP
const sendOTP = asyncHandler(async (req, res) => {
  const OTP_EXPIRY = 5 * 60; // 5 min
  const RATE_LIMIT = 10;     // Max 10 OTP/hr
  const RESEND_LIMIT = 60;   // 1 minute cooldown

  const email = req.body?.email || req.user?.email;
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new ApiError(404, "User with this email does not exist");
  }

  if (!email) throw new ApiError(400, "Email is required");

  const now = Date.now();

  // Cooldown check
  const lastSent = await redisClient.get(`otp:lastSent:${email}`);
  if (lastSent && now - parseInt(lastSent) < RESEND_LIMIT * 1000) {
    throw new ApiError(429, "Please wait before requesting another OTP.");
  }

  // Rate limit per hour
  const sentCount = await redisClient.get(`otp:count:${email}`);
  if (sentCount && parseInt(sentCount) >= RATE_LIMIT) {
    throw new ApiError(429, "OTP limit exceeded. Try again after 1 hour.");
  }

  // Generate + hash OTP
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  await redisClient.del(`otp:data:${email}`);
  await redisClient.set(`otp:data:${email}`, hashedOtp, { EX: OTP_EXPIRY });

  await redisClient.set(`otp:lastSent:${email}`, now.toString(), { EX: RESEND_LIMIT });

  await redisClient.incr(`otp:count:${email}`);
  await redisClient.expire(`otp:count:${email}`, 3600);

  await sendEmail(email, "Your OTP for Email Verification", `Your OTP is: ${otp}`);

  return res.status(202).json(new ApiResponse(200, {}, "OTP has been sent successfully"));
});

// Check OTP
const checkOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email");
  }

  if (!otp) {
    throw new ApiError(400, "Please provide the email and OTP");
  }

  const isCorrect = await verifyOtp(email, otp);

  return res.status(200).json(
    new ApiResponse(200, { isCorrect }, "Otp checked")
  );
});

export { sendOTP, verifyOtp, checkOtp };
