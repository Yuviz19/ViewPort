import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewars.js";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
} from "../controllers/comments.controllers.js";

const router = Router();
router.use(verifyJWT);
router.route("/get-comments/:videoId").get(getVideoComments);
router.route("/add-comment/:videoId").post(addComment);
router.route("/update-comment/:commentId").patch(updateComment);
router.route("/delete-comment/:commentId").delete(deleteComment);

export default router;
