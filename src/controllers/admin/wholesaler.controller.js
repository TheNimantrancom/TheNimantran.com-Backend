// controllers/cardController.js
import asyncHandler from "../../utils/asyncHandler.js";
import { Card } from "../../models/card.model.js";

// @desc    Get all cards with filtering
// @route   GET /api/cards
// @access  Public
export const getAllCards = asyncHandler(async (req, res) => {
  let query = { isAvailableForWholesale: true }; // Only show wholesale cards by default
 const PAGE_SIZE = 10;
  // Text search
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: "i" } },
      { category: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
      { "specifications.color": { $regex: req.query.search, $options: "i" } },
      { "specifications.material": { $regex: req.query.search, $options: "i" } }
    ];
  }

  // Category filter
  if (req.query.category) {
    query.category = { $regex: new RegExp(req.query.category, "i") };
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    query.$and = [];
    if (req.query.minPrice) {
      query.$and.push({
        $or: [
          { wholesalePrice: { $gte: Number(req.query.minPrice) } },
          { price: { $gte: Number(req.query.minPrice) } }
        ]
      });
    }
    if (req.query.maxPrice) {
      query.$and.push({
        $or: [
          { wholesalePrice: { $lte: Number(req.query.maxPrice) } },
          { price: { $lte: Number(req.query.maxPrice) } }
        ]
      });
    }
  }

  // MOQ filter
  if (req.query.minMOQ) {
    query.moq = { $gte: Number(req.query.minMOQ) };
  }

  // Popular/Trending filters
  if (req.query.popular === "true") {
    query.isPopular = true;
  }
  if (req.query.trending === "true") {
    query.isTrending = true;
  }

  // Sorting
  let sort = {};
  if (req.query.sort) {
    switch (req.query.sort) {
      case "price-asc":
        sort = { $sort: { wholesalePrice: 1, price: 1 } };
        break;
      case "price-desc":
        sort = { $sort: { wholesalePrice: -1, price: -1 } };
        break;
      case "rating-desc":
        sort = { $sort: { rating: -1 } };
        break;
      case "discount-desc":
        sort = { $sort: { discount: -1 } };
        break;
      default:
        // Default: trending/popular first
        sort = { $sort: { isTrending: -1, isPopular: -1, createdAt: -1 } };
    }
  } else {
    sort = { $sort: { isTrending: -1, isPopular: -1, createdAt: -1 } };
  }

  // Pagination
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || PAGE_SIZE;
  const skip = (page - 1) * limit;

  // Execute query with aggregation for better sorting flexibility
  const aggregationPipeline = [
    { $match: query },
    {
      $addFields: {
        // Calculate final price for sorting
        finalPrice: {
          $subtract: [
            { $ifNull: ["$wholesalePrice", "$price"] },
            { $ifNull: ["$discount", 0] }
          ]
        },
        // Determine which price to use (wholesale or regular)
        displayPrice: { $ifNull: ["$wholesalePrice", "$price"] }
      }
    },
    sort,
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        name: 1,
        category: 1,
        description: 1,
        images: 1,
        specifications: 1,
        price: 1,
        wholesalePrice: 1,
        discount: 1,
        finalPrice: 1,
        displayPrice: 1,
        moq: 1,
        quantityAvailable: 1,
        isPopular: 1,
        isTrending: 1,
        rating: 1,
        reviewsCount: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ];

  const [cards, total] = await Promise.all([
    Card.aggregate(aggregationPipeline),
    Card.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: cards.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: cards
  });
});