
import Razorpay from "razorpay"
import crypto from "crypto"

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create Order with UPI support
const createOrder = async (req, res) => {
    try {
        const { 
            amount, 
            currency = 'INR', 
            receipt, 
            notes = {},
            method = 'all' // 'all', 'upi', 'card', etc.
        } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }

        // Convert amount to paisa
        const amountInPaisa = Math.round(amount * 100);

        // Create order options
        const options = {
            amount: amountInPaisa,
            currency: currency,
            receipt: receipt || `receipt_${Date.now()}`,
            notes: {
                ...notes,
                userId: req.user?.id || 'guest',
                paymentMethod: method
            },
            payment_capture: 1 // Auto capture payment
        };

        // Create order
        const order = await razorpay.orders.create(options);

        // Prepare response with UPI support
        const response = {
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt,
                amount_paisa: amountInPaisa,
                amount_rupees: amount
            },
            key: process.env.RAZORPAY_KEY_ID,
            upiSupported: true
        };

        // If method is UPI specifically, add UPI details
        if (method === 'upi') {
            response.upi = {
                flow: 'collect', // or 'intent' based on your preference
                vpa: '' // Empty for customer to enter
            };
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to create order'
        });
    }
};

// Verify Payment with UPI support
const verifyPayment = async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            razorpay_vpa // UPI VPA (Virtual Payment Address)
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing payment verification details'
            });
        }

        // Create signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Verify signature
        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Fetch payment details to get method
            let paymentMethod = 'card';
            let upiDetails = {};
            
            try {
                const payment = await razorpay.payments.fetch(razorpay_payment_id);
                paymentMethod = payment.method || 'card';
                
                // If it's UPI payment, extract details
                if (payment.method === 'upi') {
                    paymentMethod = 'UPI';
                    upiDetails = {
                        vpa: razorpay_vpa || payment.vpa || '',
                        bank: payment.bank || '',
                        provider: payment.wallet || ''
                    };
                }
            } catch (fetchError) {
                console.warn('Could not fetch payment details:', fetchError.message);
            }

            // Payment successful
            // Here you can update your database, send confirmation email, etc.
            
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                paymentDetails: {
                    orderId: razorpay_order_id,
                    paymentId: razorpay_payment_id,
                    signature: razorpay_signature,
                    method: paymentMethod,
                    ...upiDetails,
                    verifiedAt: new Date().toISOString()
                }
            });
        } else {
            // Signature mismatch
            res.status(400).json({
                success: false,
                error: 'Invalid payment signature'
            });
        }

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Payment verification failed'
        });
    }
};

// Get UPI QR Code (Alternative method)
const generateUpiQrCode = async (req, res) => {
    try {
        const { 
            amount, 
            name = 'The Nimantran',
            description = 'Payment for order',
            upi_id = process.env.MERCHANT_UPI_ID || ''
        } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid amount is required'
            });
        }

        // Convert to paisa
        const amountInPaisa = Math.round(amount * 100);

        // Generate UPI QR code data
        const upiData = {
            upiId: upi_id,
            amount: amountInPaisa,
            currency: 'INR',
            merchantName: name,
            transactionNote: description
        };

        // Create QR code URL (You'll need a QR code generator library)
        // For now, return UPI payment link
        const upiLink = `upi://pay?pa=${upi_id}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(description)}&cu=INR`;

        res.status(200).json({
            success: true,
            upi: {
                link: upiLink,
                data: upiData,
                instructions: 'Scan this QR code with any UPI app or use the payment link'
            }
        });

    } catch (error) {
        console.error('Generate UPI QR Code Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to generate UPI QR code'
        });
    }
};

// Check UPI Payment Status
const checkUpiPaymentStatus = async (req, res) => {
    try {
        const { paymentId, orderId } = req.params;

        let payment;
        if (paymentId) {
            payment = await razorpay.payments.fetch(paymentId);
        } else if (orderId) {
            const payments = await razorpay.payments.all({
                order_id: orderId
            });
            payment = payments.items[0];
        } else {
            return res.status(400).json({
                success: false,
                error: 'Either paymentId or orderId is required'
            });
        }

        // Check if it's a UPI payment
        const isUpi = payment.method === 'upi';
        const upiDetails = isUpi ? {
            vpa: payment.vpa || '',
            bank: payment.bank || '',
            provider: payment.wallet || ''
        } : {};

        res.status(200).json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: isUpi ? 'UPI' : payment.method,
                ...upiDetails,
                order_id: payment.order_id,
                captured: payment.captured,
                created_at: payment.created_at,
                email: payment.email,
                contact: payment.contact
            }
        });

    } catch (error) {
        console.error('Check UPI Payment Status Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch payment status'
        });
    }
};

