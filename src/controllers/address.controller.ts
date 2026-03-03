import { Request, Response } from "express"
import { Address, IAddressInfo } from "../models/address.model.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

/* =========================
   ADD ADDRESS
========================= */

export const addAddress = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const {
      name,
      phone,
      alternatePhone,
      state,
      city,
      roadAreaColony,
      pincode,
      landmark,
      typeOfAddress,
    } = req.body

    const userId = req.user._id

    if (!name || !phone || !state || !city || !roadAreaColony || !pincode) {
      throw new ApiError(
        400,
        "All required address fields must be provided"
      )
    }

    let userAddressDoc = await Address.findOne({ userId })

    const newAddress: IAddressInfo = {
      name,
      phone,
      alternatePhone,
      state,
      city,
      roadAreaColony,
      pincode,
      landmark,
      typeOfAddress,
    }

    if (!userAddressDoc) {
      userAddressDoc = await Address.create({
        userId,
        addresses: [newAddress],
      })
    } else {
      userAddressDoc.addresses.push(newAddress)
      await userAddressDoc.save()
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          userAddressDoc,
          "Address added successfully"
        )
      )
  }
)

/* =========================
   GET ALL ADDRESSES
========================= */

export const getAllAddresses = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const userId = req.user._id

    const addressDoc = await Address.findOne({ userId })

    if (!addressDoc) {
      throw new ApiError(404, "No addresses found for this user")
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        addressDoc.addresses,
        "Addresses fetched successfully"
      )
    )
  }
)

/* =========================
   UPDATE ADDRESS
========================= */

export const updateAddress = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const { addressId } = req.params
    const userId = req.user._id

    const addressDoc = await Address.findOne({ userId })

    if (!addressDoc) {
      throw new ApiError(404, "No addresses found for this user")
    }

    const address = addressDoc.addresses.find(
      (addr: any) => addr._id.toString() === addressId
    )

    if (!address) {
      throw new ApiError(404, "Address not found")
    }

    const allowedFields: (keyof IAddressInfo)[] = [
      "name",
      "phone",
      "alternatePhone",
      "state",
      "city",
      "roadAreaColony",
      "pincode",
      "landmark",
      "typeOfAddress",
    ]

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        ;(address as any)[key] = req.body[key]
      }
    }

    await addressDoc.save()

    return res.status(200).json(
      new ApiResponse(
        200,
        address,
        "Address updated successfully"
      )
    )
  }
)

/* =========================
   DELETE ADDRESS
========================= */

export const deleteAddress = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) {
      throw new ApiError(401, "Unauthorized")
    }

    const { addressId } = req.params
    const userId = req.user._id

    const addressDoc = await Address.findOne({ userId })

    if (!addressDoc) {
      throw new ApiError(404, "No addresses found for this user")
    }

    const beforeDeleteLength = addressDoc.addresses.length

    addressDoc.addresses = addressDoc.addresses.filter(
      (addr: any) =>
        addr._id.toString() !== addressId
    )

    if (addressDoc.addresses.length === beforeDeleteLength) {
      throw new ApiError(404, "Address not found")
    }

    if (
      addressDoc.defaultAddress &&
      (addressDoc.defaultAddress as any)._id?.toString() ===
        addressId
    ) {
      addressDoc.defaultAddress = undefined
    }

    await addressDoc.save()

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "Address deleted successfully"
        )
      )
  }
)

/* =========================
   ADD / UPDATE DEFAULT ADDRESS
========================= */

export const addOrUpdateDefaultAddress =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      if (!req.user) {
        throw new ApiError(401, "Unauthorized")
      }

      const {
        name,
        phone,
        alternatePhone,
        state,
        city,
        roadAreaColony,
        pincode,
        landmark,
        typeOfAddress,
      } = req.body

      const userId = req.user._id

      if (!name || !phone || !state || !city || !roadAreaColony || !pincode) {
        throw new ApiError(
          400,
          "All required address fields must be provided"
        )
      }

      const newAddress: IAddressInfo = {
        name,
        phone,
        alternatePhone,
        state,
        city,
        roadAreaColony,
        pincode,
        landmark,
        typeOfAddress,
      }

      const updated = await Address.findOneAndUpdate(
        { userId },
        {
          $set: { defaultAddress: newAddress },
        },
        { new: true, upsert: true }
      )

      return res.status(201).json(
        new ApiResponse(
          201,
          updated,
          "Default address updated successfully"
        )
      )
    }
  )