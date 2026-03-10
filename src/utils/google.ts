import axios from "axios";

const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!GOOGLE_KEY) {
  console.warn(
    " No GOOGLE_MAPS_API_KEY set — geocoding & directions requests will fail"
  );
}

export interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleGeometry {
  location: { lat: number; lng: number };
}

export interface GoogleGeocodeResponse {
  results: Array<{
    formatted_address: string;
    place_id: string;
    address_components: GoogleAddressComponent[];
    geometry: GoogleGeometry;
  }>;
  status: string;
}

export interface GoogleDirectionsResponse {
  routes: Array<{
    summary: string;
    bounds: any;
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
      steps?: Array<any>;
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<GoogleGeocodeResponse> => {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_KEY}`;
  const { data } = await axios.get<GoogleGeocodeResponse>(url);
  return data;
};

export const getDirections = async (
  origin: string,
  destination: string
): Promise<GoogleDirectionsResponse> => {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&key=${GOOGLE_KEY}`;

  const { data } = await axios.get(url);

  return { ...data, status: data.status || "OK" };
};
