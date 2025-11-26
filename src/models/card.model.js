import mongoose from "mongoose";

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    enum: ['marriage', 'birthday', 'festival', 'baby-shower', 'business']
  },
  price: {
    type: Number,
    required: true
  },
  discount:{
    type:Number,
    default:0
  },
  wholesalePrice:{
    type:Number,
    default:999,
  },
  isAvailableForWholesale:{
    type:Boolean,
    default:false
  },
  quantityAvailable: {
    type: Number,
    required: true
  },
  rating: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    default: ""
  },
  reviewsCount: {
    type: Number,
    default: 0
  },
  isPopular:{
    type:Boolean,
    default:false
  },
  isTrending:{
    type:Boolean,
    default:false
  },
  images: {
    primaryImage: {
      type: String,
      required: true
    },
    primaryImageId:{
      type:String
    },
    secondaryImage: {
      type: String,
      default: ""
    },
    secondaryImageId:{
      type:String
    }
  },

  specifications: {
    material: { type: String },
    dimensions: { type: String },
    printing: { type: String },
    weight: { type: String },
    color: { type: String },
    customizable: {
      type: Boolean,
      required: true
    }
  }
}, {
  timestamps: true
});

export const Card = mongoose.model("Card", cardSchema);
