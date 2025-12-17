
import { Card } from "../models/card.model.js";
import asyncHandler from "../utils/asyncHandler.js";

export const searchCards = asyncHandler( async (req, res, next) => {
  try {
    let {
      q = "",
      category,
      minPrice = 0,
      maxPrice = 100000,
      page = 1,
      limit = 12
    } = req.query;

    page = Math.max(1, parseInt(page, 10));
    limit = Math.min(50, Math.max(1, parseInt(limit, 10)));
    minPrice = Number(minPrice);
    maxPrice = Number(maxPrice);

    const filter = {
      price: { $gte: minPrice, $lte: maxPrice }
    };

    if (category) {
      filter.categories = category.toLowerCase();
    }

    const useTextSearch = Boolean(q && q.trim().length > 1);

    if (useTextSearch) {
      filter.$text = { $search: q.trim() };
    }

    const projection = useTextSearch
      ? { score: { $meta: "textScore" } }
      : {};

    const sort = useTextSearch
      ? { score: { $meta: "textScore" } }
      : { createdAt: -1 };

    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      Card.find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Card.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: cards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});
export const searchSuggestions = asyncHandler( async (req, res) => {
  const { q = "" } = req.query;

  if (!q.trim()) {
    return res.json({ success: true, data: [] });
  }

  const results = await Card.find(
    { $text: { $search: q.trim() } },
    { score: { $meta: "textScore" }, name: 1, categories: 1, "specifications.color": 1 }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(6)
    .lean();

  res.json({
    success: true,
    data: results
  });
});
