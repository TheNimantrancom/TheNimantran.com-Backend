import { Request, Response } from "express"
import asyncHandler from "../../utils/asyncHandler.js"
import Order from "../../models/order.model.js"
import ApiResponse from "../../utils/apiResponse.js"
import ApiError from "../../utils/apiError.js"

interface UpdatePaymentBody {
  paymentStatus: string
  transactionId?: string
}

interface TrackingBody {
  deliveryPartner: string
  trackingId: string
}

interface UpdateStatusBody {
  status: string
}

export const getAllOrders = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const orders = await Order.find()
      .populate("user", "name email phone")
      .populate("items.cardId", "name price")
      .sort({ createdAt: -1 })

    res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders fetched successfully"))
  }
)

export const updatePaymentStatus = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params
    const { paymentStatus, transactionId } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    order.paymentStatus = paymentStatus

    if (transactionId) {
      order.transactionId = transactionId
    }

    await order.save()

    res
      .status(200)
      .json(new ApiResponse(200, order, "Payment status updated successfully"))
  }
)

export const addTrackingInfo = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params
    const { deliveryPartner, trackingId } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    order.deliveryPartner = deliveryPartner
    order.trackingId = trackingId

    await order.save()

    res
      .status(200)
      .json(new ApiResponse(200, order, "Tracking information added successfully"))
  }
)

export const deleteOrder = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params

    const order = await Order.findByIdAndDelete(id)

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Order deleted successfully"))
  }
)

export const updateOrderStatus = asyncHandler(
  async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { id } = req.params
    const { status } = req.body

    const order = await Order.findById(id)

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    order.status = status
    order.statusHistory.push({
      status,
      date: new Date()
    })

    await order.save()

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order status updated successfully"))
  }
)

export const getOrderById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params

    const order = await Order.findById(id)
      .populate("user", "name email phone")
      .populate("items.card", "title price")

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order fetched successfully"))
  }
)