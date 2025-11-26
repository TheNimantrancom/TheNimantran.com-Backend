import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Event } from "../../models/event.model.js";
import ApiResponse from "../../utils/apiResponse.js";
import { uploadOnCloudinary } from "../../utils/cloudinary.js";




 const addEvent = asyncHandler(async(req,res)=>{

  const {eventName,link} = req.body;


  if(!eventName || eventName.trim()==="") 
{
  throw new ApiError(400,"Please provide all the feild")
}

const eventImageLocalPath = req.file.path;

if(!eventImageLocalPath)
{
  throw new ApiError(404,"Please provide the image ");
}




const eventImage = await uploadOnCloudinary(eventImageLocalPath)

if(!eventImage?.url)
{
  throw new ApiError(404,"Dear User ! Something went wrong ..Try again")
}

console.log(eventImage)
const event = await Event.create(
  {
    eventName,
    eventImageUrl:eventImage.url
  }
)



if(!event)
{
  throw new ApiError(400,"Something went wrong")
}


return res.status(202).json(
  new ApiResponse(200,event,"Event Added successfully")
)

 })
 const deleteEvent = asyncHandler(async(req,res)=>{

    const {eventId} = req.params;

  if(!eventId)
  {
    throw new ApiError(404,"Please provide the event to be deleted")
  }

    const deletedEvent = await Event.findByIdAndDelete(eventId)


    if(!deleteEvent)
    {
      throw new ApiError(404,"Sorry this is invalid or does not exist")
    }



    return res.status(202)
    .json(
      new ApiResponse(200,{},"Event deleted successfully")
    )










 })


 const getAllEvents =  asyncHandler(async(req,res)=>{


    const events = await Event.find({})


if(!events)
{
  throw new ApiError(400,"Sorry no event has been found yet")
}


return res.status(202).json(
  new ApiResponse(200,events,"Events fetched successfully")
)







 })








export {addEvent,getAllEvents,deleteEvent}