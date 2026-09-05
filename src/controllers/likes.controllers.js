import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likes.models.js";
import { Video } from "../models/videos.models.js";
import { Comment } from "../models/comments.models.js";
import { Drop } from "../models/drops.models.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const like = await Like.findOne({
    video: new mongoose.Types.ObjectId(videoId)
  });

  if (like) {
    if (like?._id !== req.user?._id) {
      throw new ApiError(400, "Restricted from performing this task");
    }
    const delLike = await Like.findByIdAndDelete(like?._id);
    if (!delLike) {
      throw new ApiError(400, "Unable to toggle Like");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "Toggled like successfully"
      ));
  } else {
    const like = await Like.create({
      video: new mongoose.Types.ObjectId(videoId)
    })

    if (!like) {
      throw new ApiError(400, "Error while generating the like");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "Like Toggled successfully"
      ));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }

  const like = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId)
  });

  if (like) {
    if (like?._id !== req.user?._id) {
      throw new ApiError(400, "Restricted from performing this task");
    }
    const delLike = await Like.findByIdAndDelete(like?._id);
    if (!delLike) {
      throw new ApiError(400, "Unable to toggle Like");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "Toggled like successfully"
      ));
  } else {
    const like = await Like.create({
      video: new mongoose.Types.ObjectId(commentId)
    });

    if (!like) {
      throw new ApiError(400, "Error while generating the like");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "Like Toggled successfully"
    ));
  }
});

const toggleDropLike = asyncHandler(async (req, res) => {
  const { dropId } = req.params;
  if (!isValidObjectId(dropId)) {
    throw new ApiError(400, "Invalid tweet Id");
  }

  const like = await Like.findOne({
    drop: new mongoose.Types.ObjectId(dropId)
  });

  if (like) {
    if (like?._id !== req.user?._id) {
      throw new ApiError(400, "Restricted from performing this task");
    }
    const delLike = await Like.findByIdAndDelete(like?._id);
    if (!delLike) {
      throw new ApiError(400, "Unable to toggle Like");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "Toggled like successfully"
      ));
  } else {
    const like = await Like.create({
      video: new mongoose.Types.ObjectId(dropId)
    });

    if (!like) {
      throw new ApiError(400, "Error while generating the like");
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {},
        "Like Toggled successfully"
    ));
  }
});

export {
  toggleCommentLike,
  toggleDropLike,
  toggleVideoLike,
};
