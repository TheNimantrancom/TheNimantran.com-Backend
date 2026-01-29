const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController.js');

// Create Razorpay Order (with UPI support)
router.post('/create-order', paymentController.createOrder);

// Verify Payment (with UPI VPA support)
router.post('/verify-payment', paymentController.verifyPayment);

// Generate UPI QR Code (Alternative payment method)
router.post('/upi/qrcode', paymentController.generateUpiQrCode);

// Check UPI Payment Status
router.get('/upi/status/:paymentId', paymentController.checkUpiPaymentStatus);
router.get('/upi/status/order/:orderId', paymentController.checkUpiPaymentStatus);

router.get('/order/:orderId', paymentController.getOrderDetails);

router.get('/payment/:paymentId', paymentController.getPaymentDetails);

router.post('/refund', paymentController.refundPayment);

router.get('/upi/apps', paymentController.getSupportedUpiApps);

router.post('/webhook', 
    express.raw({ type: 'application/json' }),
    paymentController.handleWebhook
);

export default router;