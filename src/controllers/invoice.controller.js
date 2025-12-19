import Order from "../models/order.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateInvoice } from "../utils/invoiceGenerator.js";

export const downloadInvoice = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId) {
      throw new ApiError(401, "User not authenticated");
    }

    if (!orderId) {
      throw new ApiError(400, "Order ID is required");
    }

    // Fetch order with proper validation
    const order = await Order.findOne({
      orderId: orderId.trim(),
      user: userId
    })
    .populate('user', 'name email phone') // Optional: populate user details
    .lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Log order data for debugging
    console.log('Order data for invoice:', {
      orderId: order.orderId,
      hasShippingAddress: !!order.shippingAddress,
      shippingAddress: order.shippingAddress,
      itemsCount: order.items?.length,
      totalAmount: order.totalAmount
    });

    // Generate invoice
    const invoiceBuffer = await generateInvoice(order);

    // Set response headers
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${order.orderId}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", invoiceBuffer.length);

    // Send PDF
    res.send(invoiceBuffer);

  } catch (error) {
    console.error("Invoice download error:", error);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to generate invoice')) {
      throw new ApiError(500, "Failed to generate invoice. Please try again.");
    }
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(500, "An unexpected error occurred while generating invoice");
  }
});