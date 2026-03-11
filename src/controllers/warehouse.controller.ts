import { Request, Response } from "express"
import asyncHandler from "../utils/asyncHandler.js"
import ApiError from "../utils/apiError.js"
import ApiResponse from "../utils/apiResponse.js"
import { Order } from "../models/order.model.js"
import { findNearestWarehouses } from "../services/warhouse.service.js"
import mongoose from "mongoose"
import { getIO } from "../index.js"

type NotifyPayload = {
  orderId: string
  status: string
  message: string
}

const notifyCustomer = (userId: string, payload: NotifyPayload): void => {
  try {
    const io = getIO()
    io.to(userId).emit("ORDER_STATUS_UPDATED", payload)
  } catch (err) {
    console.error("[Socket] Failed to notify customer:", err)
  }
}

const emitNewOrderToWarehouse = (warehouseId: string, payload: object): void => {
  try {
    const io = getIO()
    io.to(warehouseId).emit("NEW_ORDER", payload)
  } catch (err) {
    console.error("[Socket] Failed to notify warehouse:", err)
  }
}

export const acceptOrder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { orderId } = req.params

    const order = await Order.findOne({ orderId })

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    if (order.status !== "pending") {
      throw new ApiError(
        400,
        `Cannot accept an order that is already "${order.status}"`
      )
    }

    order.status = "accepted"

    order.statusHistory.push({
      status: "accepted",
      date: new Date(),
      note: "Order accepted by warehouse"
    })

    await order.save()

    notifyCustomer(String(order.user), {
      orderId: order.orderId,
      status: "accepted",
      message: "Your order has been accepted and will be processed shortly."
    })

    return res.status(200).json(
      new ApiResponse(200, order, "Order accepted successfully")
    )
  }
)

export const rejectOrder = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { orderId } = req.params
    const { reason }: { reason?: string } = req.body

    const order = await Order.findOne({ orderId })

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    if (order.status !== "pending") {
      throw new ApiError(
        400,
        `Cannot reject an order that is already "${order.status}"`
      )
    }

    if (!order.rejectedByWarehouses) {
      order.rejectedByWarehouses = []
    }

    if (order.warehouse) {
      order.rejectedByWarehouses.push(
        order.warehouse as mongoose.Types.ObjectId
      )
    }

    const shippingAddress = order.shippingAddress as {
      lat?: number
      lng?: number
    }

    const lat = shippingAddress?.lat
    const lng = shippingAddress?.lng

    if (lat !== undefined && lng !== undefined) {
      const candidates = await findNearestWarehouses(lat, lng, 5)

      const rejectedIds = order.rejectedByWarehouses.map((id: any) =>
        String(id)
      )

      const fallback = candidates.find(
        (c) =>
          c.withinRadius &&
          !rejectedIds.includes(String(c.warehouse._id))
      )

      if (fallback) {
        order.warehouse = fallback.warehouse._id
        order.status = "pending"

        order.statusHistory.push({
          status: "pending",
          date: new Date(),
          note: `Re-dispatched to warehouse: ${fallback.warehouse.name}`
        })

        await order.save()

        emitNewOrderToWarehouse(String(fallback.warehouse._id), {
          orderId: order.orderId,
          _id: order._id,
          items: order.items,
          finalAmount: order.finalAmount,
          shippingAddress: order.shippingAddress,
          createdAt: order.createdAt
        })

        notifyCustomer(String(order.user), {
          orderId: order.orderId,
          status: "pending",
          message: "Your order is being re-assigned to another warehouse."
        })

        return res.status(200).json(
          new ApiResponse(
            200,
            order,
            "Order rejected and re-dispatched to the next available warehouse"
          )
        )
      }
    }

    order.status = "rejected"

    order.statusHistory.push({
      status: "rejected",
      date: new Date(),
      note: reason ?? "No warehouse available to fulfil this order"
    })

    await order.save()

    notifyCustomer(String(order.user), {
      orderId: order.orderId,
      status: "rejected",
      message:
        "We're sorry — your order could not be fulfilled at this time. A refund will be initiated if payment was made."
    })

    return res.status(200).json(
      new ApiResponse(
        200,
        order,
        "Order rejected — no fallback warehouse available"
      )
    )
  }
)

export const getWarehouseOrders = asyncHandler(
  async (req: Request, res: Response): Promise<Response> => {
    const { warehouseId } = req.params

    if (!warehouseId) {
      throw new ApiError(400, "Warehouse ID is required")
    }

    const { status, page = "1", limit = "20" } = req.query as {
      status?: string
      page?: string
      limit?: string
    }

    const filter: Record<string, unknown> = {
      warehouse: new mongoose.Types.ObjectId(warehouseId as any)
    }

    if (status) {
      filter.status = status
    }

    const pageNum = Math.max(parseInt(page, 10), 1)
    const limitNum = Math.min(parseInt(limit, 10), 100)

    const skip = (pageNum - 1) * limitNum

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("user", "name email phone"),

      Order.countDocuments(filter)
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
            pages: Math.ceil(total / limitNum)
          }
        },
        "Warehouse orders fetched successfully"
      )
    )
  }
)