// verification.middleware.js
import Review from "../models/review.model.js";
import { Product } from "../models/product.model.js";

export const verifyUserHasNotReviewed = async (req, res, next) => {
  try {
    const userId = req.user._id; // from auth middleware
    const productId = req.body.product || req.params.productId;

    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: "User has already reviewed this product." });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// 2. Verify if product exists
export const verifyProductExists = async (req, res, next) => {
  try {
    const productId = req.body.product || req.params.productId || req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    req.product = product;
    next();
  } catch (error) {
    next(error);
  }
};





export const verifyReviewOwnership = async (req, res, next) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    if (review.user.toString() !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this review." });
    }
    req.review = review;
    next();
  } catch (error) {
    next(error);
  }
};


export const verifyProductOwnership = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.user && product.user.toString() !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this product." });
    }

    req.product = product;
    next();
  } catch (error) {
    next(error);
  }
};

// 5. Verify product stock availability
export const verifyProductStock = async (req, res, next) => {
  try {
    const productId = req.body.productId || req.body.product;
    const quantity = Number(req.body.quantity || 1);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.quantityAvailable < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock available." });
    }

    req.product = product;
    next();
  } catch (error) {
    next(error);
  }
};

// 6. Verify discount eligibility (stub, customize as needed)
export const verifyDiscountEligibility = async (req, res, next) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (!product.discount || product.discount <= 0) {
      return res.status(400).json({ success: false, message: "Product has no discount available." });
    }

    // Add your coupon/user eligibility logic here

    next();
  } catch (error) {
    next(error);
  }
};

// 7. Verify review input length and rating
export const verifyReviewInput = (req, res, next) => {
  const { rating, comment } = req.body;
  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
  }
  if (!comment || comment.length < 10 || comment.length > 500) {
    return res.status(400).json({ success: false, message: "Comment must be between 10 and 500 characters." });
  }
  next();
};
