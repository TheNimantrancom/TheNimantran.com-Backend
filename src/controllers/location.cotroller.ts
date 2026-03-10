import { Request, Response } from "express";
import  {User}  from "../models/user.model.js";
import {
  reverseGeocode as googleReverse,
  getDirections as googleDirections,
} from "../utils/google.js";
import ApiError  from "../utils/apiError.js";
import ApiResponse  from "../utils/apiResponse.js";
import  asyncHandler  from "../utils/asyncHandler.js";

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeometry {
  location: { lat: number; lng: number };
}

interface GoogleResult {
  formatted_address: string;
  place_id: string;
  geometry?: GoogleGeometry;
  address_components: GoogleAddressComponent[];
}

interface GoogleReverseResponse {
  results: GoogleResult[];
  status: string;
}

interface GoogleDirectionsResponse {
  routes: any[];
  status: string;
}

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
    }).populate("userFriends");

    if (!user) {
      throw new ApiError(404, "User not found");
    }


    res
      .status(200)
      .json(
        new ApiResponse(200, { lat, lng }, "Location updated successfully")
      );
  }
);



export const reverseGeocode = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new ApiError(400, "Invalid coordinates");
    }

    const geo: GoogleReverseResponse | null = await googleReverse(lat, lng);

    if (!geo || !geo.results?.length) {
      throw new ApiError(404, "No address found for this location");
    }

    const first = geo.results[0];

    const simplified = {
      formatted_address: first.formatted_address,
      place_id: first.place_id,
      lat: first.geometry?.location.lat ?? lat,
      lng: first.geometry?.location.lng ?? lng,
      country:
        first.address_components.find((c) => c.types.includes("country"))
          ?.long_name || null,
      state:
        first.address_components.find((c) =>
          c.types.includes("administrative_area_level_1")
        )?.long_name || null,
      city:
        first.address_components.find((c) => c.types.includes("locality"))
          ?.long_name || null,
      postal_code:
        first.address_components.find((c) => c.types.includes("postal_code"))
          ?.long_name || null,
    };

    res
      .status(200)
      .json(new ApiResponse(200, simplified, "Reverse geocode successful"));
  }
);

export const getDirections = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const origin = req.query.origin as string;
    const destination = req.query.destination as string;

    if (!origin || !destination) {
      throw new ApiError(400, "Missing origin or destination");
    }

    const directions: GoogleDirectionsResponse = await googleDirections(
      origin,
      destination
    );

    if (
      !directions ||
      directions.status !== "OK" ||
      !directions.routes?.length
    ) {
      throw new ApiError(404, `No routes found (${directions?.status})`);
    }

    const bestRoute = directions.routes[0];

    const overview = {
      summary: bestRoute.summary,
      bounds: bestRoute.bounds,
      legs: bestRoute.legs.map(
        (leg: {
          start_address: string;
          end_address: string;
          distance: { text: string; value: number };
          duration: { text: string; value: number };
        }) => ({
          start_address: leg.start_address,
          end_address: leg.end_address,
          distance: leg.distance.text,
          duration: leg.duration.text,
        })
      ),
      polyline: bestRoute.overview_polyline.points,
    };

    res
      .status(200)
      .json(new ApiResponse(200, overview, "Directions fetched successfully"));
  }
);
