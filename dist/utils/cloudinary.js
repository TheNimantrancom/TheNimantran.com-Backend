import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
/* ======================================================
   ENV VALIDATION
====================================================== */
const requireEnv = (name) => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
};
const CLOUDINARY_CLOUD_NAME = requireEnv("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = requireEnv("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = requireEnv("CLOUDINARY_API_SECRET");
/* ======================================================
   CONFIGURATION
====================================================== */
cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});
/* ======================================================
   UPLOAD
====================================================== */
export const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath)
        return null;
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        await fs.unlink(localFilePath).catch(() => { });
        return response;
    }
    catch (error) {
        await fs.unlink(localFilePath).catch(() => { });
        const message = error instanceof Error
            ? error.message
            : "Unknown Cloudinary upload error";
        console.error("Cloudinary upload error:", message);
        return null;
    }
};
/* ======================================================
   DELETE
====================================================== */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    if (!publicId)
        return null;
    try {
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        if (response.result !== "ok") {
            console.warn("Cloudinary delete response:", response);
        }
        return response;
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unknown Cloudinary delete error";
        console.error("Cloudinary delete error:", message);
        return null;
    }
};
