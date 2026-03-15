import mongoose, { Document, Schema } from "mongoose"

export interface ICommercialPrint extends Document {
  name: string
  slug: string
  description: string
  thumbnailImage: string
  sizes: string[]
  paperTypes: string[]
  finishTypes: string[]
  minQuantity: number
  pricePerUnit: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const CommercialPrintSchema = new Schema<ICommercialPrint>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnailImage: {
      type: String,
      required: true,
    },
    sizes: {
      type: [String],
      default: [],
    },
    paperTypes: {
      type: [String],
      default: [],
    },
    finishTypes: {
      type: [String],
      default: [],
    },
    minQuantity: {
      type: Number,
      required: true,
      default: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

export const CommercialPrint = mongoose.model<ICommercialPrint>(
  "CommercialPrint",
  CommercialPrintSchema
)