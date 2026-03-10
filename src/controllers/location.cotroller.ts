import { Request, Response } from "express";
import { User } from "../models/user.model.js";
import { ServiceZone } from "../models/serviceZone.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const updateLocation = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { lat, lng } = req.body;

    if (typeof lat !== "number" || typeof lng !== "number") {
      throw new ApiError(400, "Invalid coordinates");
    }

    const update = {
      "location.type": "Point",
      "location.coordinates": [lng, lat],
      "location.updatedAt": new Date(),
    };

    const user = await User.findByIdAndUpdate(req.user?._id, update, {
      new: true,
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, { lat, lng }, "Location updated successfully"));
  }
);
export const checkServiceAvailability = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new ApiError(400, "Invalid coordinates");
    }

    const zone = await ServiceZone.findOne({
      location: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [lng, lat],
          },
        },
      },
    });

    if (!zone) {
      res.status(200).json(
        new ApiResponse(200, {
          serviceAvailable: false,
        }, "Service not available in this area")
      );
      return;
    }

    res.status(200).json(
      new ApiResponse(200, {
        serviceAvailable: true,
        city: zone.city,
        zone: zone.name,
      }, "Service available")
    );
  }
);