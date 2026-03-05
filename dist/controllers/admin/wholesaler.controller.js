import asyncHandler from "../../utils/asyncHandler.js";
import { Card } from "../../models/card.model.js";
import { User } from "../../models/user.model.js";
import ApiResponse from "../../utils/apiResponse.js";
/* ======================================================
   GET WHOLESALE CARDS (AGGREGATION)
====================================================== */
export const getAllCards = asyncHandler(async (req, res) => {
    const PAGE_SIZE = 10;
    const { search, category, minPrice, maxPrice, popular, trending, sort, page = "1", limit = PAGE_SIZE.toString(), } = req.query;
    const parsedPage = Math.max(1, parseInt(page));
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (parsedPage - 1) * parsedLimit;
    const match = {
        isAvailableForWholesale: true,
    };
    /* ---------------- SEARCH ---------------- */
    if (search) {
        const regex = new RegExp(search, "i");
        match.$or = [
            { name: regex },
            { categories: regex },
            { description: regex },
            { "specifications.color": regex },
            { "specifications.material": regex },
        ];
    }
    /* ---------------- CATEGORY FILTER ---------------- */
    if (category) {
        match.categories = {
            $regex: new RegExp(category, "i"),
        };
    }
    /* ---------------- PRICE FILTER ---------------- */
    if (minPrice || maxPrice) {
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Infinity;
        match.$expr = {
            $and: [
                {
                    $gte: [
                        { $ifNull: ["$wholesalePrice", "$price"] },
                        min,
                    ],
                },
                {
                    $lte: [
                        { $ifNull: ["$wholesalePrice", "$price"] },
                        max,
                    ],
                },
            ],
        };
    }
    /* ---------------- POPULAR / TRENDING ---------------- */
    if (popular === "true") {
        match.isPopular = true;
    }
    if (trending === "true") {
        match.isTrending = true;
    }
    /* ---------------- SORT ---------------- */
    let sortStage = {
        isTrending: -1,
        isPopular: -1,
        createdAt: -1,
    };
    switch (sort) {
        case "price-asc":
            sortStage = { displayPrice: 1 };
            break;
        case "price-desc":
            sortStage = { displayPrice: -1 };
            break;
        case "rating-desc":
            sortStage = { rating: -1 };
            break;
        case "discount-desc":
            sortStage = { discount: -1 };
            break;
    }
    /* ---------------- AGGREGATION PIPELINE ---------------- */
    const pipeline = [
        { $match: match },
        {
            $addFields: {
                displayPrice: {
                    $ifNull: ["$wholesalePrice", "$price"],
                },
                finalPrice: {
                    $subtract: [
                        { $ifNull: ["$wholesalePrice", "$price"] },
                        { $ifNull: ["$wholesaleDiscount", "$discount", 0] },
                    ],
                },
            },
        },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: parsedLimit },
        {
            $project: {
                name: 1,
                categories: 1,
                description: 1,
                images: 1,
                specifications: 1,
                price: 1,
                wholesalePrice: 1,
                wholesaleDiscount: 1,
                quantityPerBundleWholesale: 1,
                discount: 1,
                finalPrice: 1,
                displayPrice: 1,
                quantityAvailable: 1,
                isPopular: 1,
                isTrending: 1,
                rating: 1,
                reviewsCount: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ];
    const [cards, total] = await Promise.all([
        Card.aggregate(pipeline),
        Card.countDocuments(match),
    ]);
    return res.json({
        success: true,
        count: cards.length,
        total,
        page: parsedPage,
        pages: Math.ceil(total / parsedLimit),
        data: cards,
    });
});
/* ======================================================
   TOTAL WHOLESALERS
====================================================== */
export const totalWholeSaler = asyncHandler(async (_req, res) => {
    const totalWholeSalers = await User.countDocuments({
        wholesalerStatus: "approved",
    });
    return res.status(200).json(new ApiResponse(200, totalWholeSalers, "Total wholesalers fetched successfully"));
});
