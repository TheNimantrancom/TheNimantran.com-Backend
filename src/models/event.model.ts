import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose"

/* =========================
   EVENT TYPE
========================= */

export type EventMediaType =
  | "image"
  | "video"
  | "gif"

export interface IEvent extends Document {
  eventName: string
  eventMediaKey: string
  eventMediaType: EventMediaType
  link: string
  createdAt: Date
  updatedAt: Date
}

/* =========================
   SCHEMA
========================= */

const eventSchema = new Schema<IEvent>(
  {
    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    eventMediaKey: {
      type: String,
      required: true,
      trim: true,
    },

    eventMediaType: {
      type: String,
      required: true,
      trim: true,
      enum: ["image", "video", "gif"],
    },

    link: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

export const Event: Model<IEvent> =
  mongoose.model<IEvent>("Event", eventSchema)