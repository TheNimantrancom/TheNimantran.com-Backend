import ApiError from "../../utils/apiError.js";
import ApiResponse from "../../utils/apiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Card } from "../../models/card.model.js";
import { deleteFromS3, generateSignedUrl } from "../../utils/awsS3.js";
import { refreshSignedUrlsIfNeeded } from "../../utils/signedUrlCache.js";

/**fcount
 * Create a new card  (Pure S3 + CloudFront)
 */
export const createCard = asyncHandler(async (req, res) => {
  console.log("Create card hit");
  console.log("Body:", req.body);

  const {
    name,
    category,
    price,
    quantityAvailable,
    specifications,
    isPopular,
    isTrending,
    primaryImageKey,
    secondaryImageKey,
    discount,
    wholesalePrice,
    isAvailableForWholesale,
    description,
  } = req.body;

  if (!primaryImageKey || !secondaryImageKey) {
    throw new ApiError(400, "Primary and Secondary image keys are required");
  }

  if (!name || !category || price === undefined || quantityAvailable === undefined) {
    throw new ApiError(400, "Required fields missing: name, category, price, quantityAvailable");
  }

  // Generate CloudFront signed URLs
  const primaryImageUrl = generateSignedUrl(primaryImageKey);
  const secondaryImageUrl = generateSignedUrl(secondaryImageKey);

  // Specifications formatting
  const formattedSpecs = {
    material: specifications?.material || "",
    dimensions: specifications?.dimensions || "",
    printing: specifications?.printing || "",
    weight: specifications?.weight || "",
    color: specifications?.color || "",
    customizable: specifications?.customizable === "true" || specifications?.customizable === true,
  };

  const card = await Card.create({
    name,
    category: category.toLowerCase(),
    price: Number(price),
    quantityAvailable: Number(quantityAvailable),
    discount: discount ? Number(discount) : 0,
    wholesalePrice: wholesalePrice ? Number(wholesalePrice) : 0,
    isAvailableForWholesale: isAvailableForWholesale === "true" || isAvailableForWholesale === true,
    description: description || "",
    isPopular: isPopular === "true" || isPopular === true,
    isTrending: isTrending === "true" || isTrending === true,
    specifications: formattedSpecs,
    images: {
      primaryImage: primaryImageUrl,
      primaryImageKey,
      primaryUrlExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // cache for 12 hours
      secondaryImage: secondaryImageUrl,
      secondaryImageKey,
      secondaryUrlExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
  });

  res.status(201).json(new ApiResponse(201, card, "Card created successfully"));
});

/**
 * Update a card (Pure S3 + CloudFront)
 */
export const updateCard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log("Update card:", id);

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid card ID");
  }

  const card = await Card.findById(id);
  if (!card) throw new ApiError(404, "Card not found");

  const {
    name,
    category,
    price,
    quantityAvailable,
    discount,
    wholesalePrice,
    rating,
    description,
    reviewsCount,
    isAvailableForWholesale,
    isPopular,
    isTrending,
    specifications,
    primaryImageKey,
    secondaryImageKey,
  } = req.body;

  // Basic required field validation (you can relax this if partial updates allowed)
  if (!name || !category || price === undefined || quantityAvailable === undefined) {
    throw new ApiError(400, "Required fields missing: name, category, price, quantityAvailable");
  }

  // Prepare update data
  const updateData = {
    name,
    category: category.toLowerCase(),
    price: Number(price),
    quantityAvailable: Number(quantityAvailable),
    discount: discount ? Number(discount) : 0,
    wholesalePrice: wholesalePrice ? Number(wholesalePrice) : 0,
    rating: rating !== undefined ? Number(rating) : card.rating,
    description: description ?? card.description,
    reviewsCount: reviewsCount !== undefined ? Number(reviewsCount) : card.reviewsCount,
    isAvailableForWholesale: isAvailableForWholesale === "true" || isAvailableForWholesale === true,
    isPopular: isPopular === "true" || isPopular === true,
    isTrending: isTrending === "true" || isTrending === true,
    specifications: {
      ...card.specifications,
      ...specifications,
    },
  };

  // Prepare images object starting from existing
  const imagesUpdate = {
    ...card.images,
  };

  // Primary Image Update (if provided)
  if (primaryImageKey) {
    // delete old object if exists
    if (card.images?.primaryImageKey) {
      try {
        await deleteFromS3(card.images.primaryImageKey);
      } catch (err) {
        console.warn("Warning: failed to delete old primary image from S3", err);
      }
    }

    imagesUpdate.primaryImageKey = primaryImageKey;
    imagesUpdate.primaryImage = generateSignedUrl(primaryImageKey);
    imagesUpdate.primaryUrlExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  }

  // Secondary Image Update (if provided)
  if (secondaryImageKey) {
    if (card.images?.secondaryImageKey) {
      try {
        await deleteFromS3(card.images.secondaryImageKey);
      } catch (err) {
        console.warn("Warning: failed to delete old secondary image from S3", err);
      }
    }

    imagesUpdate.secondaryImageKey = secondaryImageKey;
    imagesUpdate.secondaryImage = generateSignedUrl(secondaryImageKey);
    imagesUpdate.secondaryUrlExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  }

  // Attach images update to updateData if changed
  updateData.images = imagesUpdate;

  const updatedCard = await Card.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedCard) throw new ApiError(500, "Failed to update card");

  res.status(200).json(new ApiResponse(200, updatedCard, "Card updated successfully"));
});

