// models/wholesalerApplication.model.js
import mongoose from "mongoose";

const wholesalerApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  email:{ type: String, required: true,lowercase:true,trim:true,required:true  },
  businessName: { type: String, required: true,lowercase:true,trim:true,required:true },
  ownerName:{ type: String, required: true,lowercase:true,trim:true,required:true},
  gstNumber: { type: String, required: true },
  businessAddress: { type: String, required: true },
  contactNumber: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "declined"], default: "pending" },
  appliedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
});

export default mongoose.model("WholesalerApplication", wholesalerApplicationSchema);
