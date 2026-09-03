import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloud } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
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

// secure route required
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (
    [title, description].some(
      (feild) => !feild || feild.trim() === ""
    )
  ) {
    throw new ApiError(400, "All feilds are required");
  }

  const vidFilePath = req.files?.video?.[0]?.path;
  const thumbnailPath = req.files?.thumbnail?.[0].path;

  if (!vidFilePath) {
    throw new ApiError(400, "Viedeo file is required")
  }

  const video = await uploadOnCloud(vidFilePath);

  if (!thumbnailPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  const thumbnail = await uploadOnCloud(thumbnailPath);

  if (!video || !thumbnail) {
    throw new ApiError(400, "Unable to upload video or thumbnail to cloud")
  }

  try {
    const vid = await Video.create({
      owner: req.user?._id,
      videoFile: video.url,
      thumbnail: thumbnail.url,
      title,
      description,
      duration: video?.duration,
    });
  } catch (error) {
    throw new ApiError(400, "Unable to create video metatdata to the database");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      vid,
      "Video uploaded successfully"
    ));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const vid = await Video.findById(videoId)
    .populate("owner", "username fullname avatar");

  if (!vid) {
    throw new ApiError(400, "Unable to fetch video")
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      vid,
      "Video fetched successfully"
    ));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { newTitle, newDescription } = req.body;
  const newThumbnailPath = req.file?.path;

  const videoFile = await Video.findById(videoId);
  if (!videoFile) {
    throw new ApiError(400, "Unable to find the video")
  }

  if (videoFile.owner !== req.user?._id) {
    throw new ApiError(400, "You are not supposed to update this")
  }

  if (newTitle) {
    const title = newTitle;
  }

  if (newDescription) {
    const description =  newDescription;
  }

  if (newThumbnailPath) {
    const thumbnail = await uploadOnCloud(newThumbnailPath);
    if (!thumbnail) {
      throw new ApiError(400, "Unable to upload the video to cloud")
    }
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url
      }
    },
    {
      new: true
    }
  );

  if (!updatedVideo) {
    throw new ApiError(400, "Unable to update the video metadata to database")
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      updatedVideo,
      "Video data updated successfully"
    ));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const videoFile = await Video.findById(videoId);
  if (!videoFile) {
    throw new ApiError(400, "Unable to find the video")
  }

  if (videoFile.owner !== req.user?._id) {
    throw new ApiError(400, "You are not supposed to update this")
  }

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(400, "Unable to delete this video")
  }

  return res
    .status(200)
    .json(new ApiError(
      200,
      {},
      "Video deleted successfully"
    ));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const vid = await Video.findById(videoId);

  if (videoFile.owner !== req.user?._id) {
    throw new ApiError(400, "You are not supposed to update this")
  }

  if (!vid) {
    throw new ApiError(400, "Unable to find the Video")
  }

  vid.isPublished = !vid.isPublished;
  await vid.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "Video publish status has been flipped"
    ));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
