import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";

type Answer = { questionId: string; answer: string };

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = (await req.json()) as {
      mobile?: string;
      assignmentId?: string;
      answers?: Answer[];
      attachmentFileId?: string;
      attachmentFileName?: string;
    };

    const mobile = String(body.mobile || "").trim();
    const assignmentId = String(body.assignmentId || "").trim();
    const answers = Array.isArray(body.answers) ? body.answers : [];

    if (!mobile || !assignmentId) {
      return Response.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const normalizedAnswers = answers
      .map((a) => ({
        questionId: String(a.questionId || "").trim(),
        answer: String(a.answer || ""),
      }))
      .filter((a) => a.questionId.length > 0);

    const user = await User.findOne({ mobile });
    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    user.miniAssignmentSubmission = {
      assignmentId,
      answers: normalizedAnswers,
      attachmentFileId: String(body.attachmentFileId || ""),
      attachmentFileName: String(body.attachmentFileName || ""),
      submittedAt: new Date(),
    };

    await user.save();

    return Response.json({ success: true });
  } catch (err) {
    console.error("[MINI ASSIGNMENT SUBMIT ERROR]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

