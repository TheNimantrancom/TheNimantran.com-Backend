import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose"

import {IAddress, IAddressInfo} from "../types/models/address.types.js"



const addressInfoSchema = new Schema<IAddressInfo>({
  name: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^[6-9]\d{9}$/, "Invalid phone number format"],
  },
  alternatePhone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, "Invalid phone number format"],
    default: null,
  },
  state: {
    type: String,
    lowercase: true,
    required: true,
    trim: true,
  },
  city: {
    type: String,
    lowercase: true,
    required: true,
    trim: true,
  },
  roadAreaColony: {
    type: String,
    lowercase: true,
    required: true,
    trim: true,
  },
  pincode: {
    type: String,
    required: true,
    match: [/^\d{6}$/, "Invalid pincode format"],
  },
  landmark: {
    type: String,
    lowercase: true,
    trim: true,
    default: "",
  },
  typeOfAddress: {
    type: String,
    trim: true,
    lowercase: true,
    enum: ["home", "work", "other"],
    default: "home",
  },
})

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    addresses: {
      type: [addressInfoSchema],
      default: [],
    },
    defaultAddress: {
      type: addressInfoSchema,
      default: undefined,
    },
  },
  { timestamps: true }
)

export const Address: Model<IAddress> =
  mongoose.model<IAddress>("Address", addressSchema)