import { Router } from "express";
import {
  getCurrentUser,
  googleCallbackLogin,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  updateProfile
} from "../controllers/user.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addToCart,
 emptyCart,
 getCartCards,
 removeCartCard,
  totalCartAmount,
  updateCartCardQuantity,
} from "../controllers/cart.controller.js";

import {
  createReview,
  deleteReview,
  updateReview
} from "../controllers/review.controller.js";

import { checkOtp, sendOTP } from "../controllers/verification.controller.js";
import {
  cancelOrder,
  createOrder,
  getCertainOrder,
  getUserOrders
} from "../controllers/order.controller.js";

import { getAllCards, getCardById } from "../controllers/card.controller.js";
import { addAddress, addOrUpdateDefaultAddress, deleteAddress, getAllAddresses, updateAddress } from "../controllers/address.controller.js";
import { getAllEvents } from "../controllers/admin/event.controller.js";
import passport from "passport";

const router = Router();

/* ========================
   AUTH ROUTES
======================== */
router.post("/auth/registerUser", registerUser);
router.post("/auth/reset-password",resetPassword)
router.post("/auth/loginUser", loginUser);
router.post("/auth/getLoginOtp/:purpose", sendOTP);
router.get("/auth/me", verifyJWT, getCurrentUser);
router.post("/auth/logoutUser", verifyJWT, logoutUser);
router.put("/auth/updateProfile", verifyJWT, updateProfile); 
router.post("/auth/checkOtp/:purpose", checkOtp);
router.get("/auth/sendOtp/:email/:purpose", sendOTP);
router.post("/token/refreshAccessToken", refreshAccessToken);
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"],session:false })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "https://thenimantran.com/login" ,session:false}),
  googleCallbackLogin
);


router.post("/cart/addToCart", verifyJWT, addToCart);
router.get("/cart/getCartCards", verifyJWT,getCartCards);
router.delete("/cart/removeCartCard/:cardId", verifyJWT,removeCartCard);
router.put("/cart/updateCartCardQuantity/:cardId", verifyJWT, updateCartCardQuantity);
router.delete("/cart/emptyCart",verifyJWT,emptyCart)
router.get("/cart/totalAmount",verifyJWT,totalCartAmount)
/* ========================
   REVIEW ROUTES
======================== */
router.post("/review/createReview", verifyJWT, createReview);
router.put("/review/updateReview/:id", verifyJWT, updateReview);
router.delete("/review/deleteReview/:id", verifyJWT, deleteReview);

/* ========================
   CARD ROUTES
======================== */
router.get("/card/getAllCards", getAllCards);
router.get("/card/getCard/:id",getCardById);
 // use query params for filters

/* ========================
   ORDER ROUTES
======================== */
router.post("/order/createOrder", verifyJWT, createOrder);
router.get("/order/getUserOrders", verifyJWT, getUserOrders);

router.put("/order/cancelOrder/:id", verifyJWT, cancelOrder);
router.get("/order/getCertainOrder/:orderId",verifyJWT,getCertainOrder)    


// Address

router.route("/addAddress").post(verifyJWT,addAddress)
router.route("/getAllAddresses").get(verifyJWT,getAllAddresses)
router.route("/setDefaultAddress").put(verifyJWT,addOrUpdateDefaultAddress)
router.delete("/deleteAddress/:addressId",verifyJWT,deleteAddress)
router.put("/updateAddress/:addressId",verifyJWT,updateAddress)
// Events 
router.get("/events",getAllEvents)



export default router;
