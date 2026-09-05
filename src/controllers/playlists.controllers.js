import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlists.models.js";
import { User } from "../models/users.models.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description = "" } = req.body;
  if (!name) {
    throw new ApiError(400, "Playlist name is required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    videos: [],
    owner: new mongoose.Types.ObjectId(req.user?._id)
  });

  if (!playlist) {
    throw new ApiError(400, "Unable to create the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      playlist,
      "Playlist created successfully"
    ));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.user?._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const playlist = await Playlist.find({
    owner: new mongoose.Types.ObjectId(userId)
  });

  if (!playlist) {
    throw new ApiError(400, "Unable to fetch Playlists");
  }

  const user = await User.findById(userId) || "User info";

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {user, playlist},
      "Playlists fetched successfully"
    ));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $project: {
              title: 1,
              videoFile: 1,
              thumnail: 1,
              duration: 1
            }
          },
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                  }
                }
              ]
            }
          }
        ]
      }
    }
  ]);

  if (!playlist.length) {
    throw new ApiError(400, "Unable to fetch Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      playlist,
      "Playlist fetched successfully"
    ));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: {
        videos: videoId
      }
    },
    {
      new: true
    }
  );

  if (!playlist) {
    throw new ApiError(400, "Unable to add video to playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      playlist,
      "Video added to playlist successfully"
    ));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video id");
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: {
        videos: videoId
      }
    },
    {
      new: true
    }
  );

  if (!playlist) {
    throw new ApiError(400, "Unable to delete video from playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      playlist,
      "Playlist updated successfully"
    ));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist id");
  }

  const playlist = await Playlist.findByIdAndDelete(playlistId);

  if (!playlist) {
    throw new ApiError(400, "Unable to delete the Playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "Playlist Deleted Successfully"
    ));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { newName, newDescription } = req.body;

  if (!playlistId) {
    throw new ApiError(400, "Invalid playlist id");
  }

  if (newName) {
    const name = newName;
  }

  if (newDescription) {
    const description = newDescription;
  }

  const playlist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      name,
      description
    },
    { new: true }
  );

  if (!playlist) {
    throw new ApiError(400, "Unable to update the playlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      playlist,
      "Playlist updated successfully"
    ));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist
};
