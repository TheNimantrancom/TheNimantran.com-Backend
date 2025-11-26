import express from "express";
import axios from "axios";
import asyncHandler from "../utils/asyncHandler.js";



// Example deliverable pincodes (in production store in DB)
const deliverablePincodes = ["276288", "201002", "110001", "110002"];




const checkDeliveryAutomatically = asyncHandler(  async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

  try {
    const geoResponse = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: { latlng: `${lat},${lng}`, key: process.env.GOOGLE_MAPS_API_KEY }
      }
    );
    console.log(geoResponse);
    if (!geoResponse.data.results.length) {
      return res.status(400).json({ available: false, message: "No address found" });
    }

    // Extract pincode from address components
    const addressComponents = geoResponse.data.results[0].address_components;
    const pincodeComponent = addressComponents.find(c => c.types.includes("postal_code"));
    const pincode = pincodeComponent ? pincodeComponent.long_name : null;

    if (!pincode) {
      return res.status(200).json({ available: false, pincode: null, message: "Pincode not found" });
    }

    const isAvailable = deliverablePincodes.includes(pincode);

    res.json({
      available: isAvailable,
      pincode,
      message: isAvailable
        ? "✅ Delivery available in your area"
        : "❌ Sorry, we don't deliver here yet"
    });
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: "Error checking delivery availability" });
  }
});
const checkDeliveryManually = asyncHandler((req, res) => {
  const { pincode } = req.query;

  const isAvailable = deliverablePincodes.includes(pincode);
  res.json({
    available: isAvailable,
    pincode,
    message: isAvailable
      ? "✅ Delivery available in your area"
      : "❌ Sorry, we don't deliver here yet"
  });
})



export {checkDeliveryAutomatically,checkDeliveryManually  }
