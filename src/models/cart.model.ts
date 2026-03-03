import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"

/* =========================
   CART ITEM TYPE
========================= */

export interface ICartItem {
  cardId: Types.ObjectId
  quantity: number
}

/* =========================
   CART DOCUMENT TYPE
========================= */

export interface ICart extends Document {
  userId: Types.ObjectId
  cards: ICartItem[]
  createdAt: Date
  updatedAt: Date
}

/* =========================
   SCHEMAS
========================= */

const cartItemSchema = new Schema<ICartItem>({
  cardId: {
    type: Schema.Types.ObjectId,
    ref: "Card",
    required: true,
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
})

const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cards: {
      type: [cartItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

export const Cart: Model<ICart> =
  mongoose.model<ICart>("Cart", cartSchema)