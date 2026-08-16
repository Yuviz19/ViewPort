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

const filefilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "video/mp4", // .mp4
    "video/webm", // .webm
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/mpeg",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, "file types not allowed"), false);
  }
};

export const upload = multer({
  storage: storage,
  fileFilter: filefilter,
  limits: 100 * 1024 * 1024, // 100mb (this is not a good practice)
});
