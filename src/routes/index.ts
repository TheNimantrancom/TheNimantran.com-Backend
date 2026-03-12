import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import normalRoutes from "./user.routes.js";
// import wholesalerRoutes from "./wholesaler.routes.js"
import healthRoutes from "./health.routes.js"
import paymentRoutes from "./payment.routes.js"
import templateRoutes from "./template.routes.js"
import designRoutes from "./design.routes.js"
import aiRoutes from "./ai.routes.js"
import locationRoutes from "./location.routes.js"
import cartRoutes from "./cart.routes.js";
import warehouseRoutes from "./warehouse.routes.js"
import orderRoutes from "./order.routes.js"
const router = Router();

router.use("/admin", adminRoutes);
router.use("/user", normalRoutes);
// router.use("/wholesaler",wholesalerRoutes)
router.use("/check",healthRoutes);
router.use("/payments",paymentRoutes)
router.use("/templates",templateRoutes)
router.use("/design",designRoutes);
router.use("/ai",aiRoutes)
router.use("/cart", cartRoutes);
router.use("/location",locationRoutes)
router.use("/warehouse",warehouseRoutes)
router.use("/orders".orderRoutes)
export default router;
