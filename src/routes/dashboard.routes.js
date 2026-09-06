import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewars";
import {
  getChannelStats,
  getChannelVideos
} from "../controllers/dashboard.controllers.js";

const router = Router();
router.use(verifyJWT);
router.route("/channel-stats").get(getChannelStats);
router.route("/channel-vids").get(getChannelVideos);

export default router;
