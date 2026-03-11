import mongoose, { Document, Schema, Types } from "mongoose"



export interface IWarehouse extends Document {
  _id: Types.ObjectId
  name: string
  city: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number] 
  }
  deliveryRadius: number
  isActive: boolean
  managerName?: string
  contactEmail?: string
  contactPhone?: string
  createdAt: Date
  updatedAt: Date
}


const WarehouseSchema = new Schema<IWarehouse>(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number], 
        required: true,
      },
    },

    deliveryRadius: {
      type: Number,
      required: true,
      default: 10000,
    },

    isActive: { type: Boolean, default: true, index: true },

    managerName: { type: String },
    contactEmail: { type: String },
    contactPhone: { type: String },
  },
  { timestamps: true }
)


WarehouseSchema.index({ location: "2dsphere" })

export const Warehouse =
  mongoose.models.Warehouse ||
  mongoose.model<IWarehouse>("Warehouse", WarehouseSchema)