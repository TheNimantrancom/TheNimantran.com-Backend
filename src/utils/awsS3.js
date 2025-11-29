import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mime from "mime-types";
import crypto from "crypto";

dotenv.config();

const requireEnv = (name) => {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return process.env[name];
};

// Required environment variables
requireEnv("AWS_S3_ID");
requireEnv("AWS_SECRET");
requireEnv("AWS_REGION");
requireEnv("AWS_S3_BUCKET_NAME");
requireEnv("CLOUDFRONT_URL");
requireEnv("CLOUDFRONT_PUBLIC_KEY_ID");
requireEnv("CLOUDFRONT_KEY_GROUP_ID");
requireEnv("PRIVATE_KEY_PATH");

AWS.config.update({
  accessKeyId: process.env.AWS_S3_ID,
  secretAccessKey: process.env.AWS_SECRET,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Load private key (used to sign URLs)
const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");

// Generate CloudFront Signed URL using Key Group (NEW METHOD)
export function generateSignedUrl(key) {
  const url = `${process.env.CLOUDFRONT_URL}/${key}`;
  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 hrs

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: { "AWS:EpochTime": expires }
        }
      }
    ]
  });

  const policyBase64 = Buffer.from(policy).toString("base64");

  const signature = crypto
    .createSign("RSA-SHA1")
    .update(policy)
    .sign(privateKey, "base64");

  return `${url}?Policy=${encodeURIComponent(policyBase64)}&Signature=${encodeURIComponent(signature)}&Key-Pair-Id=${process.env.CLOUDFRONT_PUBLIC_KEY_ID}`;
}

// Upload File to S3
export const uploadToS3 = async (localFilePath, folder = "uploads") => {
  if (!localFilePath) return null;

  const safeUnlink = (filePath) => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {}
  };

  try {
    const fileContent = await fs.promises.readFile(localFilePath);
    const fileName = path.basename(localFilePath);
    const key = `${folder}/${Date.now()}-${fileName}`;
    const mimeType = mime.lookup(fileName) || "application/octet-stream";

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: mimeType,
      ContentDisposition: "inline",
    };

    const result = await s3.upload(params).promise();

    safeUnlink(localFilePath);

    return {
      key,
      signedUrl: generateSignedUrl(key),
      s3Location: result.Location,
    };
  } catch (err) {
    safeUnlink(localFilePath);
    console.error("S3 upload failed:", err);
    return null;
  }
};

// Delete File from S3
export const deleteFromS3 = async (key) => {
  if (!key) return;

  try {
    await s3
      .deleteObject({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      })
      .promise();
  } catch (err) {
    console.error("Failed to delete from S3:", err);
  }
};

// Pre-signed Upload URL (Frontend Direct Upload to S3)
export const generatePresignedUploadUrl = async (
  fileName,
  fileType,
  folder = "uploads"
) => {
  try {
    const key = `${folder}/${Date.now()}-${fileName}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 60,
    };

    const uploadUrl = s3.getSignedUrl("putObject", params);

    return {
      uploadUrl,
      key,
      viewUrl: generateSignedUrl(key),
    };
  } catch (err) {
    console.error("Error generating presigned S3 URL:", err);
    throw new Error("Failed to generate presigned upload URL");
  }
};
