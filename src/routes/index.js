import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import normalRoutes from "./user.routes.js";
import wholesalerRoutes from "./wholesaler.routes.js"
import healthRoutes from "./health.routes.js"
import paymentRoutes from "./payment.routes.js"
const router = Router();

router.use("/admin", adminRoutes);
router.use("/user", normalRoutes);
router.use("/wholesaler",wholesalerRoutes)
router.use("/check",healthRoutes);
router.use("/pay",paymentRoutes)
export default router;
