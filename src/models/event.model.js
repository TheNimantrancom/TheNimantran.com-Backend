import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      required: true,
      trim: true
    },

    eventMediaKey: {
      type: String,
      required: true,
      trim: true
    },

    eventMediaType: {
      type: String,
      required: true,
      trim: true
    },

    link: {
      type: String,
      required: true,
      trim: true
    }
  },
  { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
