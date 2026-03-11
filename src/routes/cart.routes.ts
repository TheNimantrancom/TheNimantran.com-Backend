import express from "express";
import {
  addToCart,
  getCartCards,
  removeCartCard,
  updateCartCardQuantity,
  emptyCart,
  totalCartAmount
} from "../controllers/cart.controller.js";

const router = express.Router();

router.post("/add", addToCart);
router.get("/", getCartCards);
router.get("/total", totalCartAmount);
router.patch("/update/:cardId", updateCartCardQuantity);
router.delete("/remove/:cardId", removeCartCard);
router.delete("/empty", emptyCart);

export default router;