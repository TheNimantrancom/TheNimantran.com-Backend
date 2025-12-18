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
eventMediaKey:{
  type:String,
  lowercase:true,
  trim:true
},
eventMediaType:{
  type:String,
  lowercase:true,
  trim:true
},
link:{
  type:String
}
})


export const Event = mongoose.model("Event",eventSchema);