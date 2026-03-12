import mongoose, { Document, Schema, Types } from "mongoose"
import bcrypt from "bcryptjs"



export interface IWarehouse extends Document {
  _id: Types.ObjectId
  name: string
  city: string
  address: string
  location: {
    type: "Point"
    coordinates: [number, number] // [lng, lat]
  }
  /** Delivery radius in metres — default 10 km */
  deliveryRadius: number
  isActive: boolean
  managerName?: string
  contactEmail: string
  contactPhone?: string
  password: string
  createdAt: Date
  updatedAt: Date

  /** Instance method — compares plain text against stored hash */
  comparePassword(candidatePassword: string): Promise<boolean>
}

/* ------------------------------------------------------------------ */
/*  Schema                                                              */
/* ------------------------------------------------------------------ */

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
      default: 10_000, 
    },

    isActive: { type: Boolean, default: true, index: true },

    managerName: { type: String, trim: true },

    contactEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    contactPhone: { type: String },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, 
    },
  },
  { timestamps: true }
)



WarehouseSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})



WarehouseSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}



WarehouseSchema.index({ location: "2dsphere" })


export const Warehouse =
  mongoose.models.Warehouse ||
  mongoose.model<IWarehouse>("Warehouse", WarehouseSchema)