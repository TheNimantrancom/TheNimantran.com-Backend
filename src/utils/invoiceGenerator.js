import PDFDocument from "pdfkit";
import QRCode from "qrcode";

// Color palette for the invoice
const COLORS = {
  primary: "#2c3e50",
  secondary: "#3498db",
  accent: "#e74c3c",
  success: "#27ae60",
  lightGray: "#f5f5f5",
  darkGray: "#7f8c8d",
  white: "#ffffff"
};

// Helper function to format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return `₹${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Generate QR code for order details
const generateQRCode = async (order) => {
  try {
    const qrData = JSON.stringify({
      orderId: order.orderId,
      amount: order.finalAmount,
      date: order.createdAt
    });
    return await QRCode.toDataURL(qrData, { width: 100, margin: 1 });
  } catch (error) {
    console.error('QR Code generation failed:', error);
    return null;
  }
};

// Add header to document
const addHeader = (doc) => {
  // Company logo and name section
  doc.fillColor(COLORS.primary)
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('TheNimantran.com', 50, 40);
  
  doc.fillColor(COLORS.darkGray)
     .fontSize(10)
     .font('Helvetica')
     .text('Premium Invitation Cards & Stationery', 50, 70);
  
  // Add decorative line
  doc.moveTo(50, 85)
     .lineTo(550, 85)
     .lineWidth(2)
     .strokeColor(COLORS.secondary)
     .stroke();
  
  doc.moveDown(2);
};

// Add footer to document
const addFooter = (doc, pageHeight) => {
  const footerY = pageHeight - 50;
  
  doc.fillColor(COLORS.darkGray)
     .fontSize(8)
     .font('Helvetica')
     .text('Thank you for choosing TheNimantran.com', 50, footerY, {
       align: 'center',
       width: 500
     })
     .text('For any queries, contact: support@thenimantran.com | +91-XXXXXXXXXX', 50, footerY + 15, {
       align: 'center',
       width: 500
     })
     .text('GST No: XXAAAAA0000A1Z5 | PAN No: AAAAA0000A', 50, footerY + 30, {
       align: 'center',
       width: 500
     });
  
  // Add page number if needed
  const pageNumber = doc.bufferedPageRange().count;
  doc.text(`Page ${pageNumber}`, 50, footerY + 45, { align: 'center', width: 500 });
};

// Add customer information section
const addCustomerInfo = (doc, order) => {
  const startY = doc.y;
  
  // Bill To section
  doc.fillColor(COLORS.primary)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Bill To:', 50, startY)
     .fillColor(COLORS.darkGray)
     .fontSize(10)
     .font('Helvetica')
     .text(order.shippingAddress?.name || 'N/A', 50, startY + 20)
     .text(order.shippingAddress?.addressLine1 || order.shippingAddress?.roadAreaColony || 'N/A', 50, startY + 35)
     .text(`${order.shippingAddress?.city || ''}${order.shippingAddress?.city && order.shippingAddress?.state ? ', ' : ''}${order.shippingAddress?.state || ''}`, 50, startY + 50)
     .text(`Pincode: ${order.shippingAddress?.pincode || 'N/A'}`, 50, startY + 65)
     .text(`Phone: ${order.shippingAddress?.phone || 'N/A'}`, 50, startY + 80);
  
  // Order Details section
  const orderDetailsX = 300;
  doc.fillColor(COLORS.primary)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Order Details:', orderDetailsX, startY)
     .fillColor(COLORS.darkGray)
     .fontSize(10)
     .font('Helvetica')
     .text(`Order ID: ${order.orderId}`, orderDetailsX, startY + 20)
     .text(`Order Date: ${formatDate(order.createdAt)}`, orderDetailsX, startY + 35)
     .text(`Payment Method: ${order.paymentMethod}`, orderDetailsX, startY + 50)
     .text(`Payment Status: ${order.paymentStatus}`, orderDetailsX, startY + 65)
     .text(`Order Status: ${order.status}`, orderDetailsX, startY + 80);
  
  doc.moveDown(5);
};

// Add order items table
const addOrderItems = (doc, order) => {
  const tableTop = doc.y + 10;
  
  // Table header
  doc.fillColor(COLORS.white)
     .rect(50, tableTop, 500, 25)
     .fill(COLORS.primary);
  
  const headers = ['#', 'Item', 'Type', 'Packs', 'Price/Pack', 'Total'];
  const columnWidths = [30, 180, 80, 60, 80, 70];
  let currentX = 50;
  
  headers.forEach((header, index) => {
    doc.fillColor(COLORS.white)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(header, currentX + 5, tableTop + 7, {
         width: columnWidths[index],
         align: index === 0 ? 'center' : 'left'
       });
    currentX += columnWidths[index];
  });
  
  // Table rows
  let currentY = tableTop + 25;
  
  order.items?.forEach((item, index) => {
    if (!item) return;
    
    // Alternate row colors
    const rowColor = index % 2 === 0 ? COLORS.white : COLORS.lightGray;
    
    doc.fillColor(rowColor)
       .rect(50, currentY, 500, 30)
       .fill();
    
    const rowX = 50;
    
    // Serial number
    doc.fillColor(COLORS.darkGray)
       .fontSize(9)
       .text(index + 1, rowX + 15, currentY + 10, { width: 30, align: 'center' });
    
    // Item name
    doc.text(item.name || 'N/A', rowX + 30, currentY + 10, { width: 180 });
    
    // Type
    doc.text(item.isWholesale ? 'Wholesale' : 'Retail', rowX + 210, currentY + 10, { width: 80 });
    
    // Packs
    doc.text(item.packs?.toString() || '0', rowX + 290, currentY + 10, { width: 60, align: 'center' });
    
    // Price per pack
    doc.text(formatCurrency(item.pricePerPack || 0), rowX + 350, currentY + 10, { width: 80, align: 'right' });
    
    // Total
    doc.text(formatCurrency(item.totalPrice || 0), rowX + 430, currentY + 10, { width: 70, align: 'right' });
    
    currentY += 30;
  });
  
  doc.y = currentY + 10;
};

