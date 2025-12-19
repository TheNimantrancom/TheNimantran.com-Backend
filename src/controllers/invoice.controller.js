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

    // Fetch order with validation
    const order = await Order.findOne({
      orderId: orderId.trim(),
      user: userId
    }).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Validate required order data
    const requiredFields = ['orderId', 'items', 'totalAmount', 'finalAmount'];
    for (const field of requiredFields) {
      if (!order[field]) {
        throw new ApiError(400, `Invalid order data: Missing ${field}`);
      }
    }

    // Validate shipping address
    if (!order.shippingAddress || !order.shippingAddress.name) {
      throw new ApiError(400, "Invalid shipping address in order");
    }

    // Validate items array
    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new ApiError(400, "No items found in order");
    }

    // Generate invoice
    const invoiceBuffer = await generateInvoice(order);

    // Set response headers
    res.setHeader("Content-Disposition", `attachment; filename="Invoice-${order.orderId}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", invoiceBuffer.length);

    // Send PDF
    res.send(invoiceBuffer);

  } catch (error) {
    // Log the error for debugging
    console.error("Invoice generation error:", error);

    // Handle specific errors
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle PDF generation errors
    if (error.message?.includes("PDF")) {
      throw new ApiError(500, "Failed to generate invoice PDF");
    }

    // Handle unexpected errors
    throw new ApiError(500, "An unexpected error occurred while generating invoice");
  }
});

// Optional: Add a preview endpoint
export const previewInvoice = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const { orderId } = req.params;

    if (!userId || !orderId) {
      throw new ApiError(400, "Invalid request");
    }

    const order = await Order.findOne({
      orderId: orderId.trim(),
      user: userId
    }).lean();

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const invoiceBuffer = await generateInvoice(order);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${order.orderId}.pdf"`);
    res.send(invoiceBuffer);

  } catch (error) {
    console.error("Invoice preview error:", error);
    throw error;
  }
});