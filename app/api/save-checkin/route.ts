import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";

function normalizeMobile(input: string): string {
  const digits = String(input).replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { mobile, q1, q2, q3, q4, q5, q6, q7, q8, q9 } = body ?? {};

    if (!mobile) {
      return Response.json(
        { success: false, message: "Mobile number is required." },
        { status: 400 }
      );
    }

    const cleanMobile = normalizeMobile(String(mobile));

    const q1v = Number(q1);
    const q2v = Number(q2);
    const q3v = Number(q3);
    const q5v = Number(q5);
    const q6v = Number(q6);
    const q7v = Number(q7);
    const q8v = Number(q8);

    if (
      ![1, 2, 3, 4, 5].includes(q1v) ||
      ![1, 2, 3, 4, 5].includes(q2v) ||
      ![1, 2, 3, 4, 5].includes(q3v) ||
      ![1, 2, 3, 4, 5].includes(q5v) ||
      ![1, 2, 3, 4, 5].includes(q6v) ||
      ![1, 2, 3, 4, 5].includes(q7v) ||
      ![1, 2, 3, 4, 5].includes(q8v)
    ) {
      return Response.json(
        { success: false, message: "Ratings must be between 1 and 5." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      return Response.json(
        { success: false, message: "User not found." },
        { status: 404 }
      );
    }

    user.checkInAnswers = {
      q1: q1v,
      q2: q2v,
      q3: q3v,
      q4: String(q4 ?? "").trim(),
      q5: q5v,
      q6: q6v,
      q7: q7v,
      q8: q8v,
      q9: String(q9 ?? "").trim(),
      submittedAt: new Date(),
    };

    await user.save();

    return Response.json({ success: true });
  } catch (err) {
    console.error("[save-checkin error]", err);
    return Response.json(
      { success: false, message: "Internal server error." },
      { status: 500 }
    );
  }
}
