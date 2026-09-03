import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/users.models.js";
import { Subscription } from "../models/subscriptions.models.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const sub = await Subscription.find({
    subscriber: new mongoose.Types.ObjectId(req.user?._id),
    channel: new mongoose.Types.ObjectId(channelId)
  });

  if (sub.subscriber !== req.user?._id) {
    throw new ApiError(400, "User not allowed to configure");
  }

  if (!sub) {
    const newSub = await Subscription.create({
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      channel: new mongoose.Types.ObjectId(channelId)
    });

    await newSub.populate('subscriber', "username avatar");
    await newSub.populate('channel', "username avatar");
  } else {
    const deleteSub = await Subscription.findOneAndDelete({
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      channel: new mongoose.Types.ObjectId(channelId)
    })

    if (!deleteSub) {
      return res
        .status(200)
        .json(new ApiResponse(
          200,
          {},
          "Removed subscription successfully"
        ));
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      newSub,
      "Added subsciption successfully"
    ));
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subs = await Subscription.find({
    channel: new mongoose.Types.ObjectId(channelId)
  })

  if (!subs.length) {
    throw new ApiError(400, "No channel found");
  }

  await subs.populate('subscriber', "username avatar");
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      subs,
      "Subscribers found successfully"
    ))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (subscriberId !== req.user?._id) {
    throw new ApiError(400, "You are not authorized to do this task");
  }

  const subs = await Subscription.find({
    subscriber: new mongoose.Types.ObjectId(subscriberId),
  }).populate('channel', "username avatar");

  if (!subs.length) {
    throw new ApiError(400, "Unable to fetch the list");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      subs,
      "Subscriptions list fetched successfully"
    ));
})

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels
};
