import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import normalRoutes from "./user.routes.js";
import wholesalerRoutes from "./wholesaler.routes.js"
const router = Router();

// Mount routers with base paths
router.use("/admin", adminRoutes);
router.use("/user", normalRoutes);
router.use("/wholesaler",wholesalerRoutes)
export default router;