/**
 * Get a single card
 */
export const getCardById = asyncHandler(async (req, res) => {
  const card = await Card.findById(req.params.id);

  if (!card) throw new ApiError(404, "Card not found");

  // Refresh signed URLs if expired
  const updated = refreshSignedUrlsIfNeeded(card);
  if (updated) await card.save();

  res.status(200).json(new ApiResponse(200, card, "Card fetched successfully"));
});

/**
 * Delete card + delete files from S3
 */
export const deleteCard = asyncHandler(async (req, res) => {
  const card = await Card.findByIdAndDelete(req.params.id);

  if (!card) throw new ApiError(404, "Card not found");

  // Delete linked S3 files (best-effort)
  try {
    if (card.images?.primaryImageKey) await deleteFromS3(card.images.primaryImageKey);
  } catch (err) {
    console.warn("Failed to delete primary image from S3:", err);
  }

  try {
    if (card.images?.secondaryImageKey) await deleteFromS3(card.images.secondaryImageKey);
  } catch (err) {
    console.warn("Failed to delete secondary image from S3:", err);
  }

  res.status(200).json(new ApiResponse(200, null, "Card deleted successfully"));
});

/**
 * Popular cards
 */
export const getPopularCards = asyncHandler(async (req, res) => {
  const cards = await Card.find({ isPopular: true })
    .sort({ createdAt: -1 })
    .limit(10);

  // Refresh signed URLs if needed and persist
  let updated = false;
  for (const c of cards) {
    if (refreshSignedUrlsIfNeeded(c)) {
      updated = true;
    }
  }
  if (updated) await Promise.all(cards.map((c) => c.save()));

  res.status(200).json(new ApiResponse(200, cards, "Popular cards fetched successfully"));
});



export const countTotalCards = asyncHandler(async (req, res) => {
  const total = await Card.countDocuments();

  res.json(
    new ApiResponse(200, { total }, "Total cards count fetched")
  );
});


/**
 * Trending cards
 */
export const getTrendingCards = asyncHandler(async (req, res) => {
  const cards = await Card.find({ isTrending: true })
    .sort({ createdAt: -1 })
    .limit(10);

  // Refresh signed URLs if needed and persist
  let updated = false;
  for (const c of cards) {
    if (refreshSignedUrlsIfNeeded(c)) updated = true;
  }
  if (updated) await Promise.all(cards.map((c) => c.save()));

  res.status(200).json(new ApiResponse(200, cards, "Trending cards fetched successfully"));
});

/**
 * Get all cards with filtering, sorting, pagination
 */
export const getAllCards = asyncHandler(async (req, res) => {
  let query = {};

  if (req.query.category) query.category = req.query.category.toLowerCase();

  if (req.query.minPrice || req.query.maxPrice) {
    query.price = {};
    if (req.query.minPrice) query.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) query.price.$lte = Number(req.query.maxPrice);
  }

  if (req.query.isPopular) query.isPopular = req.query.isPopular === "true";
  if (req.query.isTrending) query.isTrending = req.query.isTrending === "true";

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let sort = {};
  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  } else sort.createdAt = -1;

  const cards = await Card.find(query).skip(skip).limit(limit).sort(sort);
  const total = await Card.countDocuments(query);

  // Refresh signed URLs if needed and persist
  let updated = false;
  for (const c of cards) {
    if (refreshSignedUrlsIfNeeded(c)) updated = true;
  }
  if (updated) await Promise.all(cards.map((c) => c.save()));

  res.status(200).json({
    success: true,
    count: cards.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: cards,
  });
});

/**
 * Update card rating
 */
export const updateCardRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, reviewsCount } = req.body;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    throw new ApiError(400, "Invalid id");
  }

  const card = await Card.findById(id);
  if (!card) throw new ApiError(404, "Card not found");

  if (rating !== undefined) card.rating = Number(rating);
  if (reviewsCount !== undefined) card.reviewsCount = Number(reviewsCount);

  await card.save();

  res.status(200).json(new ApiResponse(200, card, "Card rating updated"));
});
