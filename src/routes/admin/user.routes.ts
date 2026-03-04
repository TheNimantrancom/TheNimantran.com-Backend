import { Router } from "express";
import { getUserCount } from "../../controllers/admin/user.controller.js";
import { totalWholeSaler } from "../../controllers/admin/wholesaler.controller.js";


const router = Router();



router.get("/totalUsers",getUserCount)
router.get("/getWholeSalerUserCount",totalWholeSaler)

export default router;
