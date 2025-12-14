import mongoose from "mongoose";

const cardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

     category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },

    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 999 },
    isAvailableForWholesale: { type: Boolean, default: false },
    quantityAvailable: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    description: { type: String, default: "" },
    reviewsCount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },

    images: {
      primaryImage: String,          // cached CloudFront URL
      primaryImageKey: String,       // S3 key
      primaryUrlExpiresAt: Date,     // cache expiry time

      secondaryImage: String,
      secondaryImageKey: String,
      secondaryUrlExpiresAt: Date
    },

    specifications: {
      material: String,
      dimensions: String,
      printing: String,
      weight: String,
      color: String,
      customizable: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

export const Card = mongoose.model("Card", cardSchema);
