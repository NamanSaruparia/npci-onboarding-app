import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";
import { sendUemApprovalNotification } from "@/app/lib/email";

export async function POST(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const { mobile, documentName, status } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!documentName || !["approved", "rejected"].includes(status)) {
      return Response.json(
        { message: "Document name and valid status are required." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile: cleanMobile });
    if (!user) {
      return Response.json({ message: "User not found." }, { status: 404 });
    }

    const docs = Array.isArray(user.documents) ? user.documents : [];
    const idx = docs.findIndex(
      (doc: { name: string }) => doc.name === documentName
    );

    if (idx < 0) {
      return Response.json({ message: "Document not found." }, { status: 404 });
    }

    docs[idx].status = status;
    user.documents = docs;
    user.uploadedDocs = docs.filter(
      (doc: { fileUrl?: string }) => Boolean(doc.fileUrl)
    ).length;
    await user.save();

    if (status === "approved") {
      const approvedAt = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "medium",
        timeStyle: "short",
      });

      sendUemApprovalNotification({
        employeeName: user.name || "Unknown",
        employeeMobile: user.mobile,
        documentName,
        approvedAt,
      }).catch((err: unknown) => {
        console.error("[Email] Failed to send UEM notification:", err);
      });
    }

    return Response.json({
      success: true,
      user: {
        mobile: user.mobile,
        documents: user.documents,
      },
    });
  } catch (err) {
    console.error("[API ERROR]", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
