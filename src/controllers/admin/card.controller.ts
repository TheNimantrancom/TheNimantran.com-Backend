import { Request, Response } from "express"
import ApiError from "../../utils/apiError.js"
import ApiResponse from "../../utils/apiResponse.js"
import asyncHandler from "../../utils/asyncHandler.js"
import { Card } from "../../models/card.model.js"
import { deleteFromS3, generateSignedUrl } from "../../utils/awsS3.js"
import { refreshSignedUrlsIfNeeded } from "../../utils/signedUrlCache.js"
import { Cart } from "../../models/cart.model.js"

interface CreateCardBody {
  name: string
  categories: string[] | string
  price: number
  quantityAvailable: number
  specifications?: {
    material?: string
    dimensions?: string
    printing?: string
    weight?: string
    color?: string
    customizable?: boolean | string
  }
  isPopular?: boolean | string
  isTrending?: boolean | string
  primaryImageKey: string
  secondaryImageKey: string
  discount?: number
  wholesalePrice?: number
  wholesaleDiscount?: number
  isAvailableForWholesale?: boolean | string
  quantityPerBundleCustomer?: number
  quantityPerBundleWholesale?: number
  description?: string
}

export const createCard = asyncHandler(
  async (req: Request<{}, {}, CreateCardBody>, res: Response): Promise<void> => {
    const {
      name,
      categories,
      price,
      quantityAvailable,
      specifications,
      isPopular,
      isTrending,
      primaryImageKey,
      secondaryImageKey,
      discount,
      wholesalePrice,
      wholesaleDiscount,
      isAvailableForWholesale,
      quantityPerBundleCustomer,
      quantityPerBundleWholesale,
      description
    } = req.body

    if (!primaryImageKey || !secondaryImageKey) {
      throw new ApiError(400, "Primary and Secondary image keys are required")
    }

    if (!name || !categories || price === undefined || quantityAvailable === undefined) {
      throw new ApiError(400, "Required fields missing: name, category, price, quantityAvailable")
    }

    const primaryImageUrl = generateSignedUrl(primaryImageKey)
    const secondaryImageUrl = generateSignedUrl(secondaryImageKey)

    const formattedSpecs = {
      material: specifications?.material || "",
      dimensions: specifications?.dimensions || "",
      printing: specifications?.printing || "",
      weight: specifications?.weight || "",
      color: specifications?.color || "",
      customizable: specifications?.customizable === "true" || specifications?.customizable === true
    }

    const formattedCategories = Array.isArray(categories)
      ? categories.map((c) => c.toLowerCase().trim())
      : [categories.toLowerCase().trim()]

    const card = await Card.create({
      name,
      categories: formattedCategories,
      price: Number(price),
      quantityAvailable: Number(quantityAvailable),
      discount: discount ? Number(discount) : 0,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : 9999,
      wholesaleDiscount: wholesaleDiscount ? Number(wholesaleDiscount) : 0,
      isAvailableForWholesale: isAvailableForWholesale === "true" || isAvailableForWholesale === true,
      description: description || "",
      isPopular: isPopular === "true" || isPopular === true,
      isTrending: isTrending === "true" || isTrending === true,
      specifications: formattedSpecs,
      quantityPerBundleCustomer,
      quantityPerBundleWholesale,
      images: {
        primaryImage: primaryImageUrl,
        primaryImageKey,
        primaryUrlExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        secondaryImage: secondaryImageUrl,
        secondaryImageKey,
        secondaryUrlExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000)
      }
    })

    res.status(201).json(new ApiResponse(201, card, "Card created successfully"))
  }
)