// Handle UPI-specific webhook events
const handleUpiWebhook = async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const razorpaySignature = req.headers['x-razorpay-signature'];

        // Verify webhook signature
        const shasum = crypto.createHmac('sha256', webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');

        if (digest !== razorpaySignature) {
            console.error('Invalid webhook signature');
            return res.status(400).json({
                success: false,
                error: 'Invalid signature'
            });
        }

        const event = req.body.event;
        const payment = req.body.payload.payment.entity;
        const order = req.body.payload.order.entity;

        console.log('UPI Webhook Event:', event);
        console.log('Payment ID:', payment.id);
        console.log('Order ID:', order.id);
        console.log('Payment Method:', payment.method);

        // Handle UPI specific events
        if (payment.method === 'upi') {
            console.log('UPI Details:', {
                vpa: payment.vpa,
                bank: payment.bank,
                wallet: payment.wallet
            });
        }

        switch (event) {
            case 'payment.authorized':
                if (payment.method === 'upi') {
                    console.log('UPI Payment Authorized:', payment.id);
                    console.log('UPI VPA:', payment.vpa);
                    // Handle UPI authorization
                }
                break;

            case 'payment.captured':
                if (payment.method === 'upi') {
                    console.log('UPI Payment Captured:', payment.id);
                    // Update order status for UPI payment
                    // Send confirmation with UPI details
                }
                break;

            case 'payment.failed':
                if (payment.method === 'upi') {
                    console.log('UPI Payment Failed:', payment.id);
                    console.log('Error Code:', payment.error_code);
                    console.log('Error Description:', payment.error_description);
                    // Handle UPI payment failure
                }
                break;

            case 'payment.upi.collected':
                // Specific UPI event for QR code collections
                console.log('UPI QR Payment Collected:', payment.id);
                break;

            case 'payment.upi.expired':
                console.log('UPI Payment Expired:', payment.id);
                break;

            default:
                console.log('Unhandled UPI event:', event);
        }

        // Return success response to Razorpay
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('UPI Webhook Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Update Order Details function to include UPI info
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await razorpay.orders.fetch(orderId);

        // Get payments for this order to check method
        let paymentMethod = 'unknown';
        let upiDetails = null;
        
        try {
            const payments = await razorpay.payments.all({
                order_id: orderId,
                count: 1
            });
            
            if (payments.items && payments.items.length > 0) {
                const payment = payments.items[0];
                paymentMethod = payment.method;
                
                if (payment.method === 'upi') {
                    upiDetails = {
                        vpa: payment.vpa || '',
                        bank: payment.bank || '',
                        provider: payment.wallet || ''
                    };
                    paymentMethod = 'UPI';
                }
            }
        } catch (error) {
            console.warn('Could not fetch payment for order:', error.message);
        }

        res.status(200).json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                amount_paid: order.amount_paid,
                amount_due: order.amount_due,
                currency: order.currency,
                receipt: order.receipt,
                status: order.status,
                attempts: order.attempts,
                notes: order.notes,
                created_at: order.created_at,
                payment_method: paymentMethod,
                upi_details: upiDetails
            }
        });

    } catch (error) {
        console.error('Get Order Details Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch order details'
        });
    }
};

// Get Payment Details - Enhanced for UPI
const getPaymentDetails = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await razorpay.payments.fetch(paymentId);

        // Extract UPI details if payment method is UPI
        const isUpi = payment.method === 'upi';
        const upiDetails = isUpi ? {
            vpa: payment.vpa,
            bank: payment.bank,
            wallet: payment.wallet,
            provider: payment.wallet || 'UPI'
        } : {};

        res.status(200).json({
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                method: isUpi ? 'UPI' : payment.method,
                ...upiDetails,
                order_id: payment.order_id,
                invoice_id: payment.invoice_id,
                international: payment.international,
                amount_refunded: payment.amount_refunded,
                refund_status: payment.refund_status,
                captured: payment.captured,
                description: payment.description,
                card_id: payment.card_id,
                email: payment.email,
                contact: payment.contact,
                notes: payment.notes,
                fee: payment.fee,
                tax: payment.tax,
                error_code: payment.error_code,
                error_description: payment.error_description,
                created_at: payment.created_at
            }
        });

    } catch (error) {
        console.error('Get Payment Details Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch payment details'
        });
    }
};

// Refund Payment - UPI compatible
const refundPayment = async (req, res) => {
    try {
        const { paymentId, amount, notes = {} } = req.body;

        // If amount is not provided, full refund will be processed
        const refundOptions = {
            payment_id: paymentId,
            ...(amount && { amount: Math.round(amount * 100) }), // Convert to paisa
            notes: notes,
            speed: 'normal' // 'normal' or 'instant' (for UPI)
        };

        const refund = await razorpay.refunds.create(refundOptions);

        res.status(200).json({
            success: true,
            refund: {
                id: refund.id,
                amount: refund.amount,
                payment_id: refund.payment_id,
                entity: refund.entity,
                currency: refund.currency,
                status: refund.status,
                notes: refund.notes,
                speed_processed: refund.speed_processed,
                speed_requested: refund.speed_requested,
                created_at: refund.created_at
            }
        });

    } catch (error) {
        console.error('Refund Payment Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process refund'
        });
    }
};

// Get supported UPI apps
const getSupportedUpiApps = async (req, res) => {
    try {
        // List of popular UPI apps supported by Razorpay
        const supportedUpiApps = [
            { id: 'google_pay', name: 'Google Pay', icon: 'https://example.com/gpay.png' },
            { id: 'phonepe', name: 'PhonePe', icon: 'https://example.com/phonepe.png' },
            { id: 'paytm', name: 'Paytm', icon: 'https://example.com/paytm.png' },
            { id: 'bhim_upi', name: 'BHIM UPI', icon: 'https://example.com/bhim.png' },
            { id: 'amazon_pay', name: 'Amazon Pay', icon: 'https://example.com/amazon.png' }
        ];

        res.status(200).json({
            success: true,
            upi_apps: supportedUpiApps,
            instructions: 'Select your preferred UPI app for payment',
            note: 'All UPI apps are supported via Razorpay'
        });

    } catch (error) {
        console.error('Get UPI Apps Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Failed to fetch UPI apps'
        });
    }
};

export {
    createOrder,
    verifyPayment,
    generateUpiQrCode,
    checkUpiPaymentStatus,
     handleUpiWebhook, 
    getOrderDetails,
    getPaymentDetails,
    refundPayment,
    getSupportedUpiApps
};