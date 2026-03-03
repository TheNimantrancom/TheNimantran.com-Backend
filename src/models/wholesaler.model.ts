import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"

/* =========================
   ENUM TYPE
========================= */

export type WholesalerApplicationStatus =
  | "pending"
  | "approved"
  | "declined"

/* =========================
   INTERFACE
========================= */

export interface IWholesalerApplication extends Document {
  user: Types.ObjectId
  email: string
  businessName: string
  ownerName: string
  gstNumber: string
  businessAddress: string
  contactNumber: string
  status: WholesalerApplicationStatus
  appliedAt: Date
  reviewedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/* =========================
   SCHEMA
========================= */

const wholesalerApplicationSchema =
  new Schema<IWholesalerApplication>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },

      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      businessName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      ownerName: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },

      gstNumber: {
        type: String,
        required: true,
        trim: true,
      },

      businessAddress: {
        type: String,
        required: true,
        trim: true,
      },

      contactNumber: {
        type: String,
        required: true,
        trim: true,
      },

      status: {
        type: String,
        enum: ["pending", "approved", "declined"],
        default: "pending",
        index: true,
      },

      appliedAt: {
        type: Date,
        default: Date.now,
      },

      reviewedAt: {
        type: Date,
      },
    },
    { timestamps: true }
  )

const WholesalerApplication: Model<IWholesalerApplication> =
  mongoose.model<IWholesalerApplication>(
    "WholesalerApplication",
    wholesalerApplicationSchema
  )

export default WholesalerApplication