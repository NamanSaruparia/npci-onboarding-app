import { connectDB } from "@/app/lib/mongodb";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, answers } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!Array.isArray(answers)) {
      return Response.json(
        { message: "answers must be an array." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      return Response.json({ message: "User not found." }, { status: 404 });
    }

    user.buddyAnswers = answers.map((a: { questionId: string; answer: string }) => ({
      questionId: String(a.questionId || ""),
      answer: String(a.answer || "").trim(),
    }));

    await user.save();

    return Response.json({ success: true, buddyAnswers: user.buddyAnswers });
  } catch (err) {
    console.error("[API ERROR]", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
