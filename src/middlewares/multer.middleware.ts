import multer, {
  StorageEngine,
  FileFilterCallback,
} from "multer"
import path from "path"
import { Request } from "express"

/* =========================
   STORAGE CONFIG
========================= */

const storage: StorageEngine = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb
  ): void => {
    cb(null, "./public/temp")
  },

  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb
  ): void => {
    const ext = path.extname(file.originalname)
    const name = `${Date.now()}-${file.fieldname}${ext}`
    cb(null, name)
  },
})

/* =========================
   FILE FILTER
========================= */

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"))
  }
}

/* =========================
   EXPORT
========================= */

export const upload = multer({
  storage,
  fileFilter,
})