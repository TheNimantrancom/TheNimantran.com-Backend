import mongoose, { Schema, } from "mongoose";
/* =========================
   SCHEMAS
========================= */
const cartItemSchema = new Schema({
    cardId: {
        type: Schema.Types.ObjectId,
        ref: "Card",
        required: true,
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1,
    },
});
const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    cards: {
        type: [cartItemSchema],
        default: [],
    },
}, {
    timestamps: true,
});
export const Cart = mongoose.model("Cart", cartSchema);
