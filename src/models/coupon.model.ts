import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose"

/* =========================
   COUPON TYPE
========================= */

export interface ICoupon extends Document {
  code: string
  discount: number
  expiryDate: Date
  createdAt?: Date
  updatedAt?: Date
}

/* =========================
   SCHEMA
========================= */

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
)

const Coupon: Model<ICoupon> =
  mongoose.model<ICoupon>("Coupon", couponSchema)

export default Coupon