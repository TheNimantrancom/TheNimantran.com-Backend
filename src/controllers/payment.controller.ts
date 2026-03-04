import { Request, Response } from "express"
import Razorpay from "razorpay"
import crypto from "crypto"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string
})

interface CreateOrderBody {
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, unknown>
  method?: string
}

const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      currency = "INR",
      receipt,
      notes = {},
      method = "all"
    } = req.body as CreateOrderBody

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required"
      })
    }

    const amountInPaisa = Math.round(amount * 100)

    const options = {
      amount: amountInPaisa,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        ...notes,
        userId: (req as any).user?.id || "guest",
        paymentMethod: method
      },
      payment_capture: 1
    }

    const order = await razorpay.orders.create(options)

    const response: any = {
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
    }

    if (method === "upi") {
      response.upi = {
        flow: "collect",
        vpa: ""
      }
    }

    res.status(200).json(response)
  } catch (error: any) {
    console.error("Create Order Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create order"
    })
  }
}

interface VerifyPaymentBody {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  razorpay_vpa?: string
}

const verifyPayment = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_vpa
    } = req.body as VerifyPaymentBody

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing payment verification details"
      })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body.toString())
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (isAuthentic) {
      let paymentMethod = "card"
      let upiDetails: Record<string, unknown> = {}

      try {
        const payment = await razorpay.payments.fetch(razorpay_payment_id)
        paymentMethod = payment.method || "card"

        if (payment.method === "upi") {
          paymentMethod = "UPI"
          upiDetails = {
            vpa: razorpay_vpa || payment.vpa || "",
            bank: payment.bank || "",
            provider: payment.wallet || ""
          }
        }
      } catch (fetchError: any) {
        console.warn("Could not fetch payment details:", fetchError.message)
      }

      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentDetails: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
          method: paymentMethod,
          ...upiDetails,
          verifiedAt: new Date().toISOString()
        }
      })
    } else {
      res.status(400).json({
        success: false,
        error: "Invalid payment signature"
      })
    }
  } catch (error: any) {
    console.error("Verify Payment Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Payment verification failed"
    })
  }
}

const generateUpiQrCode = async (req: Request, res: Response) => {
  try {
    const {
      amount,
      name = "The Nimantran",
      description = "Payment for order",
      upi_id = process.env.MERCHANT_UPI_ID || ""
    } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required"
      })
    }

    const amountInPaisa = Math.round(amount * 100)

    const upiData = {
      upiId: upi_id,
      amount: amountInPaisa,
      currency: "INR",
      merchantName: name,
      transactionNote: description
    }

    const upiLink = `upi://pay?pa=${upi_id}&pn=${encodeURIComponent(
      name
    )}&am=${amount}&tn=${encodeURIComponent(description)}&cu=INR`

    res.status(200).json({
      success: true,
      upi: {
        link: upiLink,
        data: upiData,
        instructions:
          "Scan this QR code with any UPI app or use the payment link"
      }
    })
  } catch (error: any) {
    console.error("Generate UPI QR Code Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to generate UPI QR code"
    })
  }
}

const checkUpiPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentId, orderId } = req.params

    let payment: any

    if (paymentId) {
      payment = await razorpay.payments.fetch(paymentId)
    } else if (orderId) {
      const payments = await razorpay.payments.all({ order_id: orderId })
      payment = payments.items[0]
    } else {
      return res.status(400).json({
        success: false,
        error: "Either paymentId or orderId is required"
      })
    }

    const isUpi = payment.method === "upi"

    const upiDetails = isUpi
      ? {
          vpa: payment.vpa || "",
          bank: payment.bank || "",
          provider: payment.wallet || ""
        }
      : {}

    res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: isUpi ? "UPI" : payment.method,
        ...upiDetails,
        order_id: payment.order_id,
        captured: payment.captured,
        created_at: payment.created_at,
        email: payment.email,
        contact: payment.contact
      }
    })
  } catch (error: any) {
    console.error("Check UPI Payment Status Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch payment status"
    })
  }
}

const handleUpiWebhook = async (req: Request, res: Response) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET as string
    const razorpaySignature = req.headers["x-razorpay-signature"] as string

    const shasum = crypto.createHmac("sha256", webhookSecret)
    shasum.update(JSON.stringify(req.body))
    const digest = shasum.digest("hex")

    if (digest !== razorpaySignature) {
      return res.status(400).json({
        success: false,
        error: "Invalid signature"
      })
    }

    const event = req.body.event
    const payment = req.body.payload.payment.entity
    const order = req.body.payload.order.entity

    console.log("UPI Webhook Event:", event)
    console.log("Payment ID:", payment.id)
    console.log("Order ID:", order.id)

    res.status(200).json({ success: true })
  } catch (error: any) {
    console.error("UPI Webhook Error:", error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
}

const getOrderDetails = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params

    const order = await razorpay.orders.fetch(orderId)

    let paymentMethod = "unknown"
    let upiDetails: any = null

    try {
      const payments = await razorpay.payments.all({
        order_id: orderId,
        count: 1
      })

      if (payments.items.length > 0) {
        const payment = payments.items[0]

        paymentMethod = payment.method

        if (payment.method === "upi") {
          upiDetails = {
            vpa: payment.vpa || "",
            bank: payment.bank || "",
            provider: payment.wallet || ""
          }

          paymentMethod = "UPI"
        }
      }
    } catch (error: any) {
      console.warn("Could not fetch payment for order:", error.message)
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
    })
  } catch (error: any) {
    console.error("Get Order Details Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch order details"
    })
  }
}

const getPaymentDetails = async (req: Request, res: Response) => {
  try {
    const { paymentId } = req.params

    const payment = await razorpay.payments.fetch(paymentId)

    const isUpi = payment.method === "upi"

    const upiDetails = isUpi
      ? {
          vpa: payment.vpa,
          bank: payment.bank,
          wallet: payment.wallet,
          provider: payment.wallet || "UPI"
        }
      : {}

    res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: isUpi ? "UPI" : payment.method,
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
    })
  } catch (error: any) {
    console.error("Get Payment Details Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch payment details"
    })
  }
}

const refundPayment = async (req: Request, res: Response) => {
  try {
    const { paymentId, amount, notes = {} } = req.body

    const refundOptions: any = {
      payment_id: paymentId,
      ...(amount && { amount: Math.round(amount * 100) }),
      notes,
      speed: "normal"
    }

    const refund = await razorpay.refunds.create(refundOptions)

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
    })
  } catch (error: any) {
    console.error("Refund Payment Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process refund"
    })
  }
}

const getSupportedUpiApps = async (req: Request, res: Response) => {
  try {
    const supportedUpiApps = [
      { id: "google_pay", name: "Google Pay" },
      { id: "phonepe", name: "PhonePe" },
      { id: "paytm", name: "Paytm" },
      { id: "bhim_upi", name: "BHIM UPI" },
      { id: "amazon_pay", name: "Amazon Pay" }
    ]

    res.status(200).json({
      success: true,
      upi_apps: supportedUpiApps,
      instructions: "Select your preferred UPI app for payment",
      note: "All UPI apps are supported via Razorpay"
    })
  } catch (error: any) {
    console.error("Get UPI Apps Error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch UPI apps"
    })
  }
}

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
}