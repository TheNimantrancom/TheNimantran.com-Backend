import { Request, Response } from "express"
import { User } from "../../models/user.model.js"
import ApiError from "../../utils/apiError.js"
import ApiResponse from "../../utils/apiResponse.js"
import asyncHandler from "../../utils/asyncHandler.js"
import WholesalerApplication from "../../models/wholesaler.model.js"

interface UserQuery {
  page?: string
  limit?: string
  sort?: string
  search?: string
  role?: string
  wholesalerStatus?: string
  isBanned?: string
}

interface ReviewBody {
  status: "approved" | "declined"
}

export const getUserCount = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const total = await User.countDocuments()

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { total },
          "Users count fetched successfully"
        )
      )
  }
)

export const getAllUsers = asyncHandler(
  async (
    req: Request<{}, {}, {}, UserQuery>,
    res: Response
  ): Promise<void> => {
    const {
      page = "1",
      limit = "10",
      sort = "-createdAt",
      search = "",
      role = "",
      wholesalerStatus = "",
      isBanned = ""
    } = req.query

    const filter: any = {
      roles: { $nin: ["admin"] }
    }

    if (role) {
      filter.roles = { $in: [role] }
    }

    if (wholesalerStatus) {
      filter.wholesalerStatus = wholesalerStatus
    }

    if (isBanned !== "") {
      filter.isBanned = isBanned === "true"
    }

    if (search) {
      const searchRegex = new RegExp(search, "i")

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ]
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      select: "-password -refreshToken -__v"
    }

    const users = await (User as any).paginate(filter, options)

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
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          responseData,
          "Users fetched successfully"
        )
      )
  }
)

const removeUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params

    if (!userId) {
      throw new ApiError(400, "User ID is required")
    }

    if (req.user?._id.toString() === userId) {
      throw new ApiError(400, "You cannot delete your own account")
    }

    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, "User not found")
    }

    await User.findByIdAndDelete(userId)

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {},
          `User ${user.email} removed successfully`
        )
      )
  }
)

const banUser = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params

    if (!userId) {
      throw new ApiError(400, "User ID is required")
    }

    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, "User not found")
    }

    if (req.user?._id.toString() === userId) {
      throw new ApiError(400, "You cannot ban your own account")
    }

    if (user.isBanned) {
      throw new ApiError(400, "User is already banned")
    }

    user.isBanned = true
    await user.save()

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { userId },
          `User ${user.email} banned successfully`
        )
      )
  }
)

export const reviewWholesaler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body as ReviewBody
    const { id: appId } = req.params as { id: string }

    if (!["approved", "declined"].includes(status)) {
      throw new ApiError(400, "Invalid status")
    }

    const application = await WholesalerApplication.findById(appId)

    if (!application) {
      throw new ApiError(404, "Application not found")
    }

    application.status = status
    application.reviewedAt = new Date()

    await application.save()

    const userStatus = status === "approved" ? "approved" : "declined"

    await User.findByIdAndUpdate(application.user, {
      wholesalerStatus: userStatus
    })

    res.json(
      new ApiResponse(
        200,
        application,
        `Application ${status} successfully`
      )
    )
  }
)

export const getWholesalerApplications = asyncHandler(
  async (
    req: Request<{}, {}, {}, { status?: string }>,
    res: Response
  ): Promise<void> => {
    const { status } = req.query

    const filter = status ? { status } : {}

    const applications = await WholesalerApplication.find(filter)
      .populate("user", "name email")

    res.json(
      new ApiResponse(
        200,
        applications,
        "Applications fetched successfully"
      )
    )
  }
)

export { removeUser, banUser }