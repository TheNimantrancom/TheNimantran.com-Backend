import { Router } from "express"
import {
  createWarehouse,
  warehouseLogin,
  warehouseLogout,
  getWarehouseProfile,
} from "../controllers/warehouse/warehouseAuth.controller.js"
import {
  acceptOrder,
  rejectOrder,
  getWarehouseOrders,
} from "../controllers/warehouse.controller.js"
import { getNearestWarehouse } from "../controllers/getNearestWarehouse.controller.js"
import { verifyWarehouseToken } from "../middlewares/warehouseAuth.js"
// import { verifyAdminToken } from "../middlewares/adminAuth.middleware.js"

const router = Router()



router.post("/login", warehouseLogin)
router.post("/logout", warehouseLogout)



router.post(
  "/create",

  createWarehouse
)


router.get("/me", verifyWarehouseToken, getWarehouseProfile)

router.put("/acceptOrder/:orderId", verifyWarehouseToken, acceptOrder)
router.put("/rejectOrder/:orderId", verifyWarehouseToken, rejectOrder)
router.get("/orders/:warehouseId", verifyWarehouseToken, getWarehouseOrders)


router.get("/nearest", getNearestWarehouse)

export default router