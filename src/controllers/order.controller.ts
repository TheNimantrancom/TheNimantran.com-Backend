import { Request, Response } from "express"
import mongoose from "mongoose"
import { v4 as uuidv4 } from "uuid"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import {
  Order,
  type IOrder,
  type IOrderItem,
  type OrderStatus,
  type PaymentMethod,
} from "../models/order.model.js"
import { Cart } from "../models/cart.model.js"
import { Card } from "../models/card.model.js"
import Design from "../models/design.model.js"
import { findNearestWarehouse, findNearestWarehouses } from "../services/warehouse.service.js"
import { getIO } from "../index.js"
import {razorpay} from "../utils/razorpay.js"
import crypto from "crypto"
/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const GST_RATE = 0.18
const WHOLESALE_FREE_SHIPPING_THRESHOLD = 2000
const RETAIL_FREE_SHIPPING_THRESHOLD = 200
const SHIPPING_FEE = 40

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

const dispatchToWarehouse = (warehouseId: string, order: IOrder): void => {
  try {
    getIO().to(warehouseId).emit("NEW_ORDER", {
      orderId: order.orderId,
      _id: order._id,
      items: order.items,
      finalAmount: order.finalAmount,
      shippingAddress: order.shippingAddress,
      createdAt: order.createdAt,
    })
  } catch (err) {
    console.error("[Socket] Failed to emit NEW_ORDER:", err)
  }
}

const notifyCustomer = (userId: string, payload: object): void => {
  try {
    getIO().to(String(userId)).emit("ORDER_STATUS_UPDATED", payload)
  } catch (_) {}
}

/**
 * Converts a live cart item into an order item.
 * Re-prices everything fresh from the DB — never trusts cart-cached prices.
 */
const resolveOrderItem = async (
  cartItem: any,
  isWholesale: boolean,
  userId: string
): Promise<IOrderItem> => {
  // ── Catalog product ──────────────────────────────────────────────
  if (cartItem.itemType === "product") {
    const card = await Card.findById(cartItem.productId)
    if (!card) {
      throw new ApiError(404, `Product "${cartItem.name}" is no longer available`)
    }

    const eligible = isWholesale && card.isAvailableForWholesale
    const unitPrice = eligible ? card.wholesalePrice : card.price
    const discountPerUnit = eligible
      ? card.wholesaleDiscount ?? 0
      : card.discount ?? 0
    const totalPrice = (unitPrice - discountPerUnit) * cartItem.quantity

    return {
      itemType: "product",
      productId: card._id as mongoose.Types.ObjectId,
      name: card.name,
      category: Array.isArray(card.categories) ? card.categories[0] : "product",
      previewImage: card.images?.primaryImage ?? "",
      quantity: cartItem.quantity,
      unitPrice,
      discountPerUnit,
      totalPrice,
      specifications: cartItem.specifications ?? null,
      isWholesale: eligible,
    }
  }

  // ── Custom design ────────────────────────────────────────────────
  const design = await Design.findById(cartItem.designId).populate("templateId")
  if (!design) {
    throw new ApiError(404, `Design "${cartItem.name}" no longer exists`)
  }
  if (String(design.userId) !== String(userId)) {
    throw new ApiError(403, "You do not own this design")
  }

  const template = design.templateId as any
  const unitPrice = template?.unitPrice ?? 0

  return {
    itemType: "design",
    designId: design._id as mongoose.Types.ObjectId,
    templateId: template?._id ?? null,
    // Snapshot the canvas at order time so edits never affect production
    canvasJSONSnapshot: design.canvasJSON as Record<string, unknown>,
    name: design.name,
    category: template?.category ?? "custom",
    previewImage: design.previewImage ?? "",
    quantity: cartItem.quantity,
    unitPrice,
    discountPerUnit: 0,
    totalPrice: unitPrice * cartItem.quantity,
    specifications: cartItem.specifications ?? null,
    isWholesale: false,
  }
}

/* ================================================================== */
/*  CREATE ORDER FROM CART                                             */
/*  POST /api/v1/orders                                                */
/* ================================================================== */

