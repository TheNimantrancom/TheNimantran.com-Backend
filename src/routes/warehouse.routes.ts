import { Router } from "express"
import {
  acceptOrder,
  rejectOrder,
  getWarehouseOrders,
} from "../controllers/warehouse.controller.js"
import { getNearestWarehouse } from "../controllers/getNearestWarehouse.controller.js"


const router = Router()


router.put("/acceptOrder/:orderId",  acceptOrder)
router.put("/rejectOrder/:orderId", rejectOrder)


router.get("/orders/:warehouseId", getWarehouseOrders)

router.get("/nearest", getNearestWarehouse)

export default router