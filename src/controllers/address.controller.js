import { Address } from "../models/address.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


export const addAddress = asyncHandler(async (req, res) => {
  const { name, phone, alternatePhone, state, city, roadAreaColony, pincode, landmark, typeOfAddress } = req.body;
  const userId = req.user._id;

  if (!name || !phone || !state || !city || !roadAreaColony || !pincode) {
    throw new ApiError(400, "All required address fields must be provided");
  }

  let userAddressDoc = await Address.findOne({ userId });

  const newAddress = {
    name,
    phone,
    alternatePhone,
    state,
    city,
    roadAreaColony,
    pincode,
    landmark,
    typeOfAddress
  };

  if (!userAddressDoc) {
    userAddressDoc = await Address.create({
      userId,
      addresses: [newAddress]
    });
  } else {
    userAddressDoc.addresses.push(newAddress);
    await userAddressDoc.save();
  }

  return res.status(201).json(new ApiResponse(201, userAddressDoc, "Address added successfully"));
});


export const getAllAddresses = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const addressDoc = await Address.findOne({ userId });
  if (!addressDoc || addressDoc.addresses.length === 0) {
    throw new ApiError(404, "No addresses found for this user");
  }

  return res.status(200).json(new ApiResponse(200, addressDoc.addresses, "Addresses fetched successfully"));
});


export const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user._id;

  const addressDoc = await Address.findOne({ userId });
  if (!addressDoc) {
    throw new ApiError(404, "No addresses found for this user");
  }

  const addressIndex = addressDoc.addresses.findIndex(addr => addr._id.toString() === addressId);
  if (addressIndex === -1) {
    throw new ApiError(404, "Address not found");
  }

  // Update only provided fields
  Object.keys(req.body).forEach(key => {
    if (req.body[key] !== undefined) {
      addressDoc.addresses[addressIndex][key] = req.body[key];
    }
  });

  await addressDoc.save();

  return res.status(200).json(new ApiResponse(200, addressDoc.addresses[addressIndex], "Address updated successfully"));
});


export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user._id;

  const addressDoc = await Address.findOne({ userId });
  if (!addressDoc) {
    throw new ApiError(404, "No addresses found for this user");
  }

  const initialLength = addressDoc.addresses.length;
  addressDoc.addresses = addressDoc.addresses.filter(addr => addr._id.toString() !== addressId);

  if (addressDoc.addresses.length === initialLength) {
    throw new ApiError(404, "Address not found");
  }

  await addressDoc.save();

  return res.status(200).json(new ApiResponse(200, null, "Address deleted successfully"));
});
