import express from "express";


import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getDirections, reverseGeocode, updateLocation } from "../controllers/location.cotroller.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/update", updateLocation);
router.get("/reverse-geocode", reverseGeocode);
router.get("/directions", getDirections);

export default router;
