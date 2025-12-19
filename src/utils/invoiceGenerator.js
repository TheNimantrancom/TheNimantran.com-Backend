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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Helper function to format currency
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0.00';
  return `₹${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

// Safe getter function to handle undefined values
const safeGet = (obj, path, defaultValue = 'N/A') => {
  if (!obj) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined && result !== null ? result : defaultValue;
};

// Generate QR code for order details
const generateQRCode = async (order) => {
  try {
    const qrData = JSON.stringify({
      orderId: safeGet(order, 'orderId', ''),
      amount: safeGet(order, 'finalAmount', 0),
      date: safeGet(order, 'createdAt', new Date())
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
  
  // Company details
  doc.fontSize(9)
     .text('GST No: XXAAAAA0000A1Z5 | PAN No: AAAAA0000A', 50, 85)
     .text('Email: support@thenimantran.com | Phone: +91-XXXXXXXXXX', 50, 97);
  
  // Add decorative line
  doc.moveTo(50, 110)
     .lineTo(550, 110)
     .lineWidth(2)
     .strokeColor(COLORS.secondary)
     .stroke();
  
  doc.y = 120;
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
     .text('This is a computer-generated invoice. No signature required.', 50, footerY + 15, {
       align: 'center',
       width: 500
     });
  
  // Add page number if needed
  const pageNumber = doc.bufferedPageRange().count;
  doc.text(`Page ${pageNumber}`, 50, footerY + 30, { align: 'center', width: 500 });
};

// Add customer information section - Updated with actual field names
const addCustomerInfo = (doc, order) => {
  const startY = doc.y;
  
  // Bill To section
  doc.fillColor(COLORS.primary)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Bill To / Shipping Address:', 50, startY)
     .fillColor(COLORS.darkGray)
     .fontSize(10)
     .font('Helvetica');
  
  const shippingAddress = safeGet(order, 'shippingAddress', {});
  
  // Using actual field names from your Order model
  doc.text(safeGet(shippingAddress, 'name', 'Customer'), 50, startY + 20);
  doc.text(safeGet(shippingAddress, 'roadAreaColony', ''), 50, startY + 35);
  
  // Build city/state line
  const city = safeGet(shippingAddress, 'city', '');
  const state = safeGet(shippingAddress, 'state', '');
  const cityStateLine = `${city}${city && state ? ', ' : ''}${state}`;
  if (cityStateLine) {
    doc.text(cityStateLine, 50, startY + 50);
  }
  
  const pincode = safeGet(shippingAddress, 'pincode', '');
  if (pincode) {
    doc.text(`Pincode: ${pincode}`, 50, startY + (cityStateLine ? 65 : 50));
  }
  
  const phone = safeGet(shippingAddress, 'phone', '');
  if (phone) {
    doc.text(`Phone: ${phone}`, 50, startY + (pincode ? (cityStateLine ? 80 : 65) : (cityStateLine ? 65 : 50)));
  }
  
  // Order Details section
  const orderDetailsX = 300;
  doc.fillColor(COLORS.primary)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('Order Details:', orderDetailsX, startY)
     .fillColor(COLORS.darkGray)
     .fontSize(10)
     .font('Helvetica')
     .text(`Order ID: ${safeGet(order, 'orderId', 'N/A')}`, orderDetailsX, startY + 20)
     .text(`Order Date: ${formatDate(safeGet(order, 'createdAt', new Date()))}`, orderDetailsX, startY + 35)
     .text(`Payment Method: ${safeGet(order, 'paymentMethod', 'N/A')}`, orderDetailsX, startY + 50)
     .text(`Payment Status: ${safeGet(order, 'paymentStatus', 'N/A')}`, orderDetailsX, startY + 65)
     .text(`Order Status: ${safeGet(order, 'status', 'N/A')}`, orderDetailsX, startY + 80);
  
  // Adjust doc.y based on content height
  const billToHeight = phone ? 100 : (pincode ? 85 : (cityStateLine ? 70 : 55));
  doc.y = Math.max(startY + billToHeight, startY + 100) + 20;
};

// Add order items table
const addOrderItems = (doc, order) => {
  const tableTop = doc.y + 10;
  
  // Table header
  doc.fillColor(COLORS.white)
     .rect(50, tableTop, 500, 25)
     .fill(COLORS.primary);
  
  const headers = ['#', 'Item', 'Type', 'Packs', 'Cards/Pack', 'Price', 'Total'];
  const columnWidths = [30, 140, 70, 50, 70, 70, 70];
  let currentX = 50;
  
  headers.forEach((header, index) => {
    doc.fillColor(COLORS.white)
       .fontSize(10)
       .font('Helvetica-Bold')
       .text(header, currentX + 5, tableTop + 7, {
         width: columnWidths[index],
         align: index === 0 ? 'center' : (index >= 4 ? 'right' : 'left')
       });
    currentX += columnWidths[index];
  });
  
  // Table rows
  let currentY = tableTop + 25;
  const items = safeGet(order, 'items', []);
  
  items.forEach((item, index) => {
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
    doc.text(safeGet(item, 'name', 'N/A'), rowX + 30, currentY + 10, { width: 140 });
    
    // Type
    const isWholesale = safeGet(item, 'isWholesale', false);
    doc.text(isWholesale ? 'Wholesale' : 'Retail', rowX + 170, currentY + 10, { width: 70 });
    
    // Packs
    doc.text(safeGet(item, 'packs', 0).toString(), rowX + 240, currentY + 10, { width: 50, align: 'right' });
    
    // Cards per Pack (packSize)
    doc.text(safeGet(item, 'packSize', 0).toString(), rowX + 290, currentY + 10, { width: 70, align: 'right' });
    
    // Price per Pack
    doc.text(formatCurrency(safeGet(item, 'pricePerPack', 0)), rowX + 360, currentY + 10, { width: 70, align: 'right' });
    
    // Total Price
    doc.text(formatCurrency(safeGet(item, 'totalPrice', 0)), rowX + 430, currentY + 10, { width: 70, align: 'right' });
    
    currentY += 30;
  });
  
  // If no items, show message
  if (items.length === 0) {
    doc.fillColor(COLORS.white)
       .rect(50, currentY, 500, 30)
       .fill();
    doc.fillColor(COLORS.darkGray)
       .fontSize(10)
       .text('No items found in this order', 50, currentY + 10, { width: 500, align: 'center' });
    currentY += 30;
  }
  
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
     .text(formatCurrency(safeGet(order, 'totalAmount', 0)), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  
  // Discount
  const discount = safeGet(order, 'discount', 0);
  if (discount > 0) {
    currentY += lineHeight;
    doc.text('Discount:', summaryX, currentY, { width: summaryWidth - 80 })
       .text(`-${formatCurrency(discount)}`, summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  }
  
  // Tax
  const tax = safeGet(order, 'tax', 0);
  if (tax > 0) {
    currentY += lineHeight;
    doc.text('Tax (GST):', summaryX, currentY, { width: summaryWidth - 80 })
       .text(formatCurrency(tax), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  }
  
  // Shipping
  const shippingFee = safeGet(order, 'shippingFee', 0);
  currentY += lineHeight;
  doc.text('Shipping Fee:', summaryX, currentY, { width: summaryWidth - 80 })
     .text(formatCurrency(shippingFee), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  
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
     .text(formatCurrency(safeGet(order, 'finalAmount', 0)), summaryX + summaryWidth - 80, currentY, { align: 'right', width: 80 });
  
  doc.y = currentY + 30;
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
     .list([
       'This is a computer-generated invoice and does not require a signature.',
       'Goods once sold will not be taken back or exchanged unless defective.',
       'All disputes are subject to the jurisdiction of Kolkata courts.',
       'Delivery timelines are approximate and may vary based on customization requirements.',
       'Customized products cannot be returned or exchanged unless damaged during delivery.',
       'Please inspect your order upon delivery and report any damages within 24 hours.'
     ], 50, doc.y + 15, {
       bulletRadius: 2,
       textIndent: 10,
       width: 500,
       lineGap: 5
     });
  
  doc.y += 100;
};

// Main invoice generation function
export const generateInvoice = async (order) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate order data
      if (!order) {
        throw new Error('Order data is required');
      }
      
      // Create document with margins
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true,
        info: {
          Title: `Invoice ${safeGet(order, 'orderId', '')}`,
          Author: 'TheNimantran.com',
          Subject: 'Order Invoice',
          Keywords: 'invoice, order, receipt, thenimantran',
          Creator: 'TheNimantran.com',
          CreationDate: new Date()
        }
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
         .text('TAX INVOICE', 50, doc.y, { align: 'center', width: 500 });
      
      doc.moveDown(1.5);
      
      // Add customer and order info
      addCustomerInfo(doc, order);
      
      // Add horizontal line separator
      doc.moveTo(50, doc.y)
         .lineTo(550, doc.y)
         .lineWidth(1)
         .strokeColor(COLORS.darkGray)
         .stroke();
      
      doc.moveDown(1);
      
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
          doc.image(qrCode, 50, doc.y - 100, { width: 80, height: 80 });
          
          // Add QR code label
          doc.fillColor(COLORS.darkGray)
             .fontSize(8)
             .text('Scan to verify', 50, doc.y - 20, { width: 80, align: 'center' });
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
      console.error('PDF generation error:', error);
      reject(new Error(`Failed to generate invoice: ${error.message}`));
    }
  });
};