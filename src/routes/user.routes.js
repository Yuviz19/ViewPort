import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewars.js";
import { registerUser, userLogin, refreshAccessToken, logoutUser } from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);

router.route("/login").post(userLogin);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
