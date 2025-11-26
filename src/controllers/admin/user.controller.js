import { User } from "../../models/user.model.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import WholesalerApplication from "../../models/wholesaler.model.js"


// get all users from db


export const getAllUsers = asyncHandler(async (req, res) => {
  // Extract query parameters
  const { 
    page = 1, 
    limit = 10, 
    sort = "-createdAt", 
    search = "",
    role = "",
    wholesalerStatus = "",
    isBanned = ""
  } = req.query;

  // Build the filter object
  const filter = { 
    roles: { $nin: ["admin"] } // Exclude admin users by default
  };

  // Add optional filters
  if (role) {
    filter.roles = { $in: [role] };
  }

  if (wholesalerStatus) {
    filter.wholesalerStatus = wholesalerStatus;
  }

  if (isBanned !== "") {
    filter.isBanned = isBanned === "true";
  }

  // Add search functionality
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex }
    ];
  }

  // Create query options
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    select: "-password -refreshToken -__v" // Exclude sensitive fields
  };

  // Execute paginated query
  const users = await User.paginate(filter, options);

  // Transform the response data
  const responseData = {
    users: users.docs,
    pagination: {
      totalUsers: users.totalDocs,
      limit: users.limit,
      totalPages: users.totalPages,
      page: users.page,
      pagingCounter: users.pagingCounter,
      hasPrevPage: users.hasPrevPage,
      hasNextPage: users.hasNextPage,
      prevPage: users.prevPage,
      nextPage: users.nextPage
    }
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      responseData,
      "Users fetched successfully"
    )
  );
});










// DELETE USER (Permanent Removal)
const removeUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Prevent admin from deleting themselves accidentally
  if (req.user._id.toString() === userId) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await User.findByIdAndDelete(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, `User ${user.email} removed successfully`));
});

// BAN USER (Soft Block)
const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Prevent admin from banning themselves
  if (req.user._id.toString() === userId) {
    throw new ApiError(400, "You cannot ban your own account");
  }

  if (user.isBanned) {
    throw new ApiError(400, "User is already banned");
  }

  user.isBanned = true;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { userId }, `User ${user.email} banned successfully`));
});

export const reviewWholesaler = async (req, res) => {
  const { status } = req.body; // approved or declined
  const appId = req.params.id;

  if (!["approved", "declined"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const application = await WholesalerApplication.findById(appId);
  if (!application) {
    return res.status(404).json({ message: "Application not found." });
  }

  application.status = status;
  application.reviewedAt = new Date();
  await application.save();

  // Update user status
  const userStatus = status === "approved" ? "approved" : "declined";
  await User.findByIdAndUpdate(application.user, { wholesalerStatus: userStatus });

  res.json({ message: `Application ${status} successfully.`, application });
};
export const getWholesalerApplications = async (req, res) => {
  const { status } = req.query; // optional: pending, approved, declined
  const filter = status ? { status } : {};
  const applications = await WholesalerApplication.find(filter).populate("user", "name email");
  res.json(applications);
};


export { removeUser, banUser };
