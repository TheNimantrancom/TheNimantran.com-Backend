import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"

/* =========================
   REVIEW TYPE
========================= */

export interface IReview extends Document {
  user: Types.ObjectId
  product: Types.ObjectId
  rating: number
  comment: string
  createdAt: Date
  updatedAt: Date
}

/* =========================
   SCHEMA
========================= */

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
)

/* =========================
   INDEXING (Recommended)
========================= */

reviewSchema.index({ product: 1 })
reviewSchema.index({ user: 1 })
reviewSchema.index({ product: 1, user: 1 }, { unique: true })

const Review: Model<IReview> =
  mongoose.model<IReview>("Review", reviewSchema)

export default Review