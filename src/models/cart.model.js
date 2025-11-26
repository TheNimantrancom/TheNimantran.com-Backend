import mongoose, { Schema } from "mongoose";


const cartItemSchema = new mongoose.Schema({

cardId:{
  type:Schema.Types.ObjectId,
  ref:"Card",
  required:true
},
quantity:{
  type:Number,
  default:1,
  min:1
}
})


const cartSchema = new mongoose.Schema({

 userId:{
  type:Schema.Types.ObjectId,
  ref:"User",
  required:true
 },
 cards:[cartItemSchema]
},{
  timestamps:true
})


export const Cart = mongoose.model("Cart",cartSchema)