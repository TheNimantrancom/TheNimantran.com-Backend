import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"

/* =========================
   ENUM TYPES
========================= */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned"

export type PaymentMethod =
  | "COD"
  | "Credit Card"
  | "UPI"
  | "Net Banking"

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"

export type PlacedBy =
  | "user"
  | "admin"
  | "franchise"
  | "retailer"

/* =========================
   SUB TYPES
========================= */

export interface IOrderItem {
  cardId: Types.ObjectId
  name: string
  categories: string[]
  packSize?: number
  pricePerPack?: number
  discountPerPack?: number
  totalPrice?: number
  isWholesale?: boolean
  specifications?: {
    material?: string
    dimensions?: string
    printing?: string
    weight?: string
    color?: string
    customizable?: boolean
  }
  image?: string
  packs?: number
}

export interface IShippingAddress {
  name?: string
  phone?: string
  alternatePhone?: string
  state?: string
  city?: string
  roadAreaColony?: string
  pincode?: string
  landmark?: string
  typeOfAddress?: string
}

export interface IStatusHistory {
  status: OrderStatus
  date: Date
}

/* =========================
   MAIN ORDER TYPE
========================= */

export interface IOrder extends Document {
  orderId: string
  user: Types.ObjectId
  status: OrderStatus
  items: IOrderItem[]

  totalAmount: number
  discount: number
  tax: number
  shippingFee: number
  finalAmount: number

  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  transactionId?: string

  shippingAddress?: IShippingAddress

  deliveryPartner?: string
  trackingId?: string

  placedBy: PlacedBy
  franchiseId?: Types.ObjectId
  orderNotes?: string

  statusHistory: IStatusHistory[]

  orderDate: Date
  deliveryDate?: Date

  createdAt: Date
  updatedAt: Date
}

/* =========================
   SCHEMA
========================= */

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },

    items: [
      {
        cardId: { type: Schema.Types.ObjectId, ref: "Card" },
        name: String,
        categories: [{ type: String }],
        packSize: Number,
        pricePerPack: Number,
        discountPerPack: Number,
        totalPrice: Number,
        isWholesale: Boolean,
        specifications: {
          material: String,
          dimensions: String,
          printing: String,
          weight: String,
          color: String,
          customizable: { type: Boolean, default: false },
        },
        image: String,
        packs: Number,
      },
    ],

    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "Credit Card", "UPI", "Net Banking"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    transactionId: { type: String, index: true },

    shippingAddress: {
      name: String,
      phone: String,
      alternatePhone: String,
      state: String,
      city: String,
      roadAreaColony: String,
      pincode: String,
      landmark: String,
      typeOfAddress: String,
    },

    deliveryPartner: String,
    trackingId: String,

    placedBy: {
      type: String,
      enum: ["user", "admin", "franchise", "retailer"],
      default: "user",
    },

    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
    },

    orderNotes: String,

    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now },
      },
    ],

    orderDate: { type: Date, default: Date.now },
    deliveryDate: Date,
  },
  { timestamps: true }
)

/* =========================
   PRE-SAVE HOOK
========================= */

orderSchema.pre<IOrder>("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      date: new Date(),
    })
  }
  next()
})

const Order: Model<IOrder> =
  mongoose.model<IOrder>("Order", orderSchema)

export default Order