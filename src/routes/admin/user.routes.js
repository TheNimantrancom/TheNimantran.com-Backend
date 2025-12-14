import { Router } from "express";
import { getUserCount } from "../../controllers/admin/user.controller.js";


const router = Router();



router.get("/totalUsers",getUserCount)


export default router;
