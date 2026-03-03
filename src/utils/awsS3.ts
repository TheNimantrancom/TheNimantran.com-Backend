import AWS from "aws-sdk"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import mime from "mime-types"
import crypto from "crypto"

dotenv.config()

/* ======================================================
   ENV VALIDATION
====================================================== */

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    )
  }
  return value
}

const AWS_S3_ID = requireEnv("AWS_S3_ID")
const AWS_SECRET = requireEnv("AWS_SECRET")
const AWS_REGION = requireEnv("AWS_REGION")
const AWS_S3_BUCKET_NAME = requireEnv("AWS_S3_BUCKET_NAME")
const CLOUDFRONT_URL = requireEnv("CLOUDFRONT_URL")
const CLOUDFRONT_PUBLIC_KEY_ID = requireEnv(
  "CLOUDFRONT_PUBLIC_KEY_ID"
)
const PRIVATE_KEY_PATH = requireEnv("PRIVATE_KEY_PATH")

/* ======================================================
   AWS CONFIG
====================================================== */

AWS.config.update({
  accessKeyId: AWS_S3_ID,
  secretAccessKey: AWS_SECRET,
  region: AWS_REGION,
})

const s3 = new AWS.S3()

const privateKey = fs.readFileSync(
  PRIVATE_KEY_PATH,
  "utf8"
)

/* ======================================================
   TYPES
====================================================== */

interface UploadResult {
  key: string
  signedUrl: string
  s3Location: string
}

interface PresignedUploadResult {
  uploadUrl: string
  key: string
  viewUrl: string
}

/* ======================================================
   CLOUDFRONT SIGNED URL
====================================================== */

export function generateSignedUrl(key: string): string {
  const url = `${CLOUDFRONT_URL}/${key}`
  const expires =
    Math.floor(Date.now() / 1000) + 60 * 60 * 24

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": expires,
          },
        },
      },
    ],
  })

  const policyBase64 = Buffer.from(policy).toString(
    "base64"
  )

  const signature = crypto
    .createSign("RSA-SHA1")
    .update(policy)
    .sign(privateKey, "base64")

  return `${url}?Policy=${encodeURIComponent(
    policyBase64
  )}&Signature=${encodeURIComponent(
    signature
  )}&Key-Pair-Id=${CLOUDFRONT_PUBLIC_KEY_ID}`
}

/* ======================================================
   S3 UPLOAD (SERVER SIDE)
====================================================== */

export const uploadToS3 = async (
  localFilePath: string,
  folder: string = "uploads"
): Promise<UploadResult | null> => {
  if (!localFilePath) return null

  const safeUnlink = (filePath: string): void => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch {}
  }

  try {
    const fileContent =
      await fs.promises.readFile(localFilePath)

    const fileName = path.basename(localFilePath)
    const key = `${folder}/${Date.now()}-${fileName}`

    const mimeType =
      mime.lookup(fileName) || "application/octet-stream"

    const params: AWS.S3.PutObjectRequest = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: mimeType as string,
      ContentDisposition: "inline",
    }

    const result = await s3.upload(params).promise()

    safeUnlink(localFilePath)

    return {
      key,
      signedUrl: generateSignedUrl(key),
      s3Location: result.Location,
    }
  } catch (error) {
    safeUnlink(localFilePath)
    console.error("S3 upload failed:", error)
    return null
  }
}

/* ======================================================
   DELETE FROM S3
====================================================== */

export const deleteFromS3 = async (
  key: string
): Promise<void> => {
  if (!key) return

  try {
    await s3
      .deleteObject({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
      })
      .promise()
  } catch (error) {
    console.error("Failed to delete from S3:", error)
  }
}

/* ======================================================
   PRESIGNED UPLOAD (FRONTEND DIRECT UPLOAD)
====================================================== */

export const generatePresignedUploadUrl =
  async (
    fileName: string,
    fileType: string,
    folder: string = "uploads"
  ): Promise<PresignedUploadResult> => {
    try {
      const key = `${folder}/${Date.now()}-${fileName}`

      const params: AWS.S3.PresignedPost.Params = {
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        Expires: 60,
      }

      const uploadUrl = s3.getSignedUrl(
        "putObject",
        params
      )

      return {
        uploadUrl,
        key,
        viewUrl: generateSignedUrl(key),
      }
    } catch (error) {
      console.error(
        "Error generating presigned S3 URL:",
        error
      )
      throw new Error(
        "Failed to generate presigned upload URL"
      )
    }
  }