import { Request, Response } from "express"
import { CommercialPrint } from "../models/commercialPrint.model.js"
import { generatePresignedUploadUrl } from "../utils/awsS3.js"
import { CommercialPrintOrder } from "../models/commercialPrintOrder.js"



interface UploadBody {
  fileName: string
  fileType: string
}

interface CreateOrderBody {
  userId: string
  printTypeId: string
  uploadedFile: {
    key: string
    viewUrl: string
    originalName: string
    mimeType: string
  }
  size: string
  paperType: string
  finishType: string
  quantity: number
  notes?: string
}

/* =========================
   GET ALL PRINT TYPES
========================= */

export const getAllPrintTypes = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const printTypes = await CommercialPrint.find({ isActive: true }).sort({
      createdAt: -1,
    })
    return res.status(200).json({ success: true, data: printTypes })
  } catch (error) {
    console.error("getAllPrintTypes error:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

/* =========================
   GET PRINT TYPE BY SLUG
========================= */

export const getPrintTypeBySlug = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { slug } = req.params
    const printType = await CommercialPrint.findOne({ slug, isActive: true })

    if (!printType) {
      return res
        .status(404)
        .json({ success: false, message: "Print type not found" })
    }

    return res.status(200).json({ success: true, data: printType })
  } catch (error) {
    console.error("getPrintTypeBySlug error:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}

/* =========================
   UPLOAD PRINT FILE
   Returns presigned S3 URL
========================= */

export const uploadPrintFile = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { fileName, fileType } = req.body as UploadBody

    if (!fileName || !fileType) {
      return res
        .status(400)
        .json({ success: false, message: "fileName and fileType are required" })
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ]
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Only PDF, PNG, and JPG files are allowed",
      })
    }

    const result = await generatePresignedUploadUrl(
      fileName,
      fileType,
      "commercial-prints"
    )

    return res.status(200).json({
      success: true,
      uploadUrl: result.uploadUrl,
      key: result.key,
      viewUrl: result.viewUrl,
    })
  } catch (error) {
    console.error("uploadPrintFile error:", error)
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate upload URL" })
  }
}

/* =========================
   CREATE COMMERCIAL PRINT ORDER
========================= */

export const createCommercialPrintOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const {
      userId,
      printTypeId,
      uploadedFile,
      size,
      paperType,
      finishType,
      quantity,
      notes,
    } = req.body as CreateOrderBody

    // Validate required fields
    if (
      !userId ||
      !printTypeId ||
      !uploadedFile ||
      !size ||
      !paperType ||
      !finishType ||
      !quantity
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All required fields must be provided" })
    }

    // Fetch print type for pricing
    const printType = await CommercialPrint.findById(printTypeId)
    if (!printType) {
      return res
        .status(404)
        .json({ success: false, message: "Print type not found" })
    }

    if (quantity < printType.minQuantity) {
      return res.status(400).json({
        success: false,
        message: `Minimum quantity is ${printType.minQuantity}`,
      })
    }

    const totalPrice = printType.pricePerUnit * quantity

    const order = await CommercialPrintOrder.create({
      userId,
      printType: printTypeId,
      uploadedFile,
      size,
      paperType,
      finishType,
      quantity,
      pricePerUnit: printType.pricePerUnit,
      totalPrice,
      notes,
      status: "pending",
    })

    const populated = await order.populate("printType", "name slug thumbnailImage")

    return res.status(201).json({ success: true, data: populated })
  } catch (error) {
    console.error("createCommercialPrintOrder error:", error)
    return res.status(500).json({ success: false, message: "Server error" })
  }
}