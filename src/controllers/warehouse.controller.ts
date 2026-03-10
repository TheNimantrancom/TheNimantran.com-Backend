import { Warehouse } from "../models/warehouse.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import { Request, Response } from "express";

interface WarRequest extends Request {
  query: {
    lat: string
    lng: string
  }
}

export const getNearestWarehouse = asyncHandler(
  async (req:Request, res: Response)=>{

    const lat = parseFloat(req?.query?.lat as any);
    const lng = parseFloat(req?.query?.lng as any);

    if (!lat || !lng) {
      throw new ApiError(400, "Coordinates required");
    }

    const warehouses = await Warehouse.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [lng, lat]
          },
          distanceField: "distance",
          spherical: true
        }
      },
      {
        $limit: 1
      }
    ]);

    if (!warehouses.length) {
     return  res.json(
        new ApiResponse(200, { service: false }, "Fetched")
      );
     
    }

    const warehouse = warehouses[0];

    const withinRadius =
      warehouse.distance <= warehouse.deliveryRadius;

    return  res.status(200).json(
      new ApiResponse(200, {
        serviceAvailable: withinRadius,
        warehouse: {
          id: warehouse._id,
          name: warehouse.name,
          city: warehouse.city,
          distance: Math.round(warehouse.distance / 1000)
        }
      }, "Fetched successfully")
    );
  }
);