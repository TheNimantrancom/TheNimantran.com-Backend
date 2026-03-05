import AWS from "aws-sdk"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import mime from "mime-types"

dotenv.config()

const requireEnv = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

const AWS_S3_ID = requireEnv("AWS_S3_ID")
const AWS_SECRET = requireEnv("AWS_SECRET")
const AWS_REGION = requireEnv("AWS_REGION")
const AWS_S3_BUCKET_NAME = requireEnv("AWS_S3_BUCKET_NAME")
const CLOUDFRONT_URL = requireEnv("CLOUDFRONT_URL")

AWS.config.update({
  accessKeyId: AWS_S3_ID,
  secretAccessKey: AWS_SECRET,
  region: AWS_REGION
})

const s3 = new AWS.S3()

interface UploadResult {
  key: string
  url: string
  s3Location: string
}

interface PresignedUploadResult {
  uploadUrl: string
  key: string
  viewUrl: string
}

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
    const fileContent = await fs.promises.readFile(localFilePath)
    const fileName = path.basename(localFilePath)
    const key = `${folder}/${Date.now()}-${fileName}`

    const mimeType = mime.lookup(fileName) || "application/octet-stream"

    const params: AWS.S3.PutObjectRequest = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: mimeType as string,
      CacheControl: "public, max-age=31536000, immutable"
    }

    const result = await s3.upload(params).promise()

    safeUnlink(localFilePath)

    return {
      key,
      url: `${CLOUDFRONT_URL}/${key}`,
      s3Location: result.Location
    }
  } catch (error) {
    safeUnlink(localFilePath)
    console.error("S3 upload failed:", error)
    return null
  }
}

export const deleteFromS3 = async (key: string): Promise<void> => {
  if (!key) return

  try {
    await s3
      .deleteObject({
        Bucket: AWS_S3_BUCKET_NAME,
        Key: key
      })
      .promise()
  } catch (error) {
    console.error("Failed to delete from S3:", error)
  }
}

export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: string = "uploads"
): Promise<PresignedUploadResult> => {
  const key = `${folder}/${Date.now()}-${fileName}`

  const params: AWS.S3.PresignedPost.Params = {
    Bucket: AWS_S3_BUCKET_NAME,
    Fields: {
      key,
      "Content-Type": fileType,
      "Cache-Control": "public, max-age=31536000, immutable",

    },
    Expires: 60
  }

  const uploadUrl = s3.getSignedUrl("putObject", {
    Bucket: AWS_S3_BUCKET_NAME,
    Key: key,
    ContentType: fileType,
  })

  return {
    uploadUrl,
    key,
    viewUrl: `${CLOUDFRONT_URL}/${key}`
  }
}
export const getCloudFrontUrl = (key: string): string => {
  return `${CLOUDFRONT_URL}/${key}`;
}