import express from "express";
import {
  addToCart,
  getCartCards,
  removeCartCard,
  updateCartCardQuantity,
  emptyCart,
  totalCartAmount
} from "../controllers/cart.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/add",verifyJWT, addToCart);
router.get("/",verifyJWT, getCartCards);
router.get("/total",verifyJWT, totalCartAmount);
router.patch("/update/:cardId",verifyJWT, updateCartCardQuantity);
router.delete("/remove/:cardId",verifyJWT,removeCartCard);
router.delete("/empty",verifyJWT, emptyCart);

export default router;