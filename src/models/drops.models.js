import mongoose, { Schema } from "mongoose";

dropsSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Drop = mongoose.model("Drop", dropsSchema);