// Add summary section
const addSummary = (doc, order) => {
  const summaryTop = doc.y + 10;
  const summaryWidth = 200;
  const summaryX = 550 - summaryWidth;
  
  // Summary box
  doc.fillColor(COLORS.lightGray)
     .rect(summaryX - 10, summaryTop - 10, summaryWidth + 20, 180)
     .fill();
  
  doc.fillColor(COLORS.primary)
     .fontSize(14)
     .font('Helvetica-Bold')
     .text('Order Summary', summaryX, summaryTop, { width: summaryWidth, align: 'center' });
  
  const lineHeight = 25;
  let currentY = summaryTop + 30;
  
  // Subtotal
  doc.fillColor(COLORS.darkGray)
     .fontSize(10)
     .font('Helvetica')
     .text('Subtotal:', summaryX, currentY, { width: summaryWidth - 80 })
     .text(formatCurrency(order.totalAmount || 0), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  
  // Discount
  if (order.discount > 0) {
    currentY += lineHeight;
    doc.text('Discount:', summaryX, currentY, { width: summaryWidth - 80 })
       .text(`-${formatCurrency(order.discount || 0)}`, summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  }
  
  // Tax
  if (order.tax > 0) {
    currentY += lineHeight;
    doc.text('Tax (GST):', summaryX, currentY, { width: summaryWidth - 80 })
       .text(formatCurrency(order.tax || 0), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  }
  
  // Shipping
  currentY += lineHeight;
  doc.text('Shipping Fee:', summaryX, currentY, { width: summaryWidth - 80 })
     .text(formatCurrency(order.shippingFee || 0), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  
  // Divider
  currentY += lineHeight + 5;
  doc.moveTo(summaryX, currentY)
     .lineTo(summaryX + summaryWidth, currentY)
     .lineWidth(0.5)
     .strokeColor(COLORS.darkGray)
     .stroke();
  
  // Final Amount
  currentY += 10;
  doc.fillColor(COLORS.primary)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Total Amount:', summaryX, currentY, { width: summaryWidth - 80 })
     .text(formatCurrency(order.finalAmount || 0), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  
  doc.moveDown(4);
};

// Add terms and conditions
const addTermsAndConditions = (doc) => {
  doc.fillColor(COLORS.primary)
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('Terms & Conditions:', 50, doc.y)
     .fillColor(COLORS.darkGray)
     .fontSize(9)
     .font('Helvetica')
     .text('1. This is a computer-generated invoice and does not require a signature.', 50, doc.y + 15, { width: 500 })
     .text('2. Goods once sold will not be taken back or exchanged.', 50, doc.y + 30, { width: 500 })
     .text('3. All disputes are subject to the jurisdiction of Kolkata courts.', 50, doc.y + 45, { width: 500 })
     .text('4. Delivery timelines are approximate and may vary based on customization requirements.', 50, doc.y + 60, { width: 500 });
  
  doc.moveDown(4);
};

// Main invoice generation function
export const generateInvoice = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create document with margins
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });
      
      // Collect PDF chunks
      const chunks = [];
      
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      // Add company header
      addHeader(doc);
      
      // Invoice title
      doc.fillColor(COLORS.accent)
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('INVOICE', 50, 100, { align: 'center', width: 500 });
      
      doc.moveDown(2);
      
      // Add customer and order info
      addCustomerInfo(doc, order);
      
      // Add horizontal line separator
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .lineWidth(1)
         .strokeColor(COLORS.darkGray)
         .stroke();
      
      doc.moveDown(2);
      
      // Add order items table
      addOrderItems(doc, order);
      
      // Add summary
      addSummary(doc, order);
      
      // Add terms and conditions
      addTermsAndConditions(doc);
      
      // Generate and add QR code
      try {
        const qrCode = await generateQRCode(order);
        if (qrCode) {
          doc.image(qrCode, 50, doc.y - 50, { width: 80, height: 80 });
        }
      } catch (qrError) {
        console.error('Failed to add QR code:', qrError);
        // Continue without QR code
      }
      
      // Add footer on each page
      const pageHeight = doc.page.height;
      const pageRange = doc.bufferedPageRange();
      
      for (let i = 0; i < pageRange.count; i++) {
        doc.switchToPage(i);
        addFooter(doc, pageHeight);
      }
      
      // Finalize PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};