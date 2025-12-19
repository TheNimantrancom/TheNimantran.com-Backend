import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "returned"
      ],
      default: "pending",
      index: true
    },


    items: [
      {
        cardId: { type: mongoose.Schema.Types.ObjectId, ref: "Card" },
        name: String,
        categories: [{
          type: String
        }],
        packSize: Number,
        pricePerPack: Number,
        discountPerPack: Number,
        totalPrice: Number,
        isWholesale: Boolean,
        specifications: {
          material: String,
          dimensions: String,
          printing: String,
          weight: String,
          color: String,
          customizable: { type: Boolean, default: false }
        },
        image: String,
        packs: Number,
      }
    ],


    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "Credit Card", "UPI", "Net Banking"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending"
    },
    transactionId: { type: String, index: true }, // For payment reconciliation

    // 🚚 Snapshot of address at order time
    shippingAddress: {
      name: String,
      phone: String,
      alternatePhone: String,
      state: String,
      city: String,
      roadAreaColony: String,
      pincode: String,
      landmark: String,
      typeOfAddress: String // home, work, other
    },

    deliveryPartner: { type: String },
    trackingId: { type: String },

    // 🏢 Admin / Franchise Info
    placedBy: {
      type: String,
      enum: ["user", "admin", "franchise", "retailer"],
      default: "user"
    },
    franchiseId: { type: mongoose.Schema.Types.ObjectId, ref: "Franchise" },
    orderNotes: { type: String },

    // 📅 Status Timeline
    statusHistory: [
      {
        status: String,
        date: { type: Date, default: Date.now }
      }
    ],

    // Order Dates
    orderDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date }
  },
  { timestamps: true }
);

// 📌 Automatically push status updates to statusHistory
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, date: new Date() });
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
