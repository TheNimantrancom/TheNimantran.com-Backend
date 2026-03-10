import mongoose from "mongoose";

const serviceZoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  city: {
    type: String,
    required: true,
  },

  location: {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true,
    },

    coordinates: {
      type: [[[Number]]],
      required: true,
    },
  },
});

serviceZoneSchema.index({ location: "2dsphere" });

export const ServiceZone = mongoose.model("ServiceZone", serviceZoneSchema);