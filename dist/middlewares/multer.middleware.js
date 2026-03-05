import multer from "multer";
import path from "path";
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, "./public/temp");
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${file.fieldname}${ext}`;
        cb(null, name);
    },
});
const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    }
    else {
        cb(new Error("Only image files are allowed"));
    }
};
export const upload = multer({
    storage,
    fileFilter,
});
