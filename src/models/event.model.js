import mongoose from "mongoose";



const eventSchema = new mongoose.Schema({

eventName:{
  type:String,
  trim:true
},
eventImageUrl:{
  type:String,
  required:true
},
link:{
  type:String
}
})


export const Event = mongoose.model("Event",eventSchema);