import mongoose, { Schema, } from "mongoose";
/* =========================
   SCHEMA
========================= */
const wholesalerApplicationSchema = new Schema({
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
}, { timestamps: true });
const WholesalerApplication = mongoose.model("WholesalerApplication", wholesalerApplicationSchema);
export default WholesalerApplication;
