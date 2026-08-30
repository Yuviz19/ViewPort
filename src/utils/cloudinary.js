import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { ApiError } from "./api_error.js";

dotenv.config();

// configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloud = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("File uploaded on cloudinar file src: " + response.url);
    // following the file uploading
    // deleitng the file from the local servers
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary Detailed Error:", error);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    throw new ApiError(500, "Error while deleting assets on Cloudinary", err);
  }
};

export { uploadOnCloud, deleteFromCloudinary };
