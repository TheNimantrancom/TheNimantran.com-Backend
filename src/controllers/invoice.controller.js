import PDFDocument from "pdfkit";
import Order from "../models/order.model.js";
import ApiError  from "../utils/apiError.js";
import  asyncHandler  from "../utils/asyncHandler.js";

export const downloadInvoice = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId } = req.params;

  const order = await Order.findOne({
    orderId,
    user: userId,
  }).lean();

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const doc = new PDFDocument({ margin: 40 });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Invoice-${order.orderId}.pdf`
  );
  res.setHeader("Content-Type", "application/pdf");

  doc.pipe(res);

  doc.fontSize(20).text("INVOICE", { align: "center" });
  doc.moveDown();

  doc.fontSize(10);
  doc.text(`Order ID: ${order.orderId}`);
  doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString()}`);
  doc.text(`Payment Method: ${order.paymentMethod}`);
  doc.moveDown();

  doc.text("Shipping Address:");
  doc.text(`${order.shippingAddress.name}`);
  doc.text(`${order.shippingAddress.addressLine1}`);
  doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state}`);
  doc.text(`${order.shippingAddress.pincode}`);
  doc.moveDown();

  doc.fontSize(12).text("Order Items", { underline: true });
  doc.moveDown(0.5);

  order.items.forEach((item, index) => {
    doc.fontSize(10).text(`${index + 1}. ${item.name}`);
    doc.text(`   Packs: ${item.packs}`);
    doc.text(`   Cards per Pack: ${item.packSize}`);
    doc.text(`   Price per Pack: ₹${item.pricePerPack}`);
    doc.text(`   Discount per Pack: ₹${item.discountPerPack}`);
    doc.text(`   Item Total: ₹${item.totalPrice}`);
    doc.text(
      `   Type: ${item.isWholesale ? "Wholesale" : "Retail"}`
    );
    doc.moveDown(0.5);
  });

  doc.moveDown();
  doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  doc.fontSize(11);
  doc.text(`Subtotal: ₹${order.totalAmount}`);
  doc.text(`Discount: -₹${order.discount}`);
  doc.text(`Shipping: ₹${order.shippingFee}`);
  doc.text(`Tax: ₹${order.tax}`);
  doc.moveDown();

  doc.fontSize(13).text(`Final Amount: ₹${order.finalAmount}`, {
    bold: true,
  });

  doc.moveDown(2);
  doc.fontSize(10).text(
    "Thank you for shopping with us!",
    { align: "center" }
  );

  doc.end();
});
