import { Warehouse } from "../models/warehouse.model.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getNearestWarehouse = asyncHandler(
  async (req: Request, res: Response) => {

    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (!lat || !lng) {
      throw new ApiError(400,"Coordinates required");
    }

    const warehouses = await Warehouse.aggregate([
      {
        $geoNear:{
          near:{
            type:"Point",
            coordinates:[lng,lat]
          },
          distanceField:"distance",
          spherical:true
        }
      },
      {
        $limit:1
      }
    ]);

    if(!warehouses.length){
      res.json(
        new ApiResponse(200,{serviceAvailable:false})
      );
      return;
    }

    const warehouse = warehouses[0];

    const withinRadius =
      warehouse.distance <= warehouse.deliveryRadius;

    res.json(
      new ApiResponse(200,{
        serviceAvailable:withinRadius,
        warehouse:{
          id:warehouse._id,
          name:warehouse.name,
          city:warehouse.city,
          distance:Math.round(warehouse.distance/1000)
        }
      })
    );

  }
);