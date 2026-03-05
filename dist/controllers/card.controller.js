import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { Card } from "../models/card.model.js";
export const getAllCards = asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.category) {
        query.categories = {
            $in: [req.query.category.toLowerCase()],
        };
    }
    if (req.query.isAvailableForWholesale) {
        query.isAvailableForWholesale =
            req.query.isAvailableForWholesale === "true";
    }
    if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) {
            ;
            query.price.$gte =
                Number(req.query.minPrice);
        }
        if (req.query.maxPrice) {
            ;
            query.price.$lte =
                Number(req.query.maxPrice);
        }
    }
    if (req.query.isPopular) {
        query.isPopular = req.query.isPopular === "true";
    }
    if (req.query.isTrending) {
        query.isTrending = req.query.isTrending === "true";
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sort = {};
    if (req.query.sortBy) {
        const [field, order] = req.query.sortBy.split(":");
        sort[field] = order === "desc" ? -1 : 1;
    }
    else {
        sort.createdAt = -1;
    }
    const cards = await Card.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sort);
    const total = await Card.countDocuments(query);
    return res.json({
        success: true,
        count: cards.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: cards,
    });
});
export const getCardById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const card = await Card.findById(id);
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    return res.status(200).json(new ApiResponse(200, card, "Card fetched successfully"));
});
export const updateCardRating = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, reviewsCount } = req.body;
    const card = await Card.findById(id);
    if (!card) {
        throw new ApiError(404, "Card not found");
    }
    if (rating !== undefined) {
        card.rating = Number(rating);
    }
    if (reviewsCount !== undefined) {
        card.reviewsCount = Number(reviewsCount);
    }
    await card.save();
    return res.json({
        success: true,
        data: card,
    });
});
