import { Router } from "express"
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  syncCartPrices,
} from "../controllers/cart.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js" 

const router = Router()

router.use(verifyJWT)

router.get("/", getCart)
router.post("/add", addToCart)
router.patch("/item/:itemId", updateCartItem)
router.delete("/item/:itemId", removeCartItem)
router.delete("/", clearCart)
router.post("/sync", syncCartPrices)

export default router