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
  fileId?: string;
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
  q5: number;
  q6: number;
  q7: number;
  q8: number;
  q9: string;
  submittedAt?: Date;
}

interface IFeedbackSurvey {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: string;
  q6: string;
  q7: string;
  submittedAt?: Date;
}

interface IMiniAssignmentQuestion {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
}

interface IMiniAssignmentConfig {
  assignmentId: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  context: string;
  dueOnISO: string;
  questions: IMiniAssignmentQuestion[];
  updatedAt?: Date;
}

interface IMiniAssignmentAnswer {
  questionId: string;
  answer: string;
}

interface IMiniAssignmentSubmission {
  assignmentId: string;
  answers: IMiniAssignmentAnswer[];
  attachmentFileId?: string;
  attachmentFileName?: string;
  submittedAt?: Date;
}

interface IOnboardingKitDetails {
  selectedCardVariant: string;
  bankName: string;
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
  onboardingKitDetails: IOnboardingKitDetails;
  buddyAnswers: IBuddyAnswer[];
  isAdmin: boolean;
  checkInAnswers: ICheckInAnswers | null;
  feedbackSurvey: IFeedbackSurvey | null;
  miniAssignmentConfig?: IMiniAssignmentConfig | null;
  miniAssignmentSubmission?: IMiniAssignmentSubmission | null;
  /** Date of joining (set in admin); drives timelines in the app. */
  dayOfJoining?: Date | null;
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
    fileId: {
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
    q5: { type: Number, default: 0, min: 0, max: 5 },
    q6: { type: Number, default: 0, min: 0, max: 5 },
    q7: { type: Number, default: 0, min: 0, max: 5 },
    q8: { type: Number, default: 0, min: 0, max: 5 },
    q9: { type: String, default: "" },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const FeedbackSurveySchema = new mongoose.Schema(
  {
    q1: { type: Number, default: 0, min: 0, max: 5 },
    q2: { type: Number, default: 0, min: 0, max: 5 },
    q3: { type: Number, default: 0, min: 0, max: 5 },
    q4: { type: Number, default: 0, min: 0, max: 5 },
    q5: { type: String, default: "" },
    q6: { type: String, default: "" },
    q7: { type: String, default: "" },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const MiniAssignmentQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, default: "", trim: true },
    placeholder: { type: String, default: "", trim: true },
    rows: { type: Number, default: 4, min: 2, max: 18 },
  },
  { _id: false }
);

const MiniAssignmentConfigSchema = new mongoose.Schema(
  {
    assignmentId: { type: String, default: "mini-assignment-001", trim: true },
    title: { type: String, default: "", trim: true },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "High" },
    context: { type: String, default: "", trim: true },
    dueOnISO: { type: String, default: "" },
    questions: { type: [MiniAssignmentQuestionSchema], default: [] },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const MiniAssignmentSubmissionSchema = new mongoose.Schema(
  {
    assignmentId: { type: String, default: "mini-assignment-001", trim: true },
    answers: {
      type: [
        new mongoose.Schema(
          {
            questionId: { type: String, required: true, trim: true },
            answer: { type: String, default: "", trim: true },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    attachmentFileId: { type: String, default: "" },
    attachmentFileName: { type: String, default: "" },
    submittedAt: { type: Date },
  },
  { _id: false }
);

const OnboardingKitDetailsSchema = new mongoose.Schema(
  {
    selectedCardVariant: { type: String, default: "" },
    bankName: { type: String, default: "" },
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
  onboardingKitDetails: {
    type: OnboardingKitDetailsSchema,
    default: () => ({
      selectedCardVariant: "",
      bankName: "",
    }),
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
  feedbackSurvey: {
    type: FeedbackSurveySchema,
    default: null,
  },
  miniAssignmentConfig: {
    type: MiniAssignmentConfigSchema,
    default: null,
  },
  miniAssignmentSubmission: {
    type: MiniAssignmentSubmissionSchema,
    default: null,
  },
  dayOfJoining: {
    type: Date,
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
    !ExistingUserModel.schema.path("documents.fileId") ||
    !ExistingUserModel.schema.path("onboardingKitDetails") ||
    !ExistingUserModel.schema.path("buddyAnswers") ||
    !ExistingUserModel.schema.path("checkInAnswers") ||
    !ExistingUserModel.schema.path("feedbackSurvey") ||
    !ExistingUserModel.schema.path("isAdmin") ||
    !ExistingUserModel.schema.path("employeeType") ||
    !ExistingUserModel.schema.path("entity") ||
    !ExistingUserModel.schema.path("band") ||
    !ExistingUserModel.schema.path("reportingManager") ||
    !ExistingUserModel.schema.path("miniAssignmentConfig") ||
    !ExistingUserModel.schema.path("miniAssignmentSubmission") ||
    !ExistingUserModel.schema.path("dayOfJoining"))
) {
  delete (mongoose.models as Record<string, unknown>).User;
}

const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;