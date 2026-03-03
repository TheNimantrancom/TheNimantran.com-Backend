import { Request, Response } from "express"
import {
  generatePresignedUploadUrl,
  generateSignedUrl,
  deleteFromS3,
} from "../utils/awsS3.js"

/* =========================
   TYPES
========================= */

interface PresignBody {
  fileName: string
  fileType: string
}

/* =========================
   GET PRESIGNED UPLOAD URL
========================= */

export const getPresignedUploadUrl = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { fileName, fileType } =
      req.body as PresignBody

    if (!fileName || !fileType) {
      return res.status(400).json({
        message:
          "fileName and fileType required",
      })
    }

    const result = await generatePresignedUploadUrl(
      fileName,
      fileType
    )

    return res.status(200).json({
      uploadUrl: result.uploadUrl,
      key: result.key,
      viewUrl: result.viewUrl,
    })
  } catch (error) {
    console.error(
      "Presign error:",
      error instanceof Error
        ? error.message
        : error
    )

    return res.status(500).json({
      message:
        "Failed to generate upload URL",
    })
  }
}