export const createOrder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const user = req.user
    const {
      paymentMethod,
      shippingAddress,
    }: {
      paymentMethod: PaymentMethod
      shippingAddress: {
        lat?: number
        lng?: number
        line1: string
        line2?: string
        city: string
        state: string
        pincode: string
      }
    } = req.body

    if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.pincode) {
      throw new ApiError(400, "shippingAddress with line1, city, and pincode is required")
    }

    // ── 1. Validate cart ─────────────────────────────────────────────
    const cart = await Cart.findOne({ user: user._id })
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cart is empty")
    }

    // ── 2. Warehouse lookup ──────────────────────────────────────────
    const { lat, lng } = shippingAddress

    if (!lat || !lng) {
      throw new ApiError(
        400,
        "shippingAddress must include lat and lng for delivery routing"
      )
    }

    const nearestWarehouse = await findNearestWarehouse(lat, lng)
    if (!nearestWarehouse) {
      throw new ApiError(
        400,
        "No active warehouse services your delivery area. Please try again later."
      )
    }

    // ── 3. Re-price all items fresh from DB ──────────────────────────
    const isWholesale = user.wholesalerStatus === "approved"

    const resolvedItems = await Promise.all(
      cart.items.map((item:any) =>
        resolveOrderItem(item, isWholesale, String(user._id))
      )
    )

    // ── 4. Compute totals ────────────────────────────────────────────
    const subtotal = resolvedItems.reduce((sum, i) => sum + i.totalPrice, 0)
    const discount = resolvedItems.reduce(
      (sum, i) => sum + i.discountPerUnit * i.quantity,
      0
    )
    const taxableAmount = Math.max(subtotal - discount, 0)

    const freeShippingThreshold = isWholesale
      ? WHOLESALE_FREE_SHIPPING_THRESHOLD
      : RETAIL_FREE_SHIPPING_THRESHOLD

    const shippingFee = taxableAmount >= freeShippingThreshold ? 0 : SHIPPING_FEE
    const tax = Number((taxableAmount * GST_RATE).toFixed(2))
    const finalAmount = Number((taxableAmount + shippingFee + tax).toFixed(2))

    // ── 5. Create order ──────────────────────────────────────────────
    const order: IOrder = await Order.create({
      orderId: uuidv4(),
      user: user._id,
      items: resolvedItems,
      subtotal,
      discount,
      tax,
      shippingFee,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "online" ? "unpaid" : "unpaid", // Razorpay flow sets to "paid" after verification
      shippingAddress,
      status: "pending",
      statusHistory: [{ status: "pending", date: new Date(), updatedBy: "system" }],
      warehouse: nearestWarehouse._id,
      rejectedByWarehouses: [],
    })

    // ── 6. Clear cart after order is placed ─────────────────────────
    cart.items = []
    await cart.save()

    // ── 7. Notify warehouse via socket ───────────────────────────────
    dispatchToWarehouse(String(nearestWarehouse._id), order)

    return res.status(201).json(
      new ApiResponse(201, order, "Order placed successfully")
    )
  }
)

/* ================================================================== */
/*  CREATE RAZORPAY ORDER  (stub — wire in when Razorpay is added)    */
/*  POST /api/v1/orders/:orderId/razorpay/create                       */
/* ================================================================== */

export const createRazorpayOrder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { orderId } = req.params

    const order = await Order.findOne({ orderId, user: req.user._id })

    if (!order) throw new ApiError(404, "Order not found")

    if (order.paymentMethod !== "online") {
      throw new ApiError(400, "This order is not an online payment order")
    }

    if (order.paymentStatus === "paid") {
      throw new ApiError(400, "Order already paid")
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.finalAmount * 100),
      currency: "INR",
      receipt: order.orderId,
    })

    order.razorpay = {
      orderId: razorpayOrder.id,
    }

    await order.save()

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
        },
        "Razorpay order created"
      )
    )
  }
)

/* ================================================================== */
/*  VERIFY RAZORPAY PAYMENT  (stub)                                    */
/*  POST /api/v1/orders/:orderId/razorpay/verify                       */
/* ================================================================== */

export const verifyRazorpayPayment = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { orderId } = req.params

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body

    const order = await Order.findOne({ orderId, user: req.user._id })

    if (!order) throw new ApiError(404, "Order not found")

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex")

    if (expectedSignature !== razorpay_signature) {
      throw new ApiError(400, "Invalid payment signature")
    }

    order.paymentStatus = "paid"

    order.razorpay = {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    }

    order.statusHistory.push({
      status: order.status,
      date: new Date(),
      note: "Payment verified",
      updatedBy: "system",
    })

    await order.save()

    notifyCustomer(String(order.user), {
      orderId: order.orderId,
      event: "payment_verified",
    })

    dispatchToWarehouse(String(order.warehouse), order)

    return res
      .status(200)
      .json(new ApiResponse(200, order, "Payment verified successfully"))
  }
)

