import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendMail.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import { User }from "../models/user.model.js";
import { options } from "../middlewares/auth.middleware.js";

// Generate 6-digit OTP
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Verify OTP
const verifyOtp = async (email, otp,purpose) => {
  const key = `otp:data:${email}:${purpose}`;
  const hashedOtp = await redisClient.get(key);

  if (!hashedOtp) return false;

  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);

  if (isOtpCorrect) {
    await redisClient.del(key);
  }

  return isOtpCorrect;
};


const sendOTP = asyncHandler(async (req, res) => {
  const OTP_EXPIRY = 5 * 60; 
  const RATE_LIMIT = 10;    
  const RESEND_LIMIT = 60;  

  const { purpose } = req.params;

  const allowedPurposes = ["register", "login", "reset-password", "change-email", "verify-email"];

  if (!purpose || !allowedPurposes.includes(purpose)) {
    throw new ApiError(400, "Invalid OTP purpose");
  }

  const email = req.body?.email || req.user?.email;
  if (!email) throw new ApiError(400, "Email is required");

  const cleanEmail = email.toLowerCase().trim();
   if(purpose==="login"){
  const user = await User.findOne({ email: cleanEmail });
  if (!user) throw new ApiError(404, "Register first to Login");
   }


  const now = Date.now();

  // Cooldown check
  const lastSentKey = `otp:${cleanEmail}:${purpose}:lastSent`;
  const lastSent = await redisClient.get(lastSentKey);

  if (lastSent && now - parseInt(lastSent) < RESEND_LIMIT * 1000) {
    throw new ApiError(429, "Please wait before requesting another OTP.");
  }

  // Rate limit per hour
  const rateKey = `otp:${cleanEmail}:${purpose}:count`;
  const sentCount = await redisClient.get(rateKey);

  if (sentCount && parseInt(sentCount) >= RATE_LIMIT) {
    throw new ApiError(429, "OTP limit exceeded. Try again after 1 hour.");
  }

  // Generate OTP + Hash
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  const otpKey = `otp:${cleanEmail}:${purpose}:data`;

  // Clear previous OTP for same purpose
  await redisClient.del(otpKey);

  // Store new OTP
  await redisClient.set(otpKey, hashedOtp, { EX: OTP_EXPIRY });

  // Update cooldown timestamp
  await redisClient.set(lastSentKey, now.toString(), { EX: RESEND_LIMIT });

  // Update hourly rate-limit counter
  await redisClient.incr(rateKey);
  await redisClient.expire(rateKey, 3600);

  // Send Email
  await sendEmail(
    cleanEmail,
    `Your OTP for ${purpose.replace("-", " ")}`,
    `Your OTP is: ${otp}`
  );

  return res
    .status(202)
    .json(new ApiResponse(200, {}, "OTP has been sent successfully"));
});



const checkOtp = asyncHandler(async (req, res) => {
  const {purpose} = req.params;
  const { email, otp } = req.body;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new ApiError(400, "Please provide a valid email");
  }

  if (!otp) {
    throw new ApiError(400, "Please provide the email and OTP");
  }

  const isCorrect = await verifyOtp(email, otp,purpose);

  if(purpose==="register")
  { 
    const emailVerifiedToken = jwt.sign(
        {
          email
        },
        process.env.REGISTER_TOKEN_SECRET,
        {
          expiresIn: process.env.REGISTER_TOKEN_EXPIRY,
        }
      );
    
    res.cookie("emailVerifiedToken",emailVerifiedToken,options)
  };
  if(purpose==="reset-password")
  {
     const resetPassToken = jwt.sign(
        {
          email
        },
        process.env.RESTPASS_TOKEN_SECRET,
        {
          expiresIn: process.env.RESETPASS_TOKEN_EXPIRY,
        }
      );
      res.cookie("resetPassToken",resetPassToken,options)
  }

  return res.status(200).json(
    new ApiResponse(200, { isCorrect }, "Otp checked")
  );
});

export { sendOTP, verifyOtp, checkOtp };
