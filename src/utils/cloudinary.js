import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file to Cloudinary
 * @param {string} localFilePath - The local path of the file to upload
 * @returns {object|null} - Cloudinary upload response or null if failed
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    console.log("we reached cloudinary");
    if (!localFilePath) return null;
    console.log("we have something to upload");

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("upload success:", response.secure_url);

    // Delete local file asynchronously after successful upload
   await fs.unlink(localFilePath, (err) => {
      if (err) console.error("Failed to delete local file:", err);
    });

    return response;
  } catch (error) {
    // Delete local file even if upload fails
    await fs.unlink(localFilePath, (err) => {
      if (err) console.error("Failed to delete local file after error:", err);
    });
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public_id of the Cloudinary asset
 * @param {string} resourceType - Resource type (e.g. "image", "video")
 * @returns {object|null} - Cloudinary delete response or null if failed
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  try {
    if (!publicId) return null;

    console.log(`Deleting from Cloudinary: ${publicId}`);
    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (response.result === "ok") {
      console.log("Deleted successfully from Cloudinary");
    } else {
      console.warn("Cloudinary delete response:", response);
    }

    return response;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteFromCloudinary };
