import mongoose from "mongoose";

type DocStatus = "pending" | "approved" | "rejected";
type EmployeeType = "fresher" | "lateral";
type Entity = "NPCI" | "NBBL" | "NIPL" | "NBSL";
type Band = "B1" | "B2";
type Location = "Hyderabad" | "Mumbai" | "Chennai" | "";

interface IUserDocument {
  docId?: string;
  name: string;
  fileUrl?: string;
  status: DocStatus;
  uploadedAt?: Date;
}

interface IBuddyAnswer {
  questionId: string;
  answer: string;
}

interface ICheckInAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: string;
  submittedAt?: Date;
}

export interface IUser {
  name: string;
  mobile: string;
  position: string;
  role: string;
  location: Location;
  profileImageUrl: string;
  employeeType: EmployeeType;
  entity: Entity;
  band: Band;
  reportingManager: string;
  isAllowed: boolean;
  isVerified: boolean;
  otp: string;
  otpExpiry?: Date;
  documents: IUserDocument[];
  uploadedDocs: number;
  onboardingKit: string[];
  buddyAnswers: IBuddyAnswer[];
  isAdmin: boolean;
  checkInAnswers: ICheckInAnswers | null;
}

const DocumentSchema = new mongoose.Schema(
  {
    docId: {
      type: String,
      trim: true,
      default: "",
    },
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

const UserSchema = new mongoose.Schema<IUser>({
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
  employeeType: {
    type: String,
    enum: ["fresher", "lateral"],
    default: "fresher",
  },
  entity: {
    type: String,
    enum: ["NPCI", "NBBL", "NIPL", "NBSL"],
    default: "NPCI",
  },
  band: {
    type: String,
    enum: ["B1", "B2"],
    default: "B1",
  },
  reportingManager: {
    type: String,
    trim: true,
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
  isAdmin: {
    type: Boolean,
    default: false,
  },
  checkInAnswers: {
    type: CheckInAnswersSchema,
    default: null,
  },
}, {
  timestamps: true,
});

const ExistingUserModel = mongoose.models.User as
  | mongoose.Model<IUser>
  | undefined;

// In dev, hot reload may cache an older schema; recreate if any key path is missing.
if (
  ExistingUserModel &&
  (!ExistingUserModel.schema.path("documents") ||
    !ExistingUserModel.schema.path("documents.docId") ||
    !ExistingUserModel.schema.path("buddyAnswers") ||
    !ExistingUserModel.schema.path("checkInAnswers") ||
    !ExistingUserModel.schema.path("isAdmin") ||
    !ExistingUserModel.schema.path("employeeType") ||
    !ExistingUserModel.schema.path("entity") ||
    !ExistingUserModel.schema.path("band") ||
    !ExistingUserModel.schema.path("reportingManager"))
) {
  delete (mongoose.models as Record<string, unknown>).User;
}

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;