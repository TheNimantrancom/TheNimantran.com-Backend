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

interface VerifyPaymentBody {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  razorpay_vpa?: string
}

interface GenerateUpiBody {
  amount: number
  name?: string
  description?: string
  upi_id?: string
}

interface RefundBody {
  paymentId: string
  amount?: number
  notes?: Record<string, unknown>
}

interface OrderParams {
  orderId: string
}

interface PaymentParams {
  paymentId: string
}

const createOrder = async (
  req: Request<{}, {}, CreateOrderBody>,
  res: Response
) => {
  try {
    const {
      amount,
      currency = "INR",
      receipt,
      notes = {},
      method = "all"
    } = req.body

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required"
      })
    }

    const amountInPaisa = Math.round(amount * 100)

    const options:any = {
      amount: amountInPaisa,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        ...notes,
        paymentMethod: method
      }
    }

    const order = await razorpay.orders.create(options)

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
    }

    if (method === "upi") {
      Object.assign(response, {
        upi: {
          flow: "collect",
          vpa: ""
        }
      })
    }

    res.status(200).json(response)
  } catch (error) {
    const err = error as Error
    res.status(500).json({
      success: false,
      error: err.message || "Failed to create order"
    })
  }
}

const verifyPayment = async (
  req: Request<{}, {}, VerifyPaymentBody>,
  res: Response
) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_vpa
    } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing payment verification details"
      })
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex")

    const isAuthentic = expectedSignature === razorpay_signature

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature"
      })
    }

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
    } catch { }

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
  } catch (error) {
    const err = error as Error
    res.status(500).json({
      success: false,
      error: err.message || "Payment verification failed"
    })
  }
}

const generateUpiQrCode = async (
  req: Request<{}, {}, GenerateUpiBody>,
  res: Response
) => {
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

    const upiLink = `upi://pay?pa=${upi_id}&pn=${encodeURIComponent(
      name
    )}&am=${amount}&tn=${encodeURIComponent(description)}&cu=INR`

    res.status(200).json({
      success: true,
      upi: {
        link: upiLink,
        data: {
          upiId: upi_id,
          amount: amountInPaisa,
          currency: "INR",
          merchantName: name,
          transactionNote: description
        }
      }
    })
  } catch (error) {
    const err = error as Error
    res.status(500).json({
      success: false,
      error: err.message || "Failed to generate UPI QR code"
    })
  }
}


const checkUpiPaymentStatus = async (
  req: Request<{ paymentId?: string; orderId?: string }>,
  res: Response
) => {
  try {
    const { paymentId, orderId } = req.params

    let payment:any

    if (paymentId) {
      payment = await razorpay.payments.fetch(paymentId)
    } else if (orderId) {
      const payments: any = await (razorpay.payments as any).all({ order_id: orderId })

      if (!payments.items || payments.items.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No payment found for this order"
        })
      }

      payment = payments.items[0]
    } else {
      return res.status(400).json({
        success: false,
        error: "Either paymentId or orderId is required"
      })
    }

    const isUpi = payment.method === "upi"

    res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: isUpi ? "UPI" : payment.method,
        vpa: payment.vpa,
        bank: payment.bank,
        order_id: payment.order_id,
        captured: payment.captured,
        created_at: payment.created_at,
        email: payment.email,
        contact: payment.contact
      }
    })
  } catch (error) {
    const err = error as Error

    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch payment status"
    })
  }
}

const refundPayment = async (
  req: Request<{}, {}, RefundBody>,
  res: Response
) => {
  try {
    const { paymentId, amount, notes = {} } = req.body

    const refund = await (razorpay.refunds as any).create({
      payment_id: paymentId,
      ...(amount && { amount: Math.round(amount * 100) }),
      notes,
      speed: "normal"
    })

    res.status(200).json({
      success: true,
      refund
    })
  } catch (error) {
    const err = error as Error
    res.status(500).json({
      success: false,
      error: err.message || "Failed to process refund"
    })
  }
}

export {
  createOrder,
  verifyPayment,
  generateUpiQrCode,
  checkUpiPaymentStatus,
  refundPayment
}