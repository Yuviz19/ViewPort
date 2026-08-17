import { asyncHandler } from "../utils/async_handler.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { User } from "../models/users.models.js";
import { uploadOnCloud } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const ifExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (ifExists) {
    throw new ApiError(400, "User with email already exists");
  }

  const avatarLocalPath = req.files?.avator[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadOnCloud(avatarLocalPath);

  const coverLocalPath = req?.files?.coverImage[0].path;
  let coverImage = "";
  if (coverLocalPath) {
    coverImage = await uploadOnCloud(coverLocalPath);
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowercase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -watchHistory",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };
