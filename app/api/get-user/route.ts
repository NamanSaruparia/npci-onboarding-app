import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { mobile } = await req.json();

    if (!mobile) {
      return Response.json(
        { success: false, message: "Mobile required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ mobile });

    return Response.json({ success: true, user });
  } catch (err) {
    console.error("GET USER ERROR:", err);

    return Response.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}