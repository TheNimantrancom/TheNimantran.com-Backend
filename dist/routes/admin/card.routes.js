import { Router } from "express";
import { countTotalCards } from "../../controllers/admin/card.controller.js";
const router = Router();
router.get("/countCards", countTotalCards);
export default router;
