import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/videos.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { page = 1, limit = 10 } = req.query
  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Number(limit));
  const skip = (pageNumber - 1) * limitNumber;

  const vidDetails = await Video.findById(videoId)
    .populate("owner", "username avatar");

  if (!vidDetails) {
    throw new ApiError(400, "Unable to fetch the video");
  }

  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId)
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
      },
    },
    {
      $skip: skip
    },
    {
      $limit: limitNumber
    }
  ]);

  if (!comments) {
    throw new ApiError(400, "Unable to find video");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      { comments, vidDetails },
      "Comments fetched successfully"
    ));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;

  if (!vid) {
    throw new ApiError(400, "Unable to find the video");
  }

  const comment = await Comment.create({
    video: new mongoose.Types.ObjectId(videoId),
    content,
    owner: new mongoose.Types.ObjectId(req.user?._id)
  });

  await comment.populate("vidoe", "owner title").populate("owner", "username")

  if (!comment) {
    throw new ApiError(400, "Unable to create comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      comment,
      "Comment added successfully"
    ));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const comment = await Comment.findByIdAndUpdate(
    new mongoose.Types.ObjectId(commentId),
    {
      content
    },
    { new: true }
  );

  if (!comment) {
    throw new ApiError(400, "Unable to update comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      comment,
      "Updated comment successfully"
    ));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const comment = await Comment.findByIdAndDelete(
    new mongoose.Types.ObjectId(commentId)
  );

  if (!comment) {
    throw new ApiError(400, "Unable to remove comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "Commment deleted successfully"
    ));
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment
};
