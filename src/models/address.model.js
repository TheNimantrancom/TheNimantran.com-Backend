import mongoose, { Schema } from "mongoose";

const addressInfoSchema = new Schema(
  {
    name: {
      type: String,
      lowercase: true,
      trim: true,
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number format"] // Indian phone validation
    },
    alternatePhone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, "Invalid phone number format"],
      default: null
    },
    state: {
      type: String,
      lowercase: true,
      required: true,
      trim: true
    },
    city: {
      type: String,
      lowercase: true,
      required: true,
      trim: true
    },
    roadAreaColony: {
      type: String,
      lowercase: true,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Invalid pincode format"]
    },
    landmark: {
      type: String,
      lowercase: true,
      trim: true,
      default: ""
    },
    typeOfAddress: {
      type: String,
      trim: true,
      lowercase: true,
      enum: ["home", "work", "other"],
      default: "home"
    }
  },
  { _id: false } // Prevents extra IDs for sub-documents
);

const addressSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true // performance optimization
    },
    addresses: [addressInfoSchema]
  },
  { timestamps: true }
);

export const Address = mongoose.model("Address", addressSchema);
