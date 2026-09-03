import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewars.js";
import {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
} from "../controllers/videos.controllers.js";

const router = Router();

// unsecured routes

router.route("/get-videos").get(getAllVideos);
router.route("/get-video/:videoId").get(getVideoById);

// secured routes
router.route("/publish-video").post(
  verifyJWT,
  upload.fields([
    {
      name: "video",
      maxCount: 1
    },
    {
      name: "thumbnail",
      maxCount: 1
    }
  ]),
  publishAVideo
);
router.route("/update-video/:videoId").patch(
  verifyJWT,
  upload.single("thumbnail"),
  updateVideo
);
router.route("/delete-video/:videoId").delete(
  verifyJWT,
  deleteVideo
);
router.route("/toggle-publish/:videoId").patch(
  verifyJWT,
  togglePublishStatus
);

export default router;
