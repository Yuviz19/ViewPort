import mongoose from "mongoose";
import { Video } from "../models/videos.models";
import { Like } from "../models/likes.models.js";
import { Subscription } from "../models/subscriptions.models.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  // getting total number of videos and hence the total views
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalVideos: {
          $sum: 1
        },
        totalViews: {
          $sum: "$views"
        }
      }
    },
  ])

  if (!videoStats) {
    throw new ApiError(400, "Unable to fetch video details");
  }

  const likeStats = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $groupBy: {
        _id: null,
        totalLike: {
          $sum: 1
        }
      }
    }
  ]);

  if (!likeStats) {
    throw new ApiError(400, "Unable to fetch like details");
  }

  const subStats = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $groupBy: {
        _id: 1,
        totalLike: {
          $sum: 1
        }
      }
    }
  ]);

  if (!subStats) {
    throw new ApiError(400, "Unable to fetch subscriber stats");
  }

  return res
    .stats(200)
    .json(new ApiResponse(
      200,
      { videoStats, likeStats, subStats },
      "Channel details fetched successfully"
    ));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;
  const pageNumber = Math.max(1, Number(page));
  const limitNumber = Math.max(1, Number(limit));
  const skip = (pageNumber - 1) * limitNumber;

  const matchStage = {
    isPublished: true
  };

  if (userId) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  if (query?.trim()) {
    matchStage.$or = [
      {
        title: {
          $regex: query.trim(),
          $options: "i"
        }
      },
      {
        description: {
          $regex: query.trim(),
          $options: "i"
        }
      }
    ];
  }

  const videos = await Video.aggregate(
    [
      {
        $match: matchStage
      },
      {
        $facet: {
          metadata: [
            {
              $count: "totalViews"
            }
          ],
          videos: [
            {
              $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
              }
            },
            {
              $skip: skip
            },
            {
              $limit: limitNumber
            }
          ]
        }
      }
    ]
  );

  if (!videos?.length) {
    return res
      .status(200)
      .json(new ApiResponse(
        200,
        [],
        "No Matching results"
      ))
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      videos,
      "Results fetched successfully"
    ));
});

export {
  getChannelStats,
  getChannelVideos
};
