import asyncHandler from "../utils/asyncHandler.js"; 
import ApiError from "../utils/apiError.js";
import {Card} from "../models/card.model.js"
import ApiResponse from "../utils/apiResponse.js";


export const getAllCards = asyncHandler(async (req, res) => {
  let query = {};

  if (req.query.category) {
    query.category = req.query.category.toLowerCase();
  }

  if (req.query.isAvailableForWholesale) {
    query.isAvailableForWholesale = req.query.isAvailableForWholesale;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
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

  // Sorting: e.g. price, rating, createdAt
  let sort = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":"); // e.g. "price:desc"
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1; // default newest first
  }

  const products = await Card.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Card.countDocuments(query);

  res.json({
    success: true,
    count: products.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: products,
  });
});


export const getCardById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const card = await Card.findById(id);
  if (!card) {
    throw new ApiError(404, "Card not found");
  }
  res.status(200).json(
    new ApiResponse(200, card, "Card fetched successfully")
  )
});



export const updateCardRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, reviewsCount } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  if (rating !== undefined) product.rating = rating;
  if (reviewsCount !== undefined) product.reviewsCount = reviewsCount;

  await product.save();

  res.json({ success: true, data: product });
});

// Get popular products (marked isPopular: true)

