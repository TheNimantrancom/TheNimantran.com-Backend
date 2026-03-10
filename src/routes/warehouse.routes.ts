import {Router} from "express"
import { getNearestWarehouse } from "../controllers/warehouse.controller.js"

const router = Router()


router.get("/nearest-warehouse",getNearestWarehouse)

export default router