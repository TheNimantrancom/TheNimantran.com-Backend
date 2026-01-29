import axios from "axios";

const CASHFREE_BASE_URL = "https://api.cashfree.com/pg"

const createCashfreeOrder = async (req, res) => {
  try {
    const { orderAmount, customerName, customerEmail, customerPhone } = req.body

    const orderId = "ORDER_" + Date.now()

    const response = await axios.post(
      `${CASHFREE_BASE_URL}/orders`,
      {
        order_id: orderId,
        order_amount: orderAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: "cust_" + Date.now(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01"
        }
      }
    )

    return res.status(200).json({
      success: true,
      orderId,
      paymentSessionId: response.data.payment_session_id
    })
  } catch (error) {
    console.error("Cashfree Error:", error.response?.data || error.message)
    return res.status(500).json({
      success: false,
      message: "Cashfree order creation failed"
    })
  }
}

const verifyCashfreePayment = async (req, res) => {
  try {
    const { orderId } = req.params

    const response = await axios.get(
      `${CASHFREE_BASE_URL}/orders/${orderId}`,
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01"
        }
      }
    )

    return res.status(200).json({
      success: true,
      data: response.data
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Payment verification failed"
    })
  }
}

export {
  createCashfreeOrder,
  verifyCashfreePayment
}
