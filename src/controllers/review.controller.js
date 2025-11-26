import asyncHandler from "../utils/asyncHandler.js"; // optional: for async error handling
import ApiError from "../utils/apiError.js"; // optional: for custom error handling
import Review from "../models/review.model.js";

// Create a new review
export const createReview = asyncHandler(async (req, res) => {
  const { user, product, rating, comment } = req.body;

  // Optional: Prevent user from reviewing same product twice
  const existingReview = await Review.findOne({ user, product });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product.");
  }

  const review = await Review.create({ user, product, rating, comment });
  res.status(201).json({ success: true, data: review });
});
// Update a review (only allow owner or admin)
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id; // assume you have user in req.user after auth middleware

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check ownership or admin rights here
  if (review.user.toString() !== userId.toString() && !req.user.isAdmin) {
    throw new ApiError(403, "Not authorized to update this review");
  }

  if (rating) review.rating = rating;
  if (comment) review.comment = comment;

  await review.save();

  res.json({ success: true, data: review });
});

// Delete a review (only owner or admin)
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  if (review.user.toString() !== userId.toString() && !req.user.isAdmin) {
    throw new ApiError(403, "Not authorized to delete this review");
  }

  await review.remove();

  res.json({ success: true, message: "Review deleted successfully" });
});
