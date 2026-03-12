import mongoose, { Document, Schema, Types } from "mongoose"

/* ================================================================== */
/*  Enums                                                              */
/* ================================================================== */

export type OrderStatus =
  | "pending"       // awaiting warehouse acceptance
  | "accepted"      // warehouse accepted
  | "rejected"      // all warehouses rejected — no fallback
  | "processing"    // warehouse preparing order
  | "shipped"       // out for delivery
  | "delivered"     // delivered successfully
  | "cancelled"     // cancelled by user or admin

export type PaymentMethod = "cod" | "online" | "wallet"

export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed"

/**
 * "product" = standard catalog item (cards, packaging, decor…)
 * "design"  = user-customised template (canvas-based)
 */
export type OrderItemType = "product" | "design"

/* ================================================================== */
/*  Sub-document Interfaces                                            */
/* ================================================================== */

/**
 * One line item — discriminated by itemType.
 *
 * product → productId populated, designId/templateId null
 * design  → designId + templateId populated, canvasJSONSnapshot frozen at
 *            order time so fulfilment is never blocked by later edits
 */
export interface IOrderItem {
  itemType: OrderItemType

  // catalog product (itemType = "product")
  productId?: Types.ObjectId          // ref: Card

  // custom design (itemType = "design")
  designId?: Types.ObjectId           // ref: Design
  templateId?: Types.ObjectId         // ref: Template
  canvasJSONSnapshot?: Record<string, unknown>  // frozen canvas at order time

  // shared display / fulfilment
  name: string
  category: string                    // "card" | "packaging box" | "t-shirt" | …
  previewImage?: string

  // quantity & pricing
  quantity: number
  unitPrice: number
  discountPerUnit: number
  totalPrice: number                  // (unitPrice - discountPerUnit) × quantity

  // production extras
  specifications?: Record<string, unknown>  // size, paper weight, finish, colour…
  isWholesale: boolean
}

export interface IStatusHistoryEntry {
  status: OrderStatus
  date: Date
  note?: string
  updatedBy?: string  // "system" | "warehouse" | "admin" | userId string
}

export interface IShippingAddress {
  lat?: number
  lng?: number
  line1: string
  line2?: string
  city: string
  state: string
  pincode: string
  country?: string
}

/**
 * Razorpay payment record — populated progressively.
 *   Step 1 → razorpay.orderId set when Razorpay order created
 *   Step 2 → paymentId + signature set after frontend payment success
 *   Step 3 → server verifies signature → paymentStatus = "paid"
 *   Step 4 → refundId set if refund initiated
 */
export interface IRazorpayPayment {
  orderId: string         // rzp_order_xxx
  paymentId?: string      // pay_xxx  — set after capture
  signature?: string      // HMAC signature — verified before marking paid
  refundId?: string       // rfnd_xxx — set after refund
  refundedAt?: Date
}

/* ================================================================== */
/*  Main Order Interface                                               */
/* ================================================================== */

export interface IOrder extends Document {
  orderId: string                 // UUID — used in URLs and customer comms
  user: Types.ObjectId

  items: IOrderItem[]

  // pricing
  subtotal: number                // sum of item totalPrices before global discounts
  discount: number                // total discount
  tax: number                     // GST (18%)
  shippingFee: number
  finalAmount: number             // amount customer pays

  // payment
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  razorpay?: IRazorpayPayment     // only for online payments

  // delivery
  shippingAddress: IShippingAddress

  // fulfilment
  status: OrderStatus
  statusHistory: IStatusHistoryEntry[]

  // warehouse dispatch
  warehouse?: Types.ObjectId
  rejectedByWarehouses: Types.ObjectId[]

  // production
  productionNotes?: string        // internal — set by warehouse / admin

  createdAt: Date
  updatedAt: Date
}

/* ================================================================== */
/*  Sub-document Schemas                                               */
/* ================================================================== */

const OrderItemSchema = new Schema<IOrderItem>(
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
    canvasJSONSnapshot: { type: Schema.Types.Mixed, default: null },

    // display
    name: { type: String, required: true },
    category: { type: String, required: true },
    previewImage: { type: String, default: "" },

    // quantity / pricing
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountPerUnit: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },

    // extras
    specifications: { type: Schema.Types.Mixed, default: null },
    isWholesale: { type: Boolean, default: false },
  },
  { _id: false }
)

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    date: { type: Date, default: () => new Date() },
    note: { type: String },
    updatedBy: { type: String, default: "system" },
  },
  { _id: false }
)

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    lat: { type: Number },
    lng: { type: Number },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
  },
  { _id: false }
)

const RazorpayPaymentSchema = new Schema<IRazorpayPayment>(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String },
    signature: { type: String },
    refundId: { type: String },
    refundedAt: { type: Date },
  },
  { _id: false }
)

/* ================================================================== */
/*  Order Schema                                                       */
/* ================================================================== */

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    items: { type: [OrderItemSchema], required: true, default: [] },

    // pricing
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    finalAmount: { type: Number, required: true, min: 0 },

    // payment
    paymentMethod: { type: String, enum: ["cod", "online", "wallet"], required: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded", "failed"],
      default: "unpaid",
      index: true,
    },
    razorpay: { type: RazorpayPaymentSchema, default: null },

    // delivery
    shippingAddress: { type: ShippingAddressSchema, required: true },

    // fulfilment
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },

    // warehouse dispatch
    warehouse: { type: Schema.Types.ObjectId, ref: "Warehouse", default: null },
    rejectedByWarehouses: [{ type: Schema.Types.ObjectId, ref: "Warehouse" }],

    // production
    productionNotes: { type: String, default: "" },
  },
  { timestamps: true }
)

/* ================================================================== */
/*  Indexes                                                            */
/* ================================================================== */

OrderSchema.index({ warehouse: 1, status: 1 })
OrderSchema.index({ paymentStatus: 1, status: 1 })
OrderSchema.index({ createdAt: -1 })

/* ================================================================== */
/*  Export                                                             */
/* ================================================================== */

export const Order =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema)