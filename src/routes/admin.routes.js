import { Router } from "express";
import {
  createCard,
  deleteCard,
  getCardById,
  getPopularCards,
  getTrendingCards,
  updateCard,
  getAllCards
} from "../controllers/admin/card.controller.js";

import {
  addTrackingInfo,
  deleteOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus
} from "../controllers/admin/order.controller.js";

import {
  getAllReviews,
  getReviewById,
  getReviewsByProduct,
  getReviewsByUser
} from "../controllers/admin/review.controller.js";

import { deleteReview, updateReview } from "../controllers/review.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import isAdmin from "../middlewares/authAdmin.middleware.js";
import { loginUser } from "../controllers/user.controller.js";
import {  reviewWholesaler, getWholesalerApplications, getAllUsers } from "../controllers/admin/user.controller.js";
import { addEvent, deleteEvent, getAllEvents } from "../controllers/admin/event.controller.js";
import { getPresignedUploadUrl } from "../controllers/upload.controllers.js";

const router = Router();

/* ----------------- PUBLIC ADMIN LOGIN ----------------- */
router.post("/securedLogin/login", loginUser);

/* ----------------- PROTECTED ADMIN ROUTES ----------------- */
router.use(verifyJWT, isAdmin);




// User
router.get("/getUsers",getAllUsers)





/* --- Cards --- */
router.post(
  "/createCard",
  createCard
);
router.put(
  "/updateCard/:id",

  updateCard
);

router.delete("/deleteCard/:id", deleteCard);
router.get("/getAllCards", getAllCards);
router.get("/getCards/:category", getPopularCards);
router.get("/getCard/:id", getCardById);
router.get("/getPopularCards", getPopularCards);
router.get("/getTrendingCards", getTrendingCards);


// Event

router.post("/addEvent",addEvent)
router.get("/events",getAllEvents)
router.delete("/deleteEvent/:eventId",deleteEvent)
/* --- Orders --- */
router.get("/getAllOrders", getAllOrders);
router.delete("/deleteOrder/:id", deleteOrder);
router.get("/getOrder/:id", getOrderById);
router.put("/addTrackingInfo/:id", addTrackingInfo);
router.put("/updateOrderStatus/:id", updateOrderStatus);
router.put("/updatePaymentStatus/:id", updatePaymentStatus);
router.post("/getSignedUrlUpload",getPresignedUploadUrl)










// Wholesaler 

// Admin fetches applications
router.get("/applications",  getWholesalerApplications);

// Admin reviews application
router.put("/review/:id",  reviewWholesaler);







/* --- Reviews --- */
router.get("/getAllReviews", getAllReviews);
router.get("/getReviewById/:id", getReviewById);
router.get("/getReviewsByProduct/:productId", getReviewsByProduct);
router.get("/getReviewsByUser/:userId", getReviewsByUser);
router.put("/updateReview/:id", updateReview);
router.delete("/deleteReview/:id", deleteReview);



// Category Creation








export default router;
