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
import emailService from "../services/emailService.js";

/**
 * Utility: sanitize userfg document before sending in response
 * Removes sensitive fields and mongoose internals.
 */
const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;

  // If it's a Mongoose document, convert to plain object
  const obj =
    typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };

  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  delete obj.$__;
  delete obj._doc;

  // Normalize id if you like:
  if (obj._id && !obj.id) {
    obj.id = obj._id;
  }

  return obj;
};

/**
 * Utility to generate and save access & refresh tokens
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
 * Parse string/boolean to boolean (if needed later)
 */
const parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return false;
};


const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password || !phone) {
    throw new ApiError(400, "All fields are required");
  }
  const registerToken = req.cookies.emailVerifiedToken;

if(!registerToken)
{
  throw new ApiError(400,"Email not verified yet")
}
 const token = jwt.verify(registerToken,process.env.REGISTER_TOKEN_SECRET)
if(!token)
  {
  throw new ApiError(400,"Email not verified yet")
}

  if (!/^\d{10}$/.test(phone)) {
    throw new ApiError(400, "Phone number must be 10 digits");
  }

  if (!/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "Invalid email format");
  }

  const isExistingUser = await User.findOne({ email
  }).lean();

  if (isExistingUser) {
    throw new ApiError(409, "Try using another email");
  }




  const user = await User.create({ name, email, password, phone,isVerified:true });

  const userSafe = sanitizeUser(user);


    await emailService.sendWelcomeEmail(email,name)


  const responseData = {
    ...userSafe,
    isVerified: userSafe?.isVerified ?? false,
  };



  return res
    .status(201)
    .json(
      new ApiResponse(201, responseData, "User registered successfully")
    );
});


const loginUser = asyncHandler(async (req, res) => {
  console.log("I have been hitted stage 1");
  let user;
  const { otp, emailOrPhone, password, email } = req.body;

  if (otp) {
    
    if (!email) throw new ApiError(400, "Email is required for OTP verification");

    user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User not found");

    console.log(`otp :${otp} and type : ${typeof otp}`);

    const otpVerified = await verifyOtp(email, otp,"login");
    if (!otpVerified) throw new ApiError(400, "Invalid OTP");
  } else {
    // Password login flow
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

    if (!user.password) {
      throw new ApiError(400, "Try Login with Google");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) throw new ApiError(401, "Incorrect password");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const userSafe = sanitizeUser(user);

  console.log("I have been hitted stage 2");
  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          ...userSafe,
          isVerified: userSafe?.isVerified ?? false,
        },
        "Login successful"
      )
    );
});

/**
 * GOOGLE OAUTH CALLBACK LOGIN
 */
export const googleCallbackLogin = asyncHandler(async (req, res) => {
  let user = await User.findOne({ email: req.user.email });

  if (!user) {
    user = await User.create({
      googleId: req.user.googleId,
      name: req.user.name,
      email: req.user.email,
      picture: req.user.picture,
      roles: ["user"],
      wholesalerStatus: "none",
      isVerified: true,
    });
    await emailService.sendWelcomeEmail(req.user.email,req.user.name)
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  res
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options);

  // Redirect to frontend (no JSON body)
  res.redirect(`https://thenimantran.com/`);
});

/**
 * LOGOUT USER
 */
const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  return res
    .status(202)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

/**
 * UPDATE PROFILE
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { name, email, otp, phone } = req.body;

  const updates = {};
  if (name?.trim()) updates.name = name.trim();
  if (phone && /^\d{10}$/.test(phone)) updates.phone = phone;

  if (email && /\S+@\S+\.\S+/.test(email)) {
    const hashedOtp = await redisClient.get(`otp:data:${email}`);
    if (!hashedOtp) throw new ApiError(404, "OTP expired or not found");

    const isVerified = await bcrypt.compare(otp, hashedOtp);
    if (!isVerified) throw new ApiError(400, "Email not verified by OTP");

    updates.email = email;
    updates.isVerified = true;
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  const userSafe = sanitizeUser(updatedUser);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          ...userSafe,
          isVerified: userSafe?.isVerified ?? false,
        },
        "Profile updated"
      )
    );
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

  // Need to explicitly select refreshToken because it's select:false in schema
  const user = await User.findById(decoded._id).select("+refreshToken");
  if (!user) throw new ApiError(404, "User not found");

  if (user.refreshToken !== token) {
    throw new ApiError(403, "Refresh token mismatch");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Token refreshed"
      )
    );
});

/**
 * GET CURRENT USER
 */
const getCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const userSafe = sanitizeUser(user);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {
          ...userSafe,
          isVerified: userSafe?.isVerified ?? false,
        },
        "User fetched successfully"
      )
    );
});

/**
 * APPLY WHOLESALER
 */
export const applyWholesaler = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const pendingApp = await WholesalerApplication.findOne({
    user: userId,
    status: "pending",
  });

  if (pendingApp) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          200,
          {},
          "You already have pending Application"
        )
      );
  }

  const declinedApp = await WholesalerApplication.findOne({
    user: userId,
    status: "declined",
  }).sort({ reviewedAt: -1 }); // get latest decline

  if (declinedApp) {
    const threeDaysAgo = new Date(
      Date.now() - 3 * 24 * 60 * 60 * 1000
    );
    if (declinedApp.reviewedAt && declinedApp.reviewedAt > threeDaysAgo) {
      const daysLeft = Math.ceil(
        (declinedApp.reviewedAt.getTime() +
          3 * 24 * 60 * 60 * 1000 -
          Date.now()) /
          (24 * 60 * 60 * 1000)
      );
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            {},
            `You can reapply after ${daysLeft} day(s).`
          )
        );
    }
  }

  const {
    businessName,
    email,
    ownerName,
    gstNumber,
    businessAddress,
    contactNumber,
  } = req.body;

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

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        application,
        "Application submitted successfully."
      )
    );
});

const resetPassword = asyncHandler(async(req,res)=>{

  const otpToken = req.cookies.resetPassToken;
   const {password} = req.body;

   if(!password)
   {
    throw new ApiError(400,"New password is required")
   }
  if(!otpToken)
  {
    throw new ApiError(400,"Verify with otp first")
  }

  const resetPassToken = jwt.verify(otpToken,process.env.RESETPASS_TOKEN_SECRET)
  
  if(!resetPassToken)
  {
    throw new ApiError(401,"Not authorized to change password")
  }


  const user = await User.findOneAndUpdate({email:resetPassToken.email},{
    $set:{
      password
    }
  },{
    new:true
  })

  if(!user)
  {
    throw new ApiError(400,"Unable to update password ,Try later!")
  }


  return res.status(200).json(
    new ApiResponse(200,{},"Password changed successfully")
  )

})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  resetPassword
};
