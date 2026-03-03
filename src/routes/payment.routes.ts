import { checkUpiPaymentStatus, createOrder, generateUpiQrCode, getOrderDetails, getPaymentDetails, getSupportedUpiApps, handleUpiWebhook, refundPayment, verifyPayment } from '../controllers/payment.controller.js';
import express from "express"
const router = express.Router();


// Create Razorpay Order (with UPI support)
router.post('/create-order', createOrder);

// Verify Payment (with UPI VPA support)
router.post('/verify-payment', verifyPayment);

// Generate UPI QR Code (Alternative payment method)
router.post('/upi/qrcode', generateUpiQrCode);

// Check UPI Payment Status
router.get('/upi/status/:paymentId', checkUpiPaymentStatus);
router.get('/upi/status/order/:orderId', checkUpiPaymentStatus);

router.get('/order/:orderId', getOrderDetails);

router.get('/payment/:paymentId', getPaymentDetails);

router.post('/refund', refundPayment);

router.get('/upi/apps',getSupportedUpiApps);

router.post('/webhook', 
    express.raw({ type: 'application/json' }),
    handleUpiWebhook
);

export default router;