import { Request, Response } from "express"
import Razorpay from "razorpay"
import crypto from "crypto"

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
  MERCHANT_UPI_ID,
} = process.env

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay keys missing in environment variables")
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
})

/* =========================
   CREATE ORDER
========================= */

interface CreateRazorpayOrderBody {
  amount: number
  currency?: string
  receipt?: string
  notes?: Record<string, string>
  method?: "all" | "upi" | "card"
}

export const createOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    amount,
    currency = "INR",
    receipt,
    notes = {},
    method = "all",
  } = req.body as CreateRazorpayOrderBody

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Valid amount is required",
    })
  }

  const amountInPaisa = Math.round(amount * 100)

  const options: Razorpay.Orders.RazorpayOrderCreateRequestBody =
    {
      amount: amountInPaisa,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        ...notes,
        userId: req.user?._id?.toString() || "guest",
        paymentMethod: method,
      },
      payment_capture: 1,
    }

  const order = await razorpay.orders.create(options)

  return res.status(200).json({
    success: true,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      amount_paisa: amountInPaisa,
      amount_rupees: amount,
    },
    key: RAZORPAY_KEY_ID,
    upiSupported: true,
  })
}

/* =========================
   VERIFY PAYMENT
========================= */

interface VerifyPaymentBody {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  razorpay_vpa?: string
}

export const verifyPayment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    razorpay_vpa,
  } = req.body as VerifyPaymentBody

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      success: false,
      error: "Missing payment verification details",
    })
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`

  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({
      success: false,
      error: "Invalid payment signature",
    })
  }

  let paymentMethod = "card"
  let upiDetails: Record<string, string> = {}

  try {
    const payment = await razorpay.payments.fetch(
      razorpay_payment_id
    )

    paymentMethod = payment.method || "card"

    if (payment.method === "upi") {
      paymentMethod = "UPI"
      upiDetails = {
        vpa: razorpay_vpa || payment.vpa || "",
        bank: payment.bank || "",
        provider: payment.wallet || "",
      }
    }
  } catch {
    /* ignore fetch failure */
  }

  return res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    paymentDetails: {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      method: paymentMethod,
      ...upiDetails,
      verifiedAt: new Date().toISOString(),
    },
  })
}

/* =========================
   GENERATE UPI LINK
========================= */

interface GenerateUpiBody {
  amount: number
  name?: string
  description?: string
  upi_id?: string
}

export const generateUpiQrCode = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const {
    amount,
    name = "The Nimantran",
    description = "Payment for order",
    upi_id = MERCHANT_UPI_ID || "",
  } = req.body as GenerateUpiBody

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Valid amount is required",
    })
  }

  const upiLink = `upi://pay?pa=${upi_id}&pn=${encodeURIComponent(
    name
  )}&am=${amount}&tn=${encodeURIComponent(
    description
  )}&cu=INR`

  return res.status(200).json({
    success: true,
    upi: {
      link: upiLink,
      instructions:
        "Scan this QR code with any UPI app or use the payment link",
    },
  })
}

/* =========================
   WEBHOOK HANDLER
========================= */

export const handleUpiWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (!RAZORPAY_WEBHOOK_SECRET) {
    return res.status(500).json({
      success: false,
      error: "Webhook secret missing",
    })
  }

  const signature = req.headers[
    "x-razorpay-signature"
  ] as string

  const shasum = crypto.createHmac(
    "sha256",
    RAZORPAY_WEBHOOK_SECRET
  )

  shasum.update(JSON.stringify(req.body))
  const digest = shasum.digest("hex")

  if (digest !== signature) {
    return res.status(400).json({
      success: false,
      error: "Invalid signature",
    })
  }

  const event: string = req.body.event

  return res.status(200).json({
    success: true,
    receivedEvent: event,
  })
}