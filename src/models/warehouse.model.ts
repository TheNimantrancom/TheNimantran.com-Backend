import mongoose from "mongoose";

const warehouseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  city: {
    type: String,
    required: true
  },

  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },

    coordinates: {
      type: [Number],
      required: true
    }
  },

  deliveryRadius: {
    type: Number,
    default: 10000
  },

  active: {
    type: Boolean,
    default: true
  }
});

warehouseSchema.index({ location: "2dsphere" });

export const Warehouse = mongoose.model("Warehouse", warehouseSchema);