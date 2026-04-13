import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: String,
  password: String,
  uploadedDocs: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.User ||
  mongoose.model("User", UserSchema);