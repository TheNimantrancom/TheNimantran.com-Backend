import mongoose, { Schema, } from "mongoose";
/* =========================
   SCHEMA
========================= */
const couponSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
