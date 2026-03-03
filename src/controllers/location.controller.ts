import { Request, Response } from "express"
import axios, { AxiosError } from "axios"
import asyncHandler from "../utils/asyncHandler.js"

/* =========================
   CONFIG
========================= */

const deliverablePincodes: string[] = [
  "276288",
  "201002",
  "110001",
  "110002",
]

/* =========================
   GOOGLE RESPONSE TYPES
========================= */

interface AddressComponent {
  long_name: string
  types: string[]
}

interface GoogleGeocodeResult {
  address_components: AddressComponent[]
}

interface GoogleGeocodeResponse {
  results: GoogleGeocodeResult[]
}

/* =========================
   AUTO DELIVERY CHECK
========================= */

export const checkDeliveryAutomatically =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      const { lat, lng } = req.query

      if (!lat || !lng) {
        return res
          .status(400)
          .json({ error: "lat and lng required" })
      }

      const apiKey = process.env.GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        return res
          .status(500)
          .json({ error: "Google Maps API key missing" })
      }

      try {
        const geoResponse =
          await axios.get<GoogleGeocodeResponse>(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
              params: {
                latlng: `${lat},${lng}`,
                key: apiKey,
              },
            }
          )

        if (!geoResponse.data.results.length) {
          return res.status(400).json({
            available: false,
            message: "No address found",
          })
        }

        const addressComponents =
          geoResponse.data.results[0].address_components

        const pincodeComponent =
          addressComponents.find((c) =>
            c.types.includes("postal_code")
          )

        const pincode = pincodeComponent
          ? pincodeComponent.long_name
          : null

        if (!pincode) {
          return res.status(200).json({
            available: false,
            pincode: null,
            message: "Pincode not found",
          })
        }

        const isAvailable =
          deliverablePincodes.includes(pincode)

        return res.json({
          available: isAvailable,
          pincode,
          message: isAvailable
            ? "Delivery available in your area"
            : "Sorry, we don't deliver here yet",
        })
      } catch (error) {
        const err = error as AxiosError

        console.error(
          err.response?.data || err.message
        )

        return res.status(500).json({
          error:
            "Error checking delivery availability",
        })
      }
    }
  )

/* =========================
   MANUAL DELIVERY CHECK
========================= */

export const checkDeliveryManually =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ): Promise<Response> => {
      const { pincode } = req.query

      if (!pincode || typeof pincode !== "string") {
        return res
          .status(400)
          .json({ error: "Pincode required" })
      }

      const isAvailable =
        deliverablePincodes.includes(pincode)

      return res.json({
        available: isAvailable,
        pincode,
        message: isAvailable
          ? "Delivery available in your area"
          : "Sorry, we don't deliver here yet",
      })
    }
  )