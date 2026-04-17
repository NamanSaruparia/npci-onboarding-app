import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import User from "@/app/models/User";

export async function GET(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select("name mobile position role location profileImageUrl isAllowed isVerified uploadedDocs documents buddyAnswers checkInAnswers createdAt updatedAt");

    return Response.json({ success: true, users });
  } catch (err) {
    console.error("[API ERROR]", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
