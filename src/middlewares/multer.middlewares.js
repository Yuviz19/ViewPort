import path from "path";
import multer from "multer";
import { ApiError } from "../utils/api_error.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/tmp");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/mpeg",
    "application/octet-stream", // Allow client fallback stream
  ];

  const allowedExtensions = /jpeg|jpg|png|gif|mp4|webm|mov|avi|mpeg/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  );
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "file types not allowed"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});
