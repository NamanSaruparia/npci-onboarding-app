import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const { mobile, name, position, location, profileImageUrl } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    if (!name || !String(name).trim()) {
      return Response.json(
        { message: "Name is required." },
        { status: 400 }
      );
    }

    if (!position || !String(position).trim()) {
      return Response.json(
        { message: "Position is required." },
        { status: 400 }
      );
    }

    const allowedLocations = ["Hyderabad", "Mumbai", "Chennai"];
    if (!location || !allowedLocations.includes(location)) {
      return Response.json(
        { message: "Select a valid location." },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ mobile: cleanMobile });

    if (existing) {
      return Response.json(
        { message: "User already exists." },
        { status: 409 }
      );
    }

    const positionTrimmed = String(position).trim();

    const user = await User.create({
      name: String(name).trim(),
      mobile: cleanMobile,
      position: positionTrimmed,
      role: positionTrimmed,
      location,
      profileImageUrl: profileImageUrl || "",
      isAllowed: true,
      isVerified: false,
      uploadedDocs: 0,
      otp: "",
    });

    return Response.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        mobile: user.mobile,
        position: user.position,
        role: user.role,
        location: user.location,
        profileImageUrl: user.profileImageUrl,
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
