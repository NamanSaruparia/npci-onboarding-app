import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fileUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const BuddyAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: String, default: "" },
  },
  { _id: false }
);

const CheckInAnswersSchema = new mongoose.Schema(
  {
    q1: { type: Number, default: 0, min: 0, max: 5 },
    q2: { type: Number, default: 0, min: 0, max: 5 },
    q3: { type: Number, default: 0, min: 0, max: 5 },
    q4: { type: String, default: "" },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: "",
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  position: {
    type: String,
    trim: true,
    default: "",
  },
  role: {
    type: String,
    trim: true,
    default: "",
  },
  location: {
    type: String,
    enum: ["Hyderabad", "Mumbai", "Chennai", ""],
    default: "",
  },
  profileImageUrl: {
    type: String,
    default: "",
  },
  isAllowed: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    default: "",
  },
  otpExpiry: Date,
  documents: {
    type: [DocumentSchema],
    default: [],
  },
  uploadedDocs: {
    type: Number,
    default: 0,
  },
  onboardingKit: {
    type: [String],
    default: [],
  },
  buddyAnswers: {
    type: [BuddyAnswerSchema],
    default: [],
  },
  checkInAnswers: {
    type: CheckInAnswersSchema,
    default: null,
  },
}, {
  timestamps: true,
});

const ExistingUserModel = mongoose.models.User as mongoose.Model<any> | undefined;

// In dev, hot reload may cache an older schema; recreate if any key path is missing.
if (
  ExistingUserModel &&
  (!ExistingUserModel.schema.path("documents") ||
    !ExistingUserModel.schema.path("buddyAnswers") ||
    !ExistingUserModel.schema.path("checkInAnswers"))
) {
  delete (mongoose.models as Record<string, unknown>).User;
}

export default (mongoose.models.User as mongoose.Model<any>) ||
  mongoose.model("User", UserSchema);