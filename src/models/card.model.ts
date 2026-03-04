import mongoose, { Schema, Document, Model } from "mongoose"
import { ICard } from "../types/models/card.types.js"


const cardSchema = new Schema<ICard>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    categories: [
      {
        type: String,
        lowercase: true,
        trim: true,
        index: true
      }
    ],

    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    wholesalePrice: { type: Number, default: 999 },
    wholesaleDiscount: { type: Number, default: 0 },
    isAvailableForWholesale: { type: Boolean, default: false },
    quantityAvailable: { type: Number, required: true },
    rating: { type: Number, default: 0 },
    description: { type: String, default: "" },
    reviewsCount: { type: Number, default: 0 },
    isPopular: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    quantityPerBundleWholesale: { type: Number, default: 1500 },
    quantityPerBundleCustomer: { type: Number, default: 100 },

    images: {
      primaryImage: String,
      primaryImageKey: String,
      primaryUrlExpiresAt: Date,
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
)

cardSchema.index({
  name: "text",
  description: "text",
  categories: "text",
  "specifications.color": "text",
  "specifications.material": "text",
  "specifications.dimensions": "text"
})

cardSchema.index({ price: 1 })
cardSchema.index({ categories: 1 })
cardSchema.index({ createdAt: -1 })

export const Card: Model<ICard> = mongoose.model<ICard>("Card", cardSchema)