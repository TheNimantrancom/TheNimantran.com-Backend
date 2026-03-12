import mongoose, { Document, Schema, Types } from "mongoose"
import type { OrderItemType } from "./order.model.js"

/* ================================================================== */
/*  Interfaces                                                         */
/* ================================================================== */

/**
 * One line in the cart — mirrors IOrderItem structure so conversion
 * to an order item is a straight mapping with no data loss.
 */
export interface ICartItem {
  itemType: OrderItemType

  // catalog product
  productId?: Types.ObjectId      // ref: Card

  // custom design
  designId?: Types.ObjectId       // ref: Design
  templateId?: Types.ObjectId     // ref: Template

  // display (denormalised so cart renders without joins)
  name: string
  category: string
  previewImage?: string

  // quantity & cached pricing (refreshed on checkout)
  quantity: number
  unitPrice: number               // price at time of add-to-cart
  discountPerUnit: number
  totalPrice: number

  // extras
  specifications?: Record<string, unknown>
  isWholesale: boolean

  addedAt: Date
}

export interface ICart extends Document {
  user: Types.ObjectId
  items: ICartItem[]

  // convenience totals — recomputed by the pre-save hook
  itemCount: number
  subtotal: number

  // TTL marker — cart expires if user abandons it for 30 days
  lastActivityAt: Date

  createdAt: Date
  updatedAt: Date
}

/* ================================================================== */
/*  Cart Item Schema                                                   */
/* ================================================================== */

const CartItemSchema = new Schema<ICartItem>(
  {
    itemType: {
      type: String,
      enum: ["product", "design"],
      required: true,
      default: "product",
    },

    // catalog
    productId: { type: Schema.Types.ObjectId, ref: "Card", default: null },

    // design
    designId: { type: Schema.Types.ObjectId, ref: "Design", default: null },
    templateId: { type: Schema.Types.ObjectId, ref: "Template", default: null },

    // display
    name: { type: String, required: true },
    category: { type: String, required: true },
    previewImage: { type: String, default: "" },

    // quantity / pricing
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountPerUnit: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    // extras
    specifications: { type: Schema.Types.Mixed, default: null },
    isWholesale: { type: Boolean, default: false },

    addedAt: { type: Date, default: () => new Date() },
  },
  { _id: true } // keep _id so frontend can reference individual cart lines
)

/* ================================================================== */
/*  Cart Schema                                                        */
/* ================================================================== */

const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,   // one cart per user
      index: true,
    },

    items: { type: [CartItemSchema], default: [] },

    // denormalised — recomputed in pre-save hook
    itemCount: { type: Number, default: 0, min: 0 },
    subtotal: { type: Number, default: 0, min: 0 },

    lastActivityAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

/* ================================================================== */
/*  Pre-save Hook — recompute totals                                   */
/* ================================================================== */

CartSchema.pre("save", function (next) {
  this.itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0)
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0)
  this.lastActivityAt = new Date()
  next()
})

/* ================================================================== */
/*  Export                                                             */
/* ================================================================== */

export const Cart =
  mongoose.models.Cart ?? mongoose.model<ICart>("Cart", CartSchema)