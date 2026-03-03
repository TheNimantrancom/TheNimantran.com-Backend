import { Request, Response } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import Review, { IReview } from "../models/review.model.js"

/* =========================
   CREATE REVIEW
========================= */

interface CreateReviewBody {
  product: string
  rating: number
  comment: string
}

export const createReview = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const { product, rating, comment } =
      req.body as CreateReviewBody

    if (!product || !rating || !comment) {
      throw new ApiError(
        400,
        "Product, rating and comment are required"
      )
    }

    const existingReview = await Review.findOne({
      user: req.user._id,
      product,
    })

    if (existingReview) {
      throw new ApiError(
        400,
        "You have already reviewed this product."
      )
    }

    const review: IReview = await Review.create({
      user: req.user._id,
      product,
      rating,
      comment,
    })

    return res.status(201).json({
      success: true,
      data: review,
    })
  }
)

/* =========================
   UPDATE REVIEW
========================= */

interface UpdateReviewBody {
  rating?: number
  comment?: string
}

export const updateReview = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const { id } = req.params
    const { rating, comment } =
      req.body as UpdateReviewBody

    const review = await Review.findById(id)

    if (!review) {
      throw new ApiError(404, "Review not found")
    }

    const isOwner =
      review.user.toString() ===
      req.user._id.toString()

    const isAdmin =
      req.user.roles?.includes("admin")

    if (!isOwner && !isAdmin) {
      throw new ApiError(
        403,
        "Not authorized to update this review"
      )
    }

    if (rating !== undefined) {
      review.rating = rating
    }

    if (comment !== undefined) {
      review.comment = comment
    }

    await review.save()

    return res.json({
      success: true,
      data: review,
    })
  }
)

/* =========================
   DELETE REVIEW
========================= */

export const deleteReview = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const { id } = req.params

    const review = await Review.findById(id)

    if (!review) {
      throw new ApiError(404, "Review not found")
    }

    const isOwner =
      review.user.toString() ===
      req.user._id.toString()

    const isAdmin =
      req.user.roles?.includes("admin")

    if (!isOwner && !isAdmin) {
      throw new ApiError(
        403,
        "Not authorized to delete this review"
      )
    }

    await review.deleteOne()

    return res.json({
      success: true,
      message: "Review deleted successfully",
    })
  }
)