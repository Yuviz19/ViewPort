import mongoose, { isValidObjectId } from "mongoose";
import { Drop } from "../models/drops.models.js";
import { User } from "../models/users.models.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

const createTweet = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content for the drop is required");
  }

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const drop = await Drop.create({
    owner: new mongoose.Types.ObjectId(userId),
    content
  });

  await drop.populate("owner", "username avatar");

  if (!drop) {
    throw new ApiError(400, "Unable to create the drop");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      drop,
      "Created drop successfully"
    ));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  const drop = await Drop.find({
    onwer: new mongoose.Types.ObjectId(userId)
  })

  if (!drop.length) {
    throw new ApiError(400, "Unable to fetch drops");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      drop,
      "User drops fetched successfully"
    ));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { dropId } = req.params;
  const { content } = req.body;
  const userId = req.user?._id;
  if (!isValidObjectId(userId) || !isValidObjectId(dropId)) {
    throw new ApiError(400, "Invalid user or drop id");
  }

  if (!content) {
    throw new ApiError(400, "Content for the drop is required");
  }

  const drop = await Drop.findByIdAndUpdate(
    new mongoose.Types.ObjectId(dropId),
    { content },
    { new: true }
  ).populate("owner", "username avatar");

  if (!drop) {
    throw new ApiError(400, "Unable to update drop");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      drop,
      "drop updated successfully"
    ));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { dropId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(userId) || !isValidObjectId(dropId)) {
    throw new ApiError(400, "Invalid user or drop id");
  }

  const drop = await Drop.findById(
    new mongoose.Types.ObjectId(dropId)
  );

  if (!drop) {
    throw new ApiError(400, "Unable to fetch the drop");
  }

  if (drop.owner !== userId) {
    throw new ApiError(400, "Restricted from doing this task");
  }

  const delDrop = await Drop.findByIdAndDelete(userId);
  if (!delDrop) {
    throw new ApiError(400, "Unable to delete the drop");
  }

  return res
    .status(400)
    .json(new ApiResponse(
      200,
      {},
      "drop deleted successfully"
    ));
});

export {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet
};
