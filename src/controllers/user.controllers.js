import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { User } from "../models/users.models.js";
import jwt from "jsonwebtoken";
import { uploadOnCloud, deleteFromCloudinary } from "../utils/cloudinary.js";

const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found!");
    }

    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;

    user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };
  } catch (err) {
    throw new ApiError(
      400,
      "Something went wrong while generating Access or Refresh Token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some(
      (field) => !field || field.trim() === "",
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const ifExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (ifExists) {
    throw new ApiError(400, "User with email or username already exists");
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloud(avatarLocalPath);

  // Check if Cloudinary upload actually succeeded
  if (!avatar) {
    throw new ApiError(500, "Avatar upload to cloud failed");
  }

  let coverImage = null;
  if (coverLocalPath) {
    coverImage = await uploadOnCloud(coverLocalPath);
  }

  try {
    const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken -watchHistory",
    );

    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user",
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (err) {
    console.log("User Creation failed");
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while creating the user, and images were deleted!",
    );
  }
});

const userLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    throw new ApiError(400, "Email is Required");
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new ApiError(400, "User not found!");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Password Invalid");
  }

  const { accessToken, refreshToken } = await generateAccessRefreshTokens(
    user._id,
  );
  const loggedinUser = await User.findById(user._id).select(
    "-passsword -refreshToken",
  );

  if (!loggedinUser) {
    throw new ApiError(400, "Unable to find the User!");
  }

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedinUser,
          accessToken,
          refreshToken,
        },
        "User logged-in successfully!",
      ),
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh Token is Expired");
  }
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.RT_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "Unable to find User");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(404, "Invalid Refresh Token");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    }

    const { refreshToken: newRefreshToken, accessToken } = await generateAccessRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(
        200,
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        "access token have been refreshed"
      ))
  } catch {
    throw new ApiError(500, "Something went wrong while refreshing access token");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    { new: true }
  )

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(
      200,
      {},
      "User Logged Out successfully",
    ))
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);

  const isPasswordValid = user.isPasswordCorrect(oldpassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Old passsword is not correct");
  }

  user.password = newPassword; // auto encrypt using the pre-hooks

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Updated the Password",
      )
    )
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(
      200,
      req.user,
      "Current User Details"
    ))
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "Fullname and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email
      }
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(400, "User not found!")
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      user,
      "User updated successfully"
    ));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarFilePath = req.file?.path;
  if (!avatarFilePath) {
    throw new ApiError(400, "File is required");
  }

  const avatar = await uploadOnCloud(avatarFilePath);

  if (!avatar.url) {
    throw new ApiError(400, "Something went wrong while updating the image");
  }

  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      }
    },
    {new: true}
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      user,
      "Updated user avatar"
    ));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverFilePath = req.file?.path;
  if (!coverFilePath) {
    throw new ApiError(400, "File is required");
  }

  const cover = await uploadOnCloud(coverFilePath);

  if (!cover.url) {
    throw new ApiError(400, "Something went wrong while uploading the image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: cover.url,
      }
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      user,
      "Updated user cover image"
    ));
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const history = await User.aggregate(
    [
      {
        $match: {
          username: username?.toLowerCase()
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subsciber",
          as: "subscribedTo"
        }
      },
      {
        $addFields: {
          subscriberCount: {
            $size: "subscribers"
          },
          channelsSubscribedTo: {
            $size: "subscribedTo"
          }
        }
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          email: 1,
          avatar: 1,
          coverImage: 1,
          subscriberCount: 1,
          channelsSubscribedTo: 1
        }
      }
    ]
  );

  if (!history?.lenght) {
    throw new ApiError(400, "Channel Not Found");
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      history[0],
      "Channel Profile Fetched Successfully"
    ));
});

const getWatchHistory = asyncHandler(async (req, res) => { });

export {
  registerUser,
  userLogin,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage
};
