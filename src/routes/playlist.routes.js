import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewars,js";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
} from "../controllers/playlists.controllers.js";

const router = Router();

router.use(verifyJWT);
router.route("/")
  .post(createPlaylist)
  .get(getUserPlaylists);

router.route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.route("/:playlistId/:videoId")
  .patch(addVideoToPlaylist)
  .delete(removeVideoFromPlaylist);

export default router;
