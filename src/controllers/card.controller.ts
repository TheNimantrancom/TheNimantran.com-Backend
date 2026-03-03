import { Request, Response } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import { Card, ICard } from "../models/card.model.js"

/* =========================
   GET ALL CARDS
========================= */

export const getAllCards = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const query: Record<string, unknown> = {}

    /* Category filter */
    if (req.query.category) {
      query.categories = {
        $in: [(req.query.category as string).toLowerCase()],
      }
    }

    /* Wholesale filter */
    if (req.query.isAvailableForWholesale) {
      query.isAvailableForWholesale =
        req.query.isAvailableForWholesale === "true"
    }

    /* Price range filter */
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {}

      if (req.query.minPrice) {
        ;(query.price as Record<string, number>).$gte =
          Number(req.query.minPrice)
      }

      if (req.query.maxPrice) {
        ;(query.price as Record<string, number>).$lte =
          Number(req.query.maxPrice)
      }
    }

    /* Popular filter */
    if (req.query.isPopular) {
      query.isPopular = req.query.isPopular === "true"
    }

    /* Trending filter */
    if (req.query.isTrending) {
      query.isTrending = req.query.isTrending === "true"
    }

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const skip = (page - 1) * limit

    /* Sorting */
    const sort: Record<string, 1 | -1> = {}

    if (req.query.sortBy) {
      const [field, order] = (req.query.sortBy as string).split(":")
      sort[field] = order === "desc" ? -1 : 1
    } else {
      sort.createdAt = -1
    }

    const cards: ICard[] = await Card.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sort)

    const total = await Card.countDocuments(query)

    return res.json({
      success: true,
      count: cards.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: cards,
    })
  }
)

/* =========================
   GET CARD BY ID
========================= */

export const getCardById = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params

    const card = await Card.findById(id)

    if (!card) {
      throw new ApiError(404, "Card not found")
    }

    return res.status(200).json(
      new ApiResponse(200, card, "Card fetched successfully")
    )
  }
)

/* =========================
   UPDATE CARD RATING
========================= */

export const updateCardRating = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params
    const { rating, reviewsCount } = req.body

    const card = await Card.findById(id)

    if (!card) {
      throw new ApiError(404, "Card not found")
    }

    if (rating !== undefined) {
      card.rating = Number(rating)
    }

    if (reviewsCount !== undefined) {
      card.reviewsCount = Number(reviewsCount)
    }

    await card.save()

    return res.json({
      success: true,
      data: card,
    })
  }
)