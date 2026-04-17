import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const { mobile } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile: cleanMobile });

    if (!user) {
      return Response.json({ message: "User not found." }, { status: 404 });
    }

    user.isAllowed = !user.isAllowed;
    await user.save();

    return Response.json({
      success: true,
      user: {
        id: user._id,
        mobile: user.mobile,
        isAllowed: user.isAllowed,
        isVerified: user.isVerified,
        uploadedDocs: user.uploadedDocs,
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
