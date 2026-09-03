import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewars.js";
import {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
} from "../controllers/subscriptions.controllers.js";

const router = Router();

router.route("/subscribe/:channelId").patch(verifyJWT, toggleSubscription);
router.route("/get-channels-subs/:channelId").get(getUserChannelSubscribers);
router.route("/get-subs/:subscriberId").get(verifyJWT, getSubscribedChannels);

export default router;
