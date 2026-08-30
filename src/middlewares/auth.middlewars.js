import jwt from "jsonwebtoken";
import { User } from "../models/users.models,js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/api_response.js";
import { asyncHandler } from "../utils/async_handler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.AT_SECRET);
    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(404, "Unable to find user");
    }

    req.user = user;
    next();
  } catch (err) {
    throw new ApiError(400, "Unauthorized || Invalid Access Token")
  }
})
