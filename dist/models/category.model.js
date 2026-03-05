import mongoose, { Schema, } from "mongoose";
/* =========================
   SCHEMA
========================= */
const categorySchema = new Schema({
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
}, { timestamps: true });
export const Category = mongoose.model("Category", categorySchema);
