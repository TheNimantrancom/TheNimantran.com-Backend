import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Order from "../models/order.model.js";
import { v4 as uuidv4 } from "uuid"; // For unique order IDs
import { Card } from "../models/card.model.js";

export const createOrder = asyncHandler(async (req, res) => {
  const user = req.user;
  const userId = user._id;

  const {
    items,
    paymentMethod,
    shippingAddress
  } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, "Order items are required");
  }

  let totalAmount = 0;
  let discount = 0;

  const populatedItems = await Promise.all(
    items.map(async (item) => {
      const card = await Card.findById(item.cardId);

      if (!card) {
        throw new ApiError(404, "Card not found");
      }

      const isWholesale =
        user.wholesalerStatus === "approved" &&
        card.isAvailableForWholesale;

      const packSize = isWholesale
        ? card.quantityPerBundleWholesale
        : card.quantityPerBundleCustomer;

      const pricePerPack = isWholesale
        ? card.wholesalePrice
        : card.price;

      const discountPerPack = isWholesale
        ? card.wholesaleDiscount || 0
        : card.discount || 0;

      const packs = Number(item.quantity);

      const itemTotal = packs * pricePerPack;
      const itemDiscount = packs * discountPerPack;

      totalAmount += itemTotal;
      discount += itemDiscount;

      return {
        cardId: card._id,
        name: card.name,
        categories: card.categories,
        packs,
        packSize,
        pricePerPack,
        discountPerPack,
        totalPrice: itemTotal,
        image: card.images?.primaryImage,
        specifications: card.specifications,
        isWholesale
      };
    })
  );

  const deliveryThreshold =
    user.wholesalerStatus === "approved" ? 2000 : 200;

  const shippingFee =
    totalAmount - discount >= deliveryThreshold ? 0 : 40;

  const tax = 0;

  const finalAmount = totalAmount - discount + shippingFee + tax;

  const order = await Order.create({
    orderId: uuidv4(),
    user: userId,
    items: populatedItems,
    totalAmount,
    discount,
    tax,
    shippingFee,
    finalAmount,
    paymentMethod,
    shippingAddress,
    status: "pending",
    statusHistory: [{ status: "pending", date: new Date() }]
  });

  return res
    .status(201)
    .json(new ApiResponse(201, order, "Order created successfully"));
});


export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const orders = await Order.find({ user: userId })
    .populate("items.cardId", "name price")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "User orders fetched successfully"));
});
export const getCertainOrder = asyncHandler(async (req,res)=>{

  const {orderId} = req.params;

  if(!orderId)
  {
    throw new ApiError(400,"Sorry Order id has not been found");
  }


  const order = await Order.findOne({orderId});


  if(!order)
  {
    throw new ApiError(404,"Sorry no order has been found")
  }


return res.status(202)
.json(
  new ApiResponse(202,order,"Order fetched successfully")
)

})
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const order = await Order.findOne({ _id: id, user: userId });

  if (!order) {
    throw new ApiError(404, "Order not found or unauthorized");
  }

  if (order.status !== "pending") {
    throw new ApiError(400, "Only pending orders can be cancelled");
  }

  order.status = "cancelled";
  order.statusHistory.push({ status: "cancelled", date: new Date() });

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order cancelled successfully"));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  order.status = status;
  order.statusHistory.push({ status, date: new Date() });

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});





 