import asyncHandler from "../utils/asyncHandler.js";
import { Card } from "../models/card.model.js";
/* =========================
   SEARCH CARDS
========================= */
export const searchCards = asyncHandler(async (req, res) => {
    const { q = "", category, minPrice = "0", maxPrice = "100000", page = "1", limit = "12", } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10));
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const parsedMinPrice = Number(minPrice);
    const parsedMaxPrice = Number(maxPrice);
    const filter = {
        price: {
            $gte: parsedMinPrice,
            $lte: parsedMaxPrice,
        },
    };
    if (category) {
        filter.categories = {
            $in: [category.toLowerCase()],
        };
    }
    const trimmedQuery = q.trim();
    const useTextSearch = trimmedQuery.length > 1;
    if (useTextSearch) {
        filter.$text = { $search: trimmedQuery };
    }
    const projection = useTextSearch
        ? { score: { $meta: "textScore" } }
        : {};
    const sort = useTextSearch
        ? { score: { $meta: "textScore" } }
        : { createdAt: -1 };
    const skip = (parsedPage - 1) * parsedLimit;
    const [cards, total] = await Promise.all([
        Card.find(filter, projection)
            .sort(sort)
            .skip(skip)
            .limit(parsedLimit)
            .lean(),
        Card.countDocuments(filter),
    ]);
    return res.status(200).json({
        success: true,
        data: cards,
        pagination: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            pages: Math.ceil(total / parsedLimit),
        },
    });
});
/* =========================
   SEARCH SUGGESTIONS
========================= */
export const searchSuggestions = asyncHandler(async (req, res) => {
    const { q = "" } = req.query;
    const trimmedQuery = q.trim();
    if (!trimmedQuery) {
        return res.json({
            success: true,
            data: [],
        });
    }
    const results = await Card.find({
        $text: {
            $search: trimmedQuery,
        },
    }, {
        score: {
            $meta: "textScore",
        },
        name: 1,
        categories: 1,
        "specifications.color": 1,
    })
        .sort({
        score: {
            $meta: "textScore",
        },
    })
        .limit(6)
        .lean();
    return res.json({
        success: true,
        data: results,
    });
});
