import { Warehouse, IWarehouse } from "../models/warehouse.model.js"
import mongoose from "mongoose"

export interface NearestWarehouseResult {
  warehouse: IWarehouse & { _id: mongoose.Types.ObjectId; distance: number }
  withinRadius: boolean
}


export const findNearestWarehouses = async (
  lat: number,
  lng: number,
  limit = 3
): Promise<NearestWarehouseResult[]> => {
  const results = await Warehouse.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [lng, lat], 
        },
        distanceField: "distance", 
        spherical: true,
        query: { isActive: true }, 
      },
    },
    { $limit: limit },
  ])

  return results.map((w) => ({
    warehouse: w,
    withinRadius: w.distance <= w.deliveryRadius,
  }))
}


export const findNearestWarehouse = async (
  lat: number,
  lng: number
): Promise<(IWarehouse & { _id: mongoose.Types.ObjectId; distance: number }) | null> => {
  const candidates = await findNearestWarehouses(lat, lng, 3)
  const match = candidates.find((c) => c.withinRadius)
  return match ? match.warehouse : null
}