import { connectDB } from "@/app/lib/mongodb";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile, otp } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !otp || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Mobile number and OTP are required." },
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

    if (!user.otp || !user.otpExpiry) {
      return Response.json({ message: "OTP not found. Request a new OTP." }, { status: 400 });
    }

    if (new Date(user.otpExpiry).getTime() < Date.now()) {
      return Response.json({ message: "OTP has expired. Please request again." }, { status: 400 });
    }

    if (user.otp !== String(otp).trim()) {
      return Response.json({ message: "Invalid OTP." }, { status: 401 });
    }

    user.isVerified = true;
    user.otp = "";
    user.otpExpiry = undefined;
    await user.save();

    return Response.json({
      success: true,
      user: {
        id: user._id,
        mobile: user.mobile,
        isVerified: user.isVerified,
        isAllowed: user.isAllowed,
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
