import { Request, Response } from "express"
import Order, { IOrder } from "../models/order.model.js"
import ApiError from "../utils/apiError.js"
import asyncHandler from "../utils/asyncHandler.js"
import { generateInvoice } from "../utils/invoiceGenerator.js"



export const downloadInvoice = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ApiError(401, "User not authenticated")
    }

    const userId = req.user._id
    const { orderId } = req.params

    if (!orderId) {
      throw new ApiError(400, "Order ID is required")
    }

      
    const order: IOrder | null =
      await Order.findOne({
        orderId: orderId,
        user: userId,
      })
        .populate("user", "name email phone")
        .lean()

    if (!order) {
      throw new ApiError(404, "Order not found")
    }

    const invoiceBuffer: Buffer =
      await generateInvoice(order)

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${order.orderId}.pdf"`
    )
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader(
      "Content-Length",
      invoiceBuffer.length
    )

    res.send(invoiceBuffer)
  }
)