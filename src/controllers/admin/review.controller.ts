
import Review from "../../models/review.model.js";
import asyncHandler from "../../utils/asyncHandler.js";



// Get all reviews (with optional pagination)
export const getAllReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const reviews = await Review.find()
    .populate("user", "name email")    // populate user details (adjust fields)
    .populate("product", "name price") // populate product details (adjust fields)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Review.countDocuments();

  res.json({
    success: true,
    count: reviews.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: reviews,
  });
});
// Get a single review by ID
export const getReviewById = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
    .populate("user", "name email")
    .populate("product", "name price");

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  res.json({ success: true, data: review });
});
export const getReviewsByProduct = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: reviews.length, data: reviews });
});
// Get all reviews by a specific user
export const getReviewsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const reviews = await Review.find({ user: userId })
    .populate("product", "name price")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: reviews.length, data: reviews });
});
