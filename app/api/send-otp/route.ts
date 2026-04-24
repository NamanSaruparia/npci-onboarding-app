import { connectDB } from "@/app/lib/mongodb";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
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

    if (!user || !user.isAllowed) {
      return Response.json(
        { message: "You are not authorized for onboarding" },
        { status: 403 }
      );
    }

    const otp = process.env.DUMMY_OTP ?? "000000";
    const otpExpiry = new Date(Date.now() + 30 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    console.log(`[OTP-DEMO] ${cleanMobile}: ${otp}`);

    return Response.json({ success: true });
  } catch (err) {
    console.error("[API ERROR]", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
