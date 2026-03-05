import Review from "../models/review.model.js";
import { Card } from "../models/card.model.js";
export const verifyUserHasNotReviewed = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const userId = req.user._id;
        const productId = req.body.product || req.params.productId;
        const existingReview = await Review.findOne({
            user: userId,
            product: productId,
        });
        if (existingReview) {
            res.status(400).json({
                success: false,
                message: "User has already reviewed this product.",
            });
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
export const verifyProductExists = async (req, res, next) => {
    try {
        const productId = req.body.product ||
            req.params.productId ||
            req.params.id;
        const product = await Card.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        req.product = product;
        next();
    }
    catch (error) {
        next(error);
    }
};
export const verifyReviewOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const reviewId = req.params.id;
        const review = await Review.findById(reviewId);
        if (!review) {
            res.status(404).json({
                success: false,
                message: "Review not found.",
            });
            return;
        }
        const isAdmin = req.user.roles.includes("admin");
        if (review.user.toString() !==
            req.user._id.toString() &&
            !isAdmin) {
            res.status(403).json({
                success: false,
                message: "Not authorized to modify this review.",
            });
            return;
        }
        req.review = review;
        next();
    }
    catch (error) {
        next(error);
    }
};
export const verifyProductOwnership = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }
        const productId = req.params.id;
        const product = await Card.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        const isAdmin = req.user.roles.includes("admin");
        if (product.user &&
            product.user.toString() !==
                req.user._id.toString() &&
            !isAdmin) {
            res.status(403).json({
                success: false,
                message: "Not authorized to modify this product.",
            });
            return;
        }
        req.product = product;
        next();
    }
    catch (error) {
        next(error);
    }
};
/* =========================
   5. Verify product stock
========================= */
export const verifyProductStock = async (req, res, next) => {
    try {
        const productId = req.body.productId || req.body.product;
        const quantity = Number(req.body.quantity || 1);
        const product = await Card.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        if (product.quantityAvailable < quantity) {
            res.status(400).json({
                success: false,
                message: "Insufficient stock available.",
            });
            return;
        }
        req.product = product;
        next();
    }
    catch (error) {
        next(error);
    }
};
/* =========================
   6. Verify discount eligibility
========================= */
export const verifyDiscountEligibility = async (req, res, next) => {
    try {
        const { productId } = req.body;
        const product = await Card.findById(productId);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        if (!product.discount || product.discount <= 0) {
            res.status(400).json({
                success: false,
                message: "Product has no discount available.",
            });
            return;
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
/* =========================
   7. Verify review input
========================= */
export const verifyReviewInput = (req, res, next) => {
    const { rating, comment } = req.body;
    if (typeof rating !== "number" ||
        rating < 1 ||
        rating > 5) {
        res.status(400).json({
            success: false,
            message: "Rating must be between 1 and 5.",
        });
        return;
    }
    if (!comment ||
        comment.length < 10 ||
        comment.length > 500) {
        res.status(400).json({
            success: false,
            message: "Comment must be between 10 and 500 characters.",
        });
        return;
    }
    next();
};
