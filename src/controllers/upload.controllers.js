// controllers/uploadController.js
import {
  generatePresignedUploadUrl,
  generateSignedUrl,
  deleteFromS3
} from "../utils/awsS3.js";

export const getPresignedUploadUrl = async (req, res) => {
  try {
    const { fileName, fileType } = req.body;

    if (!fileName || !fileType) {
      return res.status(400).json({ message: "fileName and fileType required" });
    }

    const result = await generatePresignedUploadUrl(fileName, fileType);

    return res.status(200).json({
      uploadUrl: result.uploadUrl,
      key: result.key,    
      viewUrl: result.viewUrl, 
    });
  } catch (err) {
    console.error("Presign error:", err);
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
};
