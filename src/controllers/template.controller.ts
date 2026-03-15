import { Request, Response } from 'express';
import Template from '../models/template.model.js';
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";

const allowedCategories = [
  "packaging box",
  "t-shirt",
  "card",
  "flyer",
  "sticker",
  "other"
] as const;

type AllowedCategory = typeof allowedCategories[number];

export const createTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { name, category, width, height, dpi, tags, backgroundImage,bleed,safeMargin } = req.body;

  // Validation
  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }

  if (!category?.trim()) {
    throw new ApiError(400, "Category is required");
  }

  const normalizedCategory = category.toLowerCase().trim();
  if (!allowedCategories.includes(normalizedCategory as AllowedCategory)) {
    throw new ApiError(400, "Invalid category");
  }

  if (!backgroundImage?.trim()) {
    throw new ApiError(400, "Background image URL is required");
  }

  // Parse tags
  let parsedTags: string[] = [];
  if (tags) {
    try {
      const parsed = typeof tags === "string" ? JSON.parse(tags) : tags;
      if (Array.isArray(parsed)) {
        parsedTags = parsed.map((t: string) => t.toLowerCase().trim());
      } else {
        throw new ApiError(400, "Tags must be an array");
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, "Invalid tags format");
    }
  }

  // Create template
  const template = await Template.create({
    name: name.trim(),
    bleed:Number(bleed) || 3,
    safeMargin:Number(safeMargin) ||5,
    category: normalizedCategory,
    backgroundImage: backgroundImage.trim(),
    thumbnailImage: backgroundImage.trim(),
    width: Number(width) || 800,
    height: Number(height) || 600,
    dpi: Number(dpi) || 300,
    tags: parsedTags,
    isActive: true
  });

  res.status(201).json(
    new ApiResponse(201, template, "Template created successfully")
  );
});

export const getTemplates = asyncHandler(async (req: Request, res: Response) => {
  const { category, search } = req.query;
  const query: Record<string, unknown> = { isActive: true };

  if (category && category !== 'All') {
    query.category = category;
  }

  if (search && typeof search === 'string') {
    query.name = { $regex: search, $options: 'i' };
  }

  const templates = await Template.find(query).sort({ createdAt: -1 });

  res.json(
    new ApiResponse(200, { templates, count: templates.length }, "Templates fetched successfully")
  );
});

export const getTemplateById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await Template.findOne({ _id: id});

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  res.json(
    new ApiResponse(200, template, "Template fetched successfully")
  );
});

export const deleteTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const template = await Template.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  res.json(
    new ApiResponse(200, null, "Template deleted successfully")
  );
});

// Optional: Update template
export const updateTemplate = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate category if being updated
  if (updates.category) {
    const normalizedCategory = updates.category.toLowerCase().trim();
    if (!allowedCategories.includes(normalizedCategory as AllowedCategory)) {
      throw new ApiError(400, "Invalid category");
    }
    updates.category = normalizedCategory;
  }

  // Validate and parse tags if being updated
  if (updates.tags) {
    try {
      const parsed = typeof updates.tags === "string" ? JSON.parse(updates.tags) : updates.tags;
      if (Array.isArray(parsed)) {
        updates.tags = parsed.map((t: string) => t.toLowerCase().trim());
      } else {
        throw new ApiError(400, "Tags must be an array");
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(400, "Invalid tags format");
    }
  }

  // Remove fields that shouldn't be updated directly
  delete updates._id;
  delete updates.createdAt;

  const template = await Template.findByIdAndUpdate(
    id,
    { ...updates },
    { new: true, runValidators: true }
  );

  if (!template) {
    throw new ApiError(404, "Template not found");
  }

  res.json(
    new ApiResponse(200, template, "Template updated successfully")
  );
});

// Optional: Get all categories
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  res.json(
    new ApiResponse(200, allowedCategories, "Categories fetched successfully")
  );
});