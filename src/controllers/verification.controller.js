import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendMail.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { options } from "../middlewares/auth.middleware.js";
import Order from "../models/order.model.js";
import mongoose from "mongoose"
export const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpKeyBuilder = (email, purpose) => `otp:${email}:${purpose}:data`;

// Verify OTP
export const verifyOtp = async (email, otp, purpose) => {
  const key = otpKeyBuilder(email, purpose);

  const hashedOtp = await redisClient.get(key);
  if (!hashedOtp) {
    console.log(`OTP not found in Redis for key: ${key}`);
    return false;
  }

  // CRITICAL FIX: Ensure OTP is a string and trimmed
  const cleanOtp = String(otp).trim();
  
  console.log(`Verifying OTP for ${email}, purpose: ${purpose}`);
  console.log(`Clean OTP: ${cleanOtp}, Length: ${cleanOtp.length}`);

  const isOtpCorrect = await bcrypt.compare(cleanOtp, hashedOtp);

  if (isOtpCorrect) {
    await redisClient.del(key);
    console.log(`OTP verified and deleted for ${email}`);
  } else {
    console.log(`OTP verification failed for ${email}`);
  }

  return isOtpCorrect;
};

const allowedPurposes = [
  "register",
  "login",
  "reset-password",
  "change-email",
  "verify-email",
  "confirm-order"
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

  console.log(`OTP generated for ${cleanEmail}: ${otp}`); // For debugging - remove in production

  await sendEmail(
    cleanEmail,
    `Your OTP for ${purpose.replace("-", " ")}`,
    `Your OTP is: ${otp}. Valid for 5 minutes.`
  );

  return res
    .status(202)
    .json(new ApiResponse(200, {}, "OTP has been sent successfully"));
});

// CHECK OTP
const checkOtp = asyncHandler(async (req, res) => {
  const { purpose } = req.params;
  const { email, otp } = req.body;

  console.log(`CheckOTP called - Purpose: ${purpose}, Email: ${email}, OTP: ${otp}`);

  if (!allowedPurposes.includes(purpose)) {
    throw new ApiError(400, "Invalid OTP purpose");
  }

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const cleanEmail = email.toLowerCase().trim();

  // CRITICAL FIX: Clean the OTP before verification
  const cleanOtp = String(otp).trim();

  if (cleanOtp.length !== 6) {
    throw new ApiError(400, "OTP must be 6 digits");
  }

  const isCorrect = await verifyOtp(cleanEmail, cleanOtp, purpose);
  
  if (!isCorrect) {
    throw new ApiError(400, "OTP is incorrect or expired");
  }

  // Handle confirm-order purpose FIRST
  if (purpose === "confirm-order") {
    const { orderId } = req.query;

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

  
    const order = await Order.findById(new mongoose.Types.ObjectId(orderId));
    
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Update order status
    order.status = "confirmed";
    order.paymentStatus = "pending";
    
    // Push to status history array (not replace)
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({
      status: "confirmed",
      date: new Date(),
      note: "Order confirmed via OTP verification"
    });

    await order.save();

    // Populate user details for email
    await order.populate("user", "name email phone wholesalerStatus");

    // Send formatted email to owner
    const emailContent = `
      New Order Confirmed!
      
      Order ID: ${order._id}
      Customer: ${order.user?.name || "N/A"}
      Email: ${order.user?.email || "N/A"}
      Phone: ${order.user?.phone || "N/A"}
      Wholesaler: ${order.user?.wholesalerStatus ? "Yes" : "No"}
      
      Total Amount: ₹${order.finalAmount || 0}
      Payment Method: ${order.paymentMethod || "N/A"}
      
      Items: ${order.items?.length || 0} item(s)
      
      Shipping Address:
      ${order.shippingAddress?.address || "N/A"}
      ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}
      ${order.shippingAddress?.pincode || ""}
      
      View order details in admin panel.
    `;

    try {
      await sendEmail(
        process.env.OWNER_EMAIL,
        `New Order Confirmed - ${order._id}`,
        emailContent
      );
    } catch (emailError) {
      console.error("Failed to send email to owner:", emailError);
      // Don't throw error - order is already confirmed
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order._id,
          status: order.status,
          paymentStatus: order.paymentStatus
        },
        "Order confirmed successfully"
      )
    );
  }

  // Handle register purpose
  if (purpose === "register") {
    const token = jwt.sign(
      { email: cleanEmail },
      process.env.REGISTER_TOKEN_SECRET,
      { expiresIn: process.env.REGISTER_TOKEN_EXPIRY }
    );
    res.cookie("emailVerifiedToken", token, options);
  }

  // Handle reset-password purpose
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

export { sendOTP, checkOtp };