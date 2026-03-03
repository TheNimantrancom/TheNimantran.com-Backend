import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"

/* =========================
   CATEGORY TYPE
========================= */

export interface ICategory extends Document {
  name: string
  slug: string
  parent: Types.ObjectId | null
  description: string
  image: string
  isActive: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

/* =========================
   SCHEMA
========================= */

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export const Category: Model<ICategory> =
  mongoose.model<ICategory>("Category", categorySchema)