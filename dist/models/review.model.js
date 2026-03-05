import mongoose, { Schema, } from "mongoose";
const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 500,
    },
}, {
    timestamps: true,
});
/* =========================
   INDEXING (Recommended)
========================= */
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
const Review = mongoose.model("Review", reviewSchema);
export default Review;