export const updateCard = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid card ID")
    }

    const card = await Card.findById(id)
    if (!card) throw new ApiError(404, "Card not found")

    const {
      name,
      categories,
      price,
      quantityAvailable,
      discount,
      wholesalePrice,
      wholesaleDiscount,
      rating,
      description,
      reviewsCount,
      isAvailableForWholesale,
      isPopular,
      isTrending,
      specifications,
      primaryImageKey,
      quantityPerBundleCustomer,
      quantityPerBundleWholesale,
      secondaryImageKey
    } = req.body

    if (!name || !categories || price === undefined || quantityAvailable === undefined) {
      throw new ApiError(400, "Required fields missing: name, categories, price, quantityAvailable")
    }

    const formattedCategories = Array.isArray(categories)
      ? categories.map((c: string) => c.toLowerCase().trim())
      : [categories.toLowerCase().trim()]

    const updateData: any = {
      name,
      categories: formattedCategories,
      price: Number(price),
      quantityAvailable: Number(quantityAvailable),
      discount: discount ? Number(discount) : 0,
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : card.wholesalePrice,
      wholesaleDiscount: wholesaleDiscount ? Number(wholesaleDiscount) : card.wholesaleDiscount,
      rating: rating !== undefined ? Number(rating) : card.rating,
      description: description ?? card.description,
      quantityPerBundleCustomer:
        quantityPerBundleCustomer !== undefined
          ? Number(quantityPerBundleCustomer)
          : card.quantityPerBundleCustomer,
      quantityPerBundleWholesale:
        quantityPerBundleWholesale !== undefined
          ? Number(quantityPerBundleWholesale)
          : card.quantityPerBundleWholesale,
      reviewsCount: reviewsCount !== undefined ? Number(reviewsCount) : card.reviewsCount,
      isAvailableForWholesale: isAvailableForWholesale === "true" || isAvailableForWholesale === true,
      isPopular: isPopular === "true" || isPopular === true,
      isTrending: isTrending === "true" || isTrending === true,
      specifications: {
        ...card.specifications,
        ...specifications
      }
    }

    const imagesUpdate: any = { ...card.images }

    if (primaryImageKey) {
      if (card.images?.primaryImageKey) {
        try {
          await deleteFromS3(card.images.primaryImageKey)
        } catch {}
      }

      imagesUpdate.primaryImageKey = primaryImageKey
      imagesUpdate.primaryImage = generateSignedUrl(primaryImageKey)
      imagesUpdate.primaryUrlExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)
    }

    if (secondaryImageKey) {
      if (card.images?.secondaryImageKey) {
        try {
          await deleteFromS3(card.images.secondaryImageKey)
        } catch {}
      }

      imagesUpdate.secondaryImageKey = secondaryImageKey
      imagesUpdate.secondaryImage = generateSignedUrl(secondaryImageKey)
      imagesUpdate.secondaryUrlExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000)
    }

    updateData.images = imagesUpdate

    const updatedCard = await Card.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })

    if (!updatedCard) throw new ApiError(500, "Failed to update card")

    res.status(200).json(new ApiResponse(200, updatedCard, "Card updated successfully"))
  }
)

export const getCardById = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const card = await Card.findById(req.params.id)

    if (!card) throw new ApiError(404, "Card not found")

    const updated = refreshSignedUrlsIfNeeded(card)
    if (updated) await card.save()

    res.status(200).json(new ApiResponse(200, card, "Card fetched successfully"))
  }
)

export const deleteCard = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params

    const card = await Card.findById(id)
    if (!card) throw new ApiError(404, "Card not found")

    await Cart.updateMany(
      { "cards.cardId": card._id },
      { $pull: { cards: { cardId: card._id } } }
    )

    try {
      if (card.images?.primaryImageKey) {
        await deleteFromS3(card.images.primaryImageKey)
      }
    } catch {}

    try {
      if (card.images?.secondaryImageKey) {
        await deleteFromS3(card.images.secondaryImageKey)
      }
    } catch {}

    await card.deleteOne()

    res.status(200).json(
      new ApiResponse(200, null, "Card deleted and removed from all carts")
    )
  }
)

export const getPopularCards = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cards = await Card.find({ isPopular: true }).sort({ createdAt: -1 }).limit(10)

    let updated = false
    for (const c of cards) {
      if (refreshSignedUrlsIfNeeded(c)) updated = true
    }

    if (updated) await Promise.all(cards.map((c) => c.save()))

    res.status(200).json(new ApiResponse(200, cards, "Popular cards fetched successfully"))
  }
)

export const countTotalCards = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const total = await Card.countDocuments()

    res.json(new ApiResponse(200, { total }, "Total cards count fetched"))
  }
)

export const getTrendingCards = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const cards = await Card.find({ isTrending: true }).sort({ createdAt: -1 }).limit(10)

    let updated = false
    for (const c of cards) {
      if (refreshSignedUrlsIfNeeded(c)) updated = true
    }

    if (updated) await Promise.all(cards.map((c) => c.save()))

    res.status(200).json(new ApiResponse(200, cards, "Trending cards fetched successfully"))
  }
)

export const getAllCards = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const query: any = {}

    if (req.query.category) {
      query.categories = (req.query.category as string).toLowerCase()
    }

    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {}
      if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice)
      if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice)
    }

    if (req.query.isPopular) query.isPopular = req.query.isPopular === "true"
    if (req.query.isTrending) query.isTrending = req.query.isTrending === "true"

    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 20
    const skip = (page - 1) * limit

    const sort: any = {}

    if (req.query.sortBy) {
      const parts = (req.query.sortBy as string).split(":")
      sort[parts[0]] = parts[1] === "desc" ? -1 : 1
    } else {
      sort.createdAt = -1
    }

    const cards = await Card.find(query).skip(skip).limit(limit).sort(sort)
    const total = await Card.countDocuments(query)

    let updated = false
    for (const c of cards) {
      if (refreshSignedUrlsIfNeeded(c)) updated = true
    }

    if (updated) await Promise.all(cards.map((c) => c.save()))

    res.status(200).json({
      success: true,
      count: cards.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: cards
    })
  }
)

export const updateCardRating = asyncHandler(
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params
    const { rating, reviewsCount } = req.body

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      throw new ApiError(400, "Invalid id")
    }

    const card = await Card.findById(id)
    if (!card) throw new ApiError(404, "Card not found")

    if (rating !== undefined) card.rating = Number(rating)
    if (reviewsCount !== undefined) card.reviewsCount = Number(reviewsCount)

    await card.save()

    res.status(200).json(new ApiResponse(200, card, "Card rating updated"))
  }
)