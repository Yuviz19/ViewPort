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
      secure: process.env.NODE_ENV,
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

})

export { registerUser, userLogin, refreshAccessToken };
