import { connectDB } from "@/app/lib/mongodb";
import { goalFirstDraftDueIso, parseJoiningIso } from "@/app/lib/onboarding-dates";
import User from "@/app/models/User";

type Question = {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
};

type MiniAssignmentConfig = {
  assignmentId: string;
  title: string;
  priority: "Low" | "Medium" | "High";
  context: string;
  dueOnISO: string;
  questions: Question[];
};

function defaultConfig(): MiniAssignmentConfig {
  return {
    assignmentId: "mini-assignment-001",
    title: "Mini Assignment",
    priority: "High",
    context: "",
    dueOnISO: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: "response",
        label: "Your response",
        placeholder: "Type your response here…",
        rows: 10,
      },
    ],
  };
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { mobile } = (await req.json()) as { mobile?: string };
    if (!mobile) {
      return Response.json({ success: false, message: "Mobile required" }, { status: 400 });
    }

    const user = await User.findOne({ mobile }).select(
      "mobile dayOfJoining miniAssignmentConfig miniAssignmentSubmission",
    );
    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const cfg = (user.miniAssignmentConfig as MiniAssignmentConfig | null) || defaultConfig();

    // Hide legacy defaults (so users don't see old long text/title unless admin customized it).
    const legacyTitle = "Leadership Entry: 30–60–90 Day Executive Brief";
    const legacyContext =
      "This mini assignment is designed for leadership hires. Keep it crisp and decision-oriented. Prioritize outcomes, clarify your operating rhythm, and call out risks/dependencies and support needed. Use bullets where possible.";

    const joiningIso = parseJoiningIso(user.dayOfJoining);
    const dueFromJoin = joiningIso ? goalFirstDraftDueIso(joiningIso) : null;

    const sanitized: MiniAssignmentConfig = {
      ...cfg,
      title: cfg.title === legacyTitle ? "Mini Assignment" : cfg.title,
      context: cfg.context === legacyContext ? "" : cfg.context,
      dueOnISO: dueFromJoin
        ? dueFromJoin.toISOString()
        : cfg.dueOnISO && String(cfg.dueOnISO).trim()
          ? String(cfg.dueOnISO).trim()
          : defaultConfig().dueOnISO,
    };

    return Response.json({
      success: true,
      config: sanitized,
      submission: user.miniAssignmentSubmission || null,
    });
  } catch (err) {
    console.error("[MINI ASSIGNMENT GET ERROR]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

