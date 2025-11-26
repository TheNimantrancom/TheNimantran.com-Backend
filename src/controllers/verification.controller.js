import asyncHandler from "../utils/asyncHandler.js";
import { redisClient } from "../middlewares/otp.middleware.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendMail.js";

// OTP Generator
export const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const verifyOtp = async (email, otp) => {
  const key = `otp:data:${email}`;

  const hashedOtp = await redisClient.get(key);
    
  console.log("I am the incoming otp",otp)
  if (!hashedOtp) {
    return false; // OTP not found or already expired
  }

  const isOtpCorrect = await bcrypt.compare(otp, hashedOtp);

  if (isOtpCorrect) {
    await redisClient.del(key);
  }

  return isOtpCorrect;
};

const sendOTP = asyncHandler(async (req, res) => {
  console.log("I am working here for the gmail");

  const OTP_EXPIRY = 5 * 60;  // 5 minutes
  const RATE_LIMIT = 100;      // 10 OTPs per hour
  const RESEND_LIMIT = 0;    // 60 sec cooldown
  const email = req.body?.email || req.user?.email;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // console.log("I got the data in the email");
  const now = Date.now();

  // 1. Resend cooldown check
  const lastSent = await redisClient.get(`otp:lastSent:${email}`);
  if (lastSent && now - parseInt(lastSent) < RESEND_LIMIT * 1000) {
    throw new ApiError(429, "Please wait before requesting another OTP.");
  }

  // 2. Rate limit per hour
  const sentCount = await redisClient.get(`otp:count:${email}`);
  if (sentCount && parseInt(sentCount) >= RATE_LIMIT) {
    throw new ApiError(429, "OTP limit exceeded. Try again after 1 hour.");
  }

  // 3. Generate and hash OTP
  const otp = generateOTP();
  const hashedOtp = await bcrypt.hash(otp, 10);

  // ❌ Delete old OTP if exists (to avoid conflicts and free space)
  await redisClient.del(`otp:data:${email}`);

  // ✅ Save new OTP with expiry
  await redisClient.set(`otp:data:${email}`, hashedOtp, { EX: OTP_EXPIRY });

  // 4. Update resend cooldown
  await redisClient.set(`otp:lastSent:${email}`, now.toString(), { EX: RESEND_LIMIT });

  // 5. Track OTP request count (increment + set expiry 1 hour)
  await redisClient.incr(`otp:count:${email}`);
  await redisClient.expire(`otp:count:${email}`, 3600);

  // 6. Send email
  await sendEmail(email, "Your OTP for Email Verification", `Your OTP is: ${otp}`);

  // 7. Respond
  return res.status(202).json(
    new ApiResponse(200, {}, "OTP has been sent successfully")
  );
});

const checkOtp = asyncHandler(async(req,res)=>{


  const {email,otp} = req.body 

if(!/^\S+@\S+\.\S+$/.test(email))
{
   throw new ApiError(400,"Please provide a valid email")

}

  if(!otp)
  {
    throw new ApiError(400,"Please provide the email and the otp")
  }

 const isCorrect = await verifyOtp(email,otp)







console.log(isCorrect)



return res.status(200)
.json(
  new ApiResponse(200,{isCorrect},"Otp checked ")
)






})

export { sendOTP,verifyOtp, checkOtp};
