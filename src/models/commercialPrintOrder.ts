import mongoose, { Document, Schema } from "mongoose"

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

export interface ICommercialPrintOrder extends Document {
  userId: mongoose.Types.ObjectId
  printType: mongoose.Types.ObjectId
  uploadedFile: {
    key: string
    viewUrl: string
    originalName: string
    mimeType: string
  }
  size: string
  paperType: string
  finishType: string
  quantity: number
  pricePerUnit: number
  totalPrice: number
  status: OrderStatus
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const CommercialPrintOrderSchema = new Schema<ICommercialPrintOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    printType: {
      type: Schema.Types.ObjectId,
      ref: "CommercialPrint",
      required: true,
    },
    uploadedFile: {
      key: { type: String, required: true },
      viewUrl: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: { type: String, required: true },
    },
    size: {
      type: String,
      required: true,
    },
    paperType: {
      type: String,
      required: true,
    },
    finishType: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
)

export const CommercialPrintOrder = mongoose.model<ICommercialPrintOrder>(
  "CommercialPrintOrder",
  CommercialPrintOrderSchema
)