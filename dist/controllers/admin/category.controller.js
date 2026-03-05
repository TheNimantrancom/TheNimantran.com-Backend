import { Category } from "../../models/category.model.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
export const createCategory = asyncHandler(async (req, res) => {
    const { name, slug, parent, description, image, sortOrder } = req.body;
    if (!name || !slug) {
        throw new ApiError(400, "Name and slug are required");
    }
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
        throw new ApiError(409, "Category slug already exists");
    }
    if (parent) {
        const parentCategory = await Category.findById(parent);
        if (!parentCategory) {
            throw new ApiError(400, "Parent category not found");
        }
    }
    const category = await Category.create({
        name,
        slug,
        parent: parent || null,
        description,
        image,
        sortOrder
    });
    res
        .status(201)
        .json(new ApiResponse(201, category, "Category created successfully"));
});
export const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find()
        .sort({ sortOrder: 1, createdAt: 1 })
        .lean();
    res.json(new ApiResponse(200, categories, "Categories fetched"));
});
export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findById(id).lean();
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    res.json(new ApiResponse(200, category, "Category fetched"));
});
export const getCategoryBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    res.json(new ApiResponse(200, category, "Category fetched"));
});
export const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, slug, parent, description, image, isActive, sortOrder } = req.body;
    const category = await Category.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    if (slug && slug !== category.slug) {
        const slugExists = await Category.findOne({ slug });
        if (slugExists) {
            throw new ApiError(409, "Slug already exists");
        }
    }
    const parentId = parent === "" ? null : parent;
    if (parentId) {
        if (parentId.toString() === id.toString()) {
            throw new ApiError(400, "Category cannot be its own parent");
        }
        const parentCategory = await Category.findById(parentId);
        if (!parentCategory) {
            throw new ApiError(400, "Parent category not found");
        }
    }
    Object.assign(category, {
        name,
        slug,
        parent: parentId,
        description,
        image,
        isActive,
        sortOrder
    });
    await category.save();
    res.json(new ApiResponse(200, category, "Category updated"));
});
export const toggleCategoryStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    category.isActive = !category.isActive;
    await category.save();
    res.json(new ApiResponse(200, category, "Category status updated"));
});
export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
        throw new ApiError(404, "Category not found");
    }
    const hasChildren = await Category.findOne({ parent: id });
    if (hasChildren) {
        throw new ApiError(400, "Delete subcategories first");
    }
    await category.deleteOne();
    res.json(new ApiResponse(200, null, "Category deleted"));
});
export const getCategoryTree = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1 })
        .lean();
    const map = {};
    const roots = [];
    categories.forEach((cat) => {
        map[cat._id.toString()] = { ...cat, children: [] };
    });
    categories.forEach((cat) => {
        if (cat.parent) {
            map[cat.parent.toString()]?.children.push(map[cat._id.toString()]);
        }
        else {
            roots.push(map[cat._id.toString()]);
        }
    });
    res.json(new ApiResponse(200, roots, "Category tree fetched"));
});
