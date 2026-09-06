import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewars.js";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
} from "../controllers/drops.controllers.js";

const router = Router();

router.use(verifyJWT);
router.route("/droplets")
  .post(createTweet)
  .get(getUserTweets);
router.route("/update-drop/:dropId").patch(updateTweet);
router.route("/delete-drop/:dropId").delete(deleteTweet);

export default router;
