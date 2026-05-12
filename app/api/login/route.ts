import { connectDB } from "@/app/lib/mongodb";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile) {
      return Response.json(
        { message: "Mobile number is required." },
        { status: 400 }
      );
    }

    if (!isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile: cleanMobile });

    if (!user || !user.isAllowed) {
      return Response.json(
        { message: "You are not authorized for onboarding" },
        { status: 403 }
      );
    }

    if (!user.isVerified) {
      return Response.json(
        { message: "Verify OTP to continue." },
        { status: 401 }
      );
    }

    return Response.json({
      success: true,
      user: {
        id: user._id,
        name: user.name || "",
        mobile: user.mobile,
        position: user.position || "",
        location: user.location || "",
        profileImageUrl: user.profileImageUrl || "",
        uploadedDocs: user.uploadedDocs ?? 0,
        isAllowed: user.isAllowed,
        isVerified: user.isVerified,
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