// src/controllers/card.controller.js

import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../../utils/cloudinary.js";
import { Card } from "../../models/card.model.js";

/**
 * Create a new card
 */
export const createCard = asyncHandler(async (req, res) => {
  console.log("I have been hitted")
  if (!req.files?.primaryImage?.[0] || !req.files?.secondaryImage?.[0]) {
    throw new ApiError(400, "Both primary and secondary images are required");
  }
console.log("Files:", req.files);
console.log("Body:", req.body);

  const primaryImageLocalPath = req.files.primaryImage[0].path;
  const secondaryImageLocalPath = req.files.secondaryImage[0].path;

  // console.log("Admin adding card", req.body);

  
  const primaryImage = await uploadOnCloudinary(primaryImageLocalPath);
  const secondaryImage = await uploadOnCloudinary(secondaryImageLocalPath);

  if (!primaryImage?.secure_url || !secondaryImage?.secure_url) {
    throw new ApiError(500, "Image upload to Cloudinary failed");
  }

 
  const specifications = {
    material: req.body?.specifications?.material || "",
    dimensions: req.body?.specifications?.dimensions || "",
    printing: req.body?.specifications?.printing || "",
    weight: req.body?.specifications?.weight || "",
    color: req.body?.specifications?.color || "",
    customizable: req.body?.specifications?.customizable === "true" || false,
  };

  // Convert other booleans
  const isPopular = req.body.isPopular === "true" || false;
  const isTrending = req.body.isTrending === "true" || false;

  // Create card
  const card = await Card.create({
    ...req.body,
    isPopular,
    isTrending,
    specifications,
    images: {
      primaryImage: primaryImage.secure_url,
      primaryImageId:primaryImage.public_id,
      secondaryImage: secondaryImage.secure_url,
      secondaryImageId:secondaryImage.public_id
    },
  });

  res.status(201).json(new ApiResponse(201, card, "Card created successfully"));
});

/**
 * Update a card by ID
 */




export const updateCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate card ID
  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid card ID format");
  }

  // Destructure and validate required fields
  const {
    name,
    category,
    price,
    discount,
    wholesalePrice,
    quantityAvailable,
    rating,
    description,
    reviewsCount,
    isAvailableForWholesale,
    isPopular,
    isTrending,
    specifications = {}
  } = req.body;

  if (!name || !category || price === undefined || quantityAvailable === undefined) {
    throw new ApiError(400, "Required fields are missing");
  }

  // Find the existing card
  const card = await Card.findById(id);
  if (!card) {
    throw new ApiError(404, "Card not found");
  }

  // Prepare update data
  const updateData = {
    name,
    category,
    price: parseFloat(price),
    discount: parseFloat(discount) || 0,
    wholesalePrice: parseFloat(wholesalePrice) || 0,
    quantityAvailable: parseInt(quantityAvailable),
    rating: parseFloat(rating) || 0,
    description,
    reviewsCount: parseInt(reviewsCount) || 0,
    isAvailableForWholesale: isAvailableForWholesale === "true",
    isPopular: isPopular === "true",
    isTrending: isTrending === "true",
    specifications: {
      ...card.specifications, // Keep existing specifications
      ...specifications      // Merge with new specifications
    }
  };

  // Handle image uploads and deletions
  try {
    // Primary Image Handling
    if (req.files?.primaryImage?.[0]?.path) {
      // Delete old image if exists
      if (card.images?.primaryImage) {
        await deleteFromCloudinary(card.images.primaryImageId);
      }
      
      const primaryImage = await uploadOnCloudinary(req.files.primaryImage[0].path);
      if (!primaryImage?.secure_url) {
        throw new ApiError(500, "Failed to upload primary image");
      }
      updateData["images.primaryImage"] = primaryImage.secure_url;
    }

    // Secondary Image Handling
    if (req.files?.secondaryImage?.[0]?.path) {
      // Delete old image if exists
      if (card.images?.secondaryImage) {
        await deleteFromCloudinary(card.images.secondaryImageId);
      }
      
      const secondaryImage = await uploadOnCloudinary(req.files.secondaryImage[0].path);
      if (!secondaryImage?.secure_url) {
        throw new ApiError(500, "Failed to upload secondary image");
      }
      updateData["images.secondaryImage"] = secondaryImage.secure_url;
    }

    // Perform the update
    const updatedCard = await Card.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        context: 'query' // Ensures validators run with the update operation
      }
    ).select("-__v"); // Exclude version key

    if (!updatedCard) {
      throw new ApiError(500, "Failed to update card");
    }

    res.status(200).json(
      new ApiResponse(200, updatedCard, "Card updated successfully")
    );

  } catch (error) {
    if (updateData["images.primaryImage"]) {
      await deleteFromCloudinary(updateData["images.primaryImageId"]);
    }
    if (updateData["images.secondaryImage"]) {
      await deleteFromCloudinary(updateData["images.secondaryImageId"]);
    }
    throw error;
  }
});





/**
 * Get a single card by ID
 */
export const getCardById = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) {
    throw new ApiError(404, "Card not found");
  }

  res.status(200).json(new ApiResponse(200, card, "Card fetched successfully"));
});

/**
 * Delete a card by ID
 */
export const deleteCard = asyncHandler(async (req, res) => {


  const card = await Card.findByIdAndDelete(req.params.id);
     await deleteFromCloudinary(card.images.primaryImageId)
     await deleteFromCloudinary(card.images.secondaryImageId)

  if (!card) {
    throw new ApiError(404, "Card not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, null, "Card deleted successfully"));
});

/**
 * Get popular cards
 */
export const getPopularCards = asyncHandler(async (req, res) => {
  const cards = await Card.find({ isPopular: true })
    .limit(10)
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, cards, "Popular cards fetched successfully"));
});

/**
 * Get trending cards
 */
export const getTrendingCards = asyncHandler(async (req, res) => {
  const cards = await Card.find({ isTrending: true })
    .limit(10)
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, cards, "Trending cards fetched successfully"));
});
// Get all products with optional filtering, sorting, pagination
export const getAllCards = asyncHandler(async (req, res) => {
  let query = {};
    console.log("I have been hitted")
  // Filtering by category, price range, popularity etc.
  if (req.query.category) {
    query.category = req.query.category.toLowerCase();
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