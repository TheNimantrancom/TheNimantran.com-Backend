import { Request, Response } from 'express';
import Design from '../models/design.model.js';
import Template from '../models/template.model.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/designs - Save or update design
export const saveDesign = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { templateId, name, canvasJSON, previewImage, designId } = req.body;

  // Check authentication
  if (!userId) {
    throw new ApiError(401, "Unauthorized - User not found");
  }

  // Validate required fields
  if (!templateId) {
    throw new ApiError(400, "Template ID is required");
  }

  if (!canvasJSON) {
    throw new ApiError(400, "Canvas JSON is required");
  }

  // Verify template exists and is active
  const template = await Template.findOne({ _id: templateId, isActive: true });
  if (!template) {
    throw new ApiError(404, "Template not found or inactive");
  }

  let design;

  if (designId) {
    console.log("Updating existing design:", designId);
    
    // Check if design exists and belongs to user
    const existingDesign = await Design.findOne({ _id: designId, userId });
    if (!existingDesign) {
      throw new ApiError(404, "Design not found or you don't have permission to update it");
    }

    design = await Design.findByIdAndUpdate(
      designId,
      { 
        name: name?.trim() || 'Untitled Design', 
        canvasJSON, 
        previewImage: previewImage || existingDesign.previewImage, 
        status: 'saved', 
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );
  } else {
    console.log("Creating new design");
    design = await Design.create({
      templateId,
      userId,
      name: name?.trim() || 'Untitled Design',
      canvasJSON,
      previewImage: previewImage || null,
      status: 'saved',
    });
  }

  res.status(201).json(
    new ApiResponse(201, design, designId ? "Design updated successfully" : "Design created successfully")
  );
});

// GET /api/designs/:id - Get single design
export const getDesignById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const design = await Design.findOne({ _id: id })
    .populate('templateId', 'name category thumbnailImage width height dpi');

  if (!design) {
    throw new ApiError(404, "Design not found");
  }

  // Optional: Check if user has permission to view this design
  // Uncomment if designs should be private to users
  // if (design.userId.toString() !== userId?.toString()) {
  //   throw new ApiError(403, "You don't have permission to view this design");
  // }

  res.json(
    new ApiResponse(200, design, "Design fetched successfully")
  );
});

// GET /api/user/designs - Get all designs for a user
export const getUserDesigns = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const userId = req.user._id;

  const designs = await Design.find({ userId })
    .populate('templateId', 'name category thumbnailImage width height dpi')
    .sort({ updatedAt: -1 });

  res.json(
    new ApiResponse(
      200, 
      { designs, count: designs.length }, 
      "User designs fetched successfully"
    )
  );
});

// DELETE /api/designs/:id
export const deleteDesign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // Find and delete design, ensuring it belongs to the user
  const design = await Design.findOneAndDelete({ _id: id, userId });

  if (!design) {
    throw new ApiError(404, "Design not found or you don't have permission to delete it");
  }

  res.json(
    new ApiResponse(200, null, "Design deleted successfully")
  );
});

// Optional: Get recent designs for a user (limited)
export const getRecentDesigns = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  const userId = req.user._id;
  const limit = parseInt(req.query.limit as string) || 5;

  const designs = await Design.find({ userId })
    .populate('templateId', 'name category thumbnailImage')
    .sort({ updatedAt: -1 })
    .limit(limit);

  res.json(
    new ApiResponse(200, { designs, count: designs.length }, "Recent designs fetched successfully")
  );
});

// Optional: Duplicate an existing design
export const duplicateDesign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized");
  }

  // Find original design
  const originalDesign = await Design.findOne({ _id: id, userId });
  if (!originalDesign) {
    throw new ApiError(404, "Design not found or you don't have permission to duplicate it");
  }

  // Create duplicate
  const duplicatedDesign = await Design.create({
    templateId: originalDesign.templateId,
    userId: originalDesign.userId,
    name: `${originalDesign.name} (Copy)`,
    canvasJSON: originalDesign.canvasJSON,
    previewImage: originalDesign.previewImage,
    status: 'saved',
  });

  res.status(201).json(
    new ApiResponse(201, duplicatedDesign, "Design duplicated successfully")
  );
});