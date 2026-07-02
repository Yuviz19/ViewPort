import mongoose from "mongoose";

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("Unable to connect to MongoDB: ", err);
    process.exit(1);
  }
};

export default connect;
