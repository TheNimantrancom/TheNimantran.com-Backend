import { Category } from "../models/category.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
/* =========================
   GET ACTIVE CATEGORIES
========================= */
export const getActiveCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1 })
        .lean();
    return res.json(new ApiResponse(200, categories, "Active categories fetched"));
});
