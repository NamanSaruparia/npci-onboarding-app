import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const {
      mobile,
      name,
      position,
      location,
      profileImageUrl,
      employeeType,
      entity,
      band,
      reportingManager,
    } = await req.json();
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
    if (!reportingManager || !String(reportingManager).trim()) {
      return Response.json(
        { message: "Reporting manager is required." },
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

    const allowedEmployeeTypes = ["fresher", "lateral"];
    if (!allowedEmployeeTypes.includes(String(employeeType ?? ""))) {
      return Response.json(
        { message: "Select a valid employee type." },
        { status: 400 }
      );
    }

    const allowedEntities = ["NPCI", "NBBL", "NIPL", "NBSL"];
    if (!allowedEntities.includes(String(entity ?? ""))) {
      return Response.json(
        { message: "Select a valid entity." },
        { status: 400 }
      );
    }

    const allowedBands = ["B1", "B2"];
    if (!allowedBands.includes(String(band ?? ""))) {
      return Response.json(
        { message: "Select a valid band." },
        { status: 400 }
      );
    }

    const positionTrimmed = String(position).trim();

    const user = await User.findOneAndUpdate(
      { mobile: cleanMobile },
      {
        mobile: cleanMobile,
        name: String(name).trim(),
        position: positionTrimmed,
        role: positionTrimmed,
        location,
        profileImageUrl: profileImageUrl || "",
        employeeType: String(employeeType),
        entity: String(entity),
        band: String(band),
        reportingManager: String(reportingManager).trim(),
        isAllowed: true,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

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
        employeeType: user.employeeType,
        entity: user.entity,
        band: user.band,
        reportingManager: user.reportingManager,
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
