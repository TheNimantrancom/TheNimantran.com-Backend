import ApiError from "../../utils/apiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { Event } from "../../models/event.model.js";
import ApiResponse from "../../utils/apiResponse.js";
import { generateSignedUrl, deleteFromS3 } from "../../utils/awsS3.js";


const addEvent = asyncHandler(async (req, res) => {
  const { eventName, mediaKey, mediaType, link } = req.body;

  if (!eventName || !mediaKey || !mediaType || !link) {
    throw new ApiError(400, "eventName, mediaKey, mediaType and link are required");
  }

  const event = await Event.create({
    eventName: eventName.trim(),
    eventMediaKey: mediaKey,
    eventMediaType: mediaType,
    link: link.trim()
  });

  return res.status(201).json(
    new ApiResponse(201, event, "Event created successfully")
  );
});


const getAllEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({})
    .sort({ createdAt: -1 })
    .lean();

  const formatted = events.map(event => ({
    ...event,
    mediaUrl: event.eventMediaKey
      ? generateSignedUrl(event.eventMediaKey)
      : null
  }));

  return res.status(200).json(
    new ApiResponse(200, formatted, "Events fetched successfully")
  );
});


const deleteEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    throw new ApiError(400, "Event ID is required");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.eventMediaKey) {
    await deleteFromS3(event.eventMediaKey);
  }

  await event.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, {}, "Event deleted successfully")
  );
});
const updateEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { eventName, mediaKey, mediaType, link } = req.body;

  if (!eventName || !link) {
    throw new ApiError(400, "Event name and link are required");
  }

  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Update fields
  event.eventName = eventName;
  event.link = link;
  
  // Only update media if provided
  if (mediaKey) {
    event.eventMediaKey = mediaKey;
  }
  
  if (mediaType) {
    event.eventMediaType = mediaType;
  }

  await event.save();

  // Generate signed URL for the updated event
  const formattedEvent = {
    ...event.toObject(),
    mediaUrl: generateSignedUrl(event.eventMediaKey)
  };

  return res.status(200).json(
    new ApiResponse(200, formattedEvent, "Event updated successfully")
  );
});
export {
  addEvent,
  getAllEvents,
  deleteEvent,
  updateEvent
};
