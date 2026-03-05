import { Request, Response } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import { Card } from "../models/card.model.js"
import { ICard } from "../types/models/card.types.js"


interface SearchQuery {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  page?: string
  limit?: string
}



export const searchCards = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const {
      q = "",
      category,
      minPrice = "0",
      maxPrice = "100000",
      page = "1",
      limit = "12",
    } = req.query as SearchQuery

    const parsedPage = Math.max(1, parseInt(page, 10))
    const parsedLimit = Math.min(
      50,
      Math.max(1, parseInt(limit, 10))
    )

    const parsedMinPrice = Number(minPrice)
    const parsedMaxPrice = Number(maxPrice)

    const filter: Record<string, unknown> = {
      price: {
        $gte: parsedMinPrice,
        $lte: parsedMaxPrice,
      },
    }

    if (category) {
      filter.categories = {
        $in: [category.toLowerCase()],
      }
    }

    const trimmedQuery = q.trim()
    const useTextSearch =
      trimmedQuery.length > 1

    if (useTextSearch) {
      filter.$text = { $search: trimmedQuery }
    }

    const projection = useTextSearch
      ? { score: { $meta: "textScore" } }
      : {}

    const sort = useTextSearch
      ? { score: { $meta: "textScore" } }
      : { createdAt: -1 }

    const skip =
      (parsedPage - 1) * parsedLimit

    const [cards, total]: [
      ICard[],
      number
    ] = await Promise.all([
      Card.find(filter, projection)
        .sort(sort as any)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),

      Card.countDocuments(filter),
    ])

    return res.status(200).json({
      success: true,
      data: cards,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(
          total / parsedLimit
        ),
      },
    })
  }
)



export const searchSuggestions =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      const { q = "" } =
        req.query as { q?: string }

      const trimmedQuery = q.trim()

      if (!trimmedQuery) {
        return res.json({
          success: true,
          data: [],
        })
      }

      const results: ICard[] =
        await Card.find(
          {
            $text: {
              $search: trimmedQuery,
            },
          },
          {
            score: {
              $meta: "textScore",
            },
            name: 1,
            categories: 1,
            "specifications.color": 1,
          }
        )
          .sort({
            score: {
              $meta: "textScore",
            },
          } as any)
          .limit(6)
          .lean()

      return res.json({
        success: true,
        data: results,
      })
    }
  )