import {Router} from "express"
import { createCashfreeOrder, verifyCashfreePayment } from "../controllers/payment.controller.js"
const router = Router();




// const cashfreeController = require("../controllers/cashfreeController")

router.post("/create-order",  createCashfreeOrder)
router.get("/verify/:orderId", verifyCashfreePayment)

export default router;
