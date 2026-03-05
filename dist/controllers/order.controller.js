import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import Order from "../models/order.model.js";
import { v4 as uuidv4 } from "uuid";
import { Card } from "../models/card.model.js";
export const createOrder = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }
    const user = req.user;
    const userId = user._id;
    const { items, paymentMethod, shippingAddress, } = req.body;
    if (!items || items.length === 0) {
        throw new ApiError(400, "Order items are required");
    }
    let totalAmount = 0;
    let discount = 0;
    const populatedItems = await Promise.all(items.map(async (item) => {
        const card = await Card.findById(item.cardId);
        if (!card) {
            throw new ApiError(404, "Card not found");
        }
        const isWholesale = user.wholesalerStatus === "approved" &&
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
            isWholesale,
        };
    }));
    const deliveryThreshold = user.wholesalerStatus === "approved"
        ? 2000
        : 200;
    const taxableAmount = Math.max(totalAmount - discount, 0);
    const shippingFee = taxableAmount >= deliveryThreshold
        ? 0
        : 40;
    const GST_RATE = 0.18;
    const gstAmount = Number((taxableAmount * GST_RATE).toFixed(2));
    const finalAmount = Number((taxableAmount +
        shippingFee +
        gstAmount).toFixed(2));
    const order = await Order.create({
        orderId: uuidv4(),
        user: userId,
        items: populatedItems,
        totalAmount,
        discount,
        tax: gstAmount,
        shippingFee,
        finalAmount,
        paymentMethod,
        shippingAddress,
        status: "pending",
        statusHistory: [
            { status: "pending", date: new Date() },
        ],
    });
    return res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
});
/* =========================
   GET USER ORDERS
========================= */
export const getUserOrders = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }
    const orders = await Order.find({
        user: req.user._id,
    })
        .populate("items.cardId", "name price")
        .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, orders, "User orders fetched successfully"));
});
/* =========================
   GET CERTAIN ORDER
========================= */
export const getCertainOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    if (!orderId) {
        throw new ApiError(400, "Order ID not provided");
    }
    const order = await Order.findOne({
        orderId,
    }).populate({
        path: "items.cardId",
        select: "name price images.primaryImage categories discount wholesalePrice wholesaleDiscount quantityPerBundleWholesale quantityPerBundleCustomer",
    });
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    return res.status(200).json(new ApiResponse(200, order, "Order fetched successfully"));
});
/* =========================
   CANCEL ORDER
========================= */
export const cancelOrder = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized");
    }
    const { id } = req.params;
    const order = await Order.findOne({
        _id: id,
        user: req.user._id,
    });
    if (!order) {
        throw new ApiError(404, "Order not found or unauthorized");
    }
    if (order.status !== "pending") {
        throw new ApiError(400, "Only pending orders can be cancelled");
    }
    order.status = "cancelled";
    order.statusHistory.push({
        status: "cancelled",
        date: new Date(),
    });
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
});
export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findById(id);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }
    order.status = status;
    order.statusHistory.push({
        status,
        date: new Date(),
    });
    await order.save();
    return res.status(200).json(new ApiResponse(200, order, "Order status updated successfully"));
});
