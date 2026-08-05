import mongoose, { Schema } from "mongoose";

commentSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    vidio: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Comment = mongoose.model("Comment", commentSchema);
