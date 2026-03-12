import { Router } from "express"
import {
  createOrder,
  getUserOrders,
  getOrder,
  cancelOrder,
  updateOrderStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/order.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
// import { verifyAdminToken } from "../middlewares/adminAuth.middleware.js"

const router = Router()

// Customer routes (authenticated)
router.use(verifyJWT)

router.post("/", createOrder)
router.get("/", getUserOrders)
router.get("/:orderId", getOrder)
router.put("/:orderId/cancel", cancelOrder)

// Razorpay (stubs — uncomment when SDK is wired in)
router.post("/:orderId/razorpay/create", createRazorpayOrder)
router.post("/:orderId/razorpay/verify", verifyRazorpayPayment)

// Admin only
// router.put("/:orderId/status", verifyAdminToken, updateOrderStatus)

export default router