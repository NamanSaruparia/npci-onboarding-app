import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import User from "@/app/models/User";

type Question = {
  id: string;
  label: string;
  placeholder: string;
  rows: number;
};

export async function POST(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const body = (await req.json()) as {
      mobile?: string;
      config?: {
        assignmentId?: string;
        title?: string;
        priority?: "Low" | "Medium" | "High";
        context?: string;
        dueOnISO?: string;
        questions?: Question[];
      };
    };

    const mobile = String(body.mobile || "").trim();
    if (!mobile) {
      return Response.json({ success: false, message: "Mobile required" }, { status: 400 });
    }

    const cfg = body.config || {};
    const assignmentId = String(cfg.assignmentId || "mini-assignment-001").trim() || "mini-assignment-001";
    const title = String(cfg.title || "").trim();
    const context = String(cfg.context || "").trim();
    const dueOnISO = String(cfg.dueOnISO || "").trim();
    const priority = (cfg.priority === "Low" || cfg.priority === "Medium" || cfg.priority === "High")
      ? cfg.priority
      : "High";

    const questions = Array.isArray(cfg.questions) ? cfg.questions : [];
    const normalizedQuestions = questions
      .map((q) => ({
        id: String(q.id || "").trim(),
        label: String(q.label || "").trim(),
        placeholder: String(q.placeholder || "").trim(),
        rows: Math.max(2, Math.min(18, Number(q.rows || 4))),
      }))
      .filter((q) => q.id.length > 0 && q.label.length > 0);

    const user = await User.findOne({ mobile });
    if (!user) {
      return Response.json({ success: false, message: "User not found" }, { status: 404 });
    }

    user.miniAssignmentConfig = {
      assignmentId,
      title,
      priority,
      context,
      dueOnISO,
      questions: normalizedQuestions,
      updatedAt: new Date(),
    };

    await user.save();

    return Response.json({ success: true, config: user.miniAssignmentConfig });
  } catch (err) {
    console.error("[ADMIN MINI ASSIGNMENT UPDATE ERROR]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

