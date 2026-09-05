import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewars.js";
import {
  toggleCommentLike,
  toggleDropLike,
  toggleVideoLike
} from "../controllers/likes.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/like-comment/:commentId").post(toggleCommentLike);
router.route("/like-drop/:dropId").post(toggleDropLike);
router.route("/like-video/:videoId").post(toggleVideoLike):

export default router;