/* ================================================================== */
/*  GET USER ORDERS                                                    */
/*  GET /api/v1/orders                                                 */
/* ================================================================== */

export const getUserOrders = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { status, page = "1", limit = "10" } = req.query as {
      status?: string
      page?: string
      limit?: string
    }

    const filter: Record<string, unknown> = { user: req.user._id }
    if (status) filter.status = status

    const pageNum = Math.max(parseInt(page, 10), 1)
    const limitNum = Math.min(parseInt(limit, 10), 50)
    const skip = (pageNum - 1) * limitNum

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("warehouse", "name city"),
      Order.countDocuments(filter),
    ])

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orders,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
        "Orders fetched successfully"
      )
    )
  }
)

/* ================================================================== */
/*  GET SINGLE ORDER                                                   */
/*  GET /api/v1/orders/:orderId                                        */
/* ================================================================== */

export const getOrder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { orderId } = req.params

    const order = await Order.findOne({ orderId, user: req.user._id })
      .populate("warehouse", "name city address contactPhone")
      .populate("items.productId", "name price images.primaryImage")
      .populate("items.designId", "name previewImage")
      .populate("items.templateId", "name category")

    if (!order) throw new ApiError(404, "Order not found")

    return res.status(200).json(
      new ApiResponse(200, order, "Order fetched successfully")
    )
  }
)

/* ================================================================== */
/*  CANCEL ORDER                                                       */
/*  PUT /api/v1/orders/:orderId/cancel                                 */
/* ================================================================== */

export const cancelOrder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    if (!req.user) throw new ApiError(401, "Unauthorized")

    const { orderId } = req.params

    const order = await Order.findOne({ orderId, user: req.user._id })
    if (!order) throw new ApiError(404, "Order not found or unauthorized")

    if (!["pending", "accepted"].includes(order.status)) {
      throw new ApiError(
        400,
        `Cannot cancel an order with status "${order.status}"`
      )
    }

    order.status = "cancelled"
    order.statusHistory.push({
      status: "cancelled",
      date: new Date(),
      note: "Cancelled by customer",
      updatedBy: String(req.user._id),
    })
    await order.save()

    // Notify warehouse to remove it from their queue
    if (order.warehouse) {
      try {
        getIO().to(String(order.warehouse)).emit("ORDER_CANCELLED", {
          orderId: order.orderId,
          _id: order._id,
        })
      } catch (_) {}
    }

    // TODO: initiate refund if paymentStatus === "paid"

    return res.status(200).json(
      new ApiResponse(200, order, "Order cancelled successfully")
    )
  }
)

/* ================================================================== */
/*  UPDATE ORDER STATUS  (admin / warehouse)                           */
/*  PUT /api/v1/orders/:orderId/status                                 */
/* ================================================================== */

export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { orderId } = req.params
    const {
      status,
      note,
    }: { status: OrderStatus; note?: string } = req.body

    const order = await Order.findOne({ orderId })
    if (!order) throw new ApiError(404, "Order not found")

    const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
      pending: ["accepted", "rejected", "cancelled"],
      accepted: ["processing", "cancelled"],
      rejected: [],
      processing: ["shipped"],
      shipped: ["delivered"],
      delivered: [],
      cancelled: [],
    }

 if (!order) {
  throw new ApiError(404, "Order not found")
}

const currentStatus = order.status as OrderStatus

if (!VALID_TRANSITIONS[currentStatus].includes(status)) {
  throw new ApiError(
    400,
    `Cannot transition from "${currentStatus}" to "${status}"`
  )
}

    order.status = status
    order.statusHistory.push({
      status,
      date: new Date(),
      note,
      updatedBy: "admin",
    })
    await order.save()

    notifyCustomer(String(order.user), {
      orderId: order.orderId,
      status,
      note,
      message: `Your order status has been updated to: ${status}`,
    })

    return res.status(200).json(
      new ApiResponse(200, order, "Order status updated")
    )
  }
)