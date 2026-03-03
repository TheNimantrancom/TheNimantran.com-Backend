import PDFDocument from "pdfkit"
import QRCode from "qrcode"

/* ======================================================
   TYPES
====================================================== */

interface ShippingAddress {
  name?: string
  roadAreaColony?: string
  city?: string
  state?: string
  pincode?: string
  phone?: string
}

interface OrderItem {
  name?: string
  isWholesale?: boolean
  packs?: number
  packSize?: number
  pricePerPack?: number
  totalPrice?: number
}

interface Order {
  orderId?: string
  createdAt?: Date | string
  paymentMethod?: string
  paymentStatus?: string
  status?: string
  shippingAddress?: ShippingAddress
  items?: OrderItem[]
  totalAmount?: number
  discount?: number
  tax?: number
  shippingFee?: number
  finalAmount?: number
}

/* ======================================================
   HELPERS
====================================================== */

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const formatCurrency = (amount: number = 0): string => {
  return `₹${Number(amount)
    .toFixed(2)
    .replace(/\d(?=(\d{3})+\.)/g, "$&,")}`
}

const safeGet = <T, K extends keyof T>(
  obj: T | undefined,
  key: K,
  fallback: any
): any => {
  if (!obj) return fallback
  return obj[key] ?? fallback
}

const generateQRCode = async (
  order: Order
): Promise<string | null> => {
  try {
    const qrData = JSON.stringify({
      orderId: order.orderId,
      amount: order.finalAmount ?? 0,
      date: order.createdAt ?? new Date(),
    })

    return await QRCode.toDataURL(qrData, {
      width: 100,
      margin: 1,
    })
  } catch {
    return null
  }
}

/* ======================================================
   MAIN FUNCTION
====================================================== */

export const generateInvoice = async (
  order: Order
): Promise<Buffer> => {
  if (!order) {
    throw new Error("Order data is required")
  }

  return new Promise<Buffer>(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        bufferPages: true,
      })

      const chunks: Buffer[] = []

      doc.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
      })

      doc.on("end", () => {
        resolve(Buffer.concat(chunks))
      })

      doc.on("error", reject)

      /* ---------------- HEADER ---------------- */

      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text("TheNimantran.com")

      doc.moveDown()

      doc
        .fontSize(16)
        .text("TAX INVOICE", { align: "center" })

      doc.moveDown(2)

      /* ---------------- CUSTOMER INFO ---------------- */

      doc
        .fontSize(12)
        .text(
          `Order ID: ${order.orderId ?? "N/A"}`
        )
        .text(
          `Order Date: ${
            order.createdAt
              ? formatDate(order.createdAt)
              : "N/A"
          }`
        )
        .moveDown()

      const address = order.shippingAddress

      doc
        .text(`Customer: ${address?.name ?? "N/A"}`)
        .text(
          `${address?.roadAreaColony ?? ""}`
        )
        .text(
          `${address?.city ?? ""} ${
            address?.state ?? ""
          }`
        )
        .text(
          `Pincode: ${address?.pincode ?? ""}`
        )
        .moveDown(2)

      /* ---------------- ITEMS ---------------- */

      doc.font("Helvetica-Bold")
      doc.text("Items:")
      doc.moveDown()

      doc.font("Helvetica")

      order.items?.forEach((item, index) => {
        doc
          .text(
            `${index + 1}. ${item.name ?? ""}`
          )
          .text(
            `Packs: ${item.packs ?? 0}`
          )
          .text(
            `Price: ${formatCurrency(
              item.pricePerPack ?? 0
            )}`
          )
          .text(
            `Total: ${formatCurrency(
              item.totalPrice ?? 0
            )}`
          )
          .moveDown()
      })

      doc.moveDown()

      /* ---------------- SUMMARY ---------------- */

      doc
        .font("Helvetica-Bold")
        .text("Summary")
        .moveDown()

      doc
        .font("Helvetica")
        .text(
          `Subtotal: ${formatCurrency(
            order.totalAmount ?? 0
          )}`
        )
        .text(
          `Discount: -${formatCurrency(
            order.discount ?? 0
          )}`
        )
        .text(
          `Tax: ${formatCurrency(
            order.tax ?? 0
          )}`
        )
        .text(
          `Shipping: ${formatCurrency(
            order.shippingFee ?? 0
          )}`
        )
        .moveDown()

      doc
        .font("Helvetica-Bold")
        .text(
          `Total: ${formatCurrency(
            order.finalAmount ?? 0
          )}`
        )

      /* ---------------- QR ---------------- */

      const qr = await generateQRCode(order)
      if (qr) {
        doc.moveDown(2)
        doc.image(qr, { width: 100 })
      }

      doc.end()
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Invoice generation failed"

      reject(
        new Error(
          `Failed to generate invoice: ${message}`
        )
      )
    }
  })
}