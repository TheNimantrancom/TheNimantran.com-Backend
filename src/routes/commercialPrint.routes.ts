import { Router } from "express"
import {
  getAllPrintTypes,
  getPrintTypeBySlug,
  createCommercialPrintOrder,
  uploadPrintFile,
} from "../controllers/commercialPrint.controller.js"

// Import your existing auth middleware if you have one
// import { protect } from "../middlewares/auth.middleware.js"

const router = Router()

/**
 * @route   GET /api/commercial-prints
 * @desc    Get all active print types
 * @access  Public
 */
router.get("/", getAllPrintTypes)

/**
 * @route   POST /api/commercial-prints/upload
 * @desc    Get presigned S3 URL for design file upload
 * @access  Private
 */
router.post("/upload", /* protect, */ uploadPrintFile)

/**
 * @route   POST /api/commercial-prints/order
 * @desc    Create a new commercial print order
 * @access  Private
 */
router.post("/order", /* protect, */ createCommercialPrintOrder)

/**
 * @route   GET /api/commercial-prints/:slug
 * @desc    Get a print type by slug
 * @access  Public
 * NOTE: Keep this last to avoid catching "upload" or "order" as slugs
 */
router.get("/:slug", getPrintTypeBySlug)

export default router