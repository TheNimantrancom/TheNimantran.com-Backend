import mongoose, {
  Document,
  Schema,
  Types,
} from "mongoose"



export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"

export type PaymentMethod =
  | "cod"
  | "online"
  | "wallet"


export interface IOrderItem {
  cardId: Types.ObjectId
  name: string
  categories: string[]
  packs: number
  packSize: number
  pricePerPack: number
  discountPerPack: number
  totalPrice: number
  image?: string
  specifications?: Record<string, unknown>
  isWholesale: boolean
}

export interface IStatusHistoryEntry {
  status: OrderStatus
  date: Date
  note?: string
}



export interface IOrder extends Document {
  orderId: string
  user: Types.ObjectId
  items: IOrderItem[]

  totalAmount: number
  discount: number
  tax: number
  shippingFee: number
  finalAmount: number

  paymentMethod: PaymentMethod
  shippingAddress: unknown

  status: OrderStatus
  statusHistory: IStatusHistoryEntry[]

  warehouse?: Types.ObjectId


  rejectedByWarehouses: Types.ObjectId[]

  createdAt: Date
  updatedAt: Date
}


const OrderItemSchema = new Schema<IOrderItem>(
  {
    cardId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    name: { type: String, required: true },
    categories: [{ type: String }],
    packs: { type: Number, required: true },
    packSize: { type: Number, required: true },
    pricePerPack: { type: Number, required: true },
    discountPerPack: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    image: { type: String },
    specifications: { type: Schema.Types.Mixed },
    isWholesale: { type: Boolean, default: false },
  },
  { _id: false }
)

const StatusHistorySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    date: { type: Date, default: () => new Date() },
    note: { type: String },
  },
  { _id: false }
)

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [OrderItemSchema], required: true },

    // Pricing
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["cod", "online", "wallet"],
      required: true,
    },
    shippingAddress: { type: Schema.Types.Mixed, required: true },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },

    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null,
    },
    rejectedByWarehouses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Warehouse",
      },
    ],
  },
  {
    timestamps: true,
  }
)

OrderSchema.index({ warehouse: 1, status: 1 })

export const Order =
  mongoose.models.Order ||
  mongoose.model<IOrder>("Order", OrderSchema)