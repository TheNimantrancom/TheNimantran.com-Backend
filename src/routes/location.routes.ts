import express from "express";
import {
  updateLocation,
  checkServiceAvailability,
} from "../controllers/location.cotroller.js";
import { getNearestWarehouse } from "../controllers/warehouse.controller.js";

const router = express.Router();

router.post("/update", updateLocation);

router.get("/check-service", checkServiceAvailability);
router.get("/nearest-warehouse",getNearestWarehouse)


export default router;