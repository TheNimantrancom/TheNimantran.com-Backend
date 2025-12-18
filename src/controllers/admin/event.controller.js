import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Event } from "../../models/event.model.js";
import ApiResponse from "../../utils/apiResponse.js";
import { generateSignedUrl } from "../../utils/awsS3.js";
import { deleteFromS3 } from "../../utils/awsS3.js";




 const addEvent = asyncHandler(async (req, res) => {
  const { eventName, mediaKey, mediaType,link } = req.body;

  if (!eventName || !mediaKey || !mediaType) {
    throw new ApiError(400, "Missing required fields");
  }

  const event = await Event.create({
    eventName,
    eventMediaKey: mediaKey,
    link,
    eventMediaType: mediaType
  });

  return res.status(201).json(
    new ApiResponse(201, event, "Event created successfully")
  );
});



 const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({});

  const formatted = events.map(e => ({
    ...e.toObject(),
    mediaUrl: generateSignedUrl(e.eventMediaKey)
  }));

  return res.status(200).json(
    new ApiResponse(200, formatted, "Events fetched")
  );
});

 const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  await deleteFromS3(event.eventMediaKey);
  await event.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, {}, "Event deleted successfully")
  );
});



export {addEvent,getAllEvents,deleteEvent}