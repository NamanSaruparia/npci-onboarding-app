import { connectDB } from "@/app/lib/mongodb";
import { adminUnauthorizedResponse, hasAdminAccess } from "@/app/lib/admin";
import { isValidMobile } from "@/app/lib/auth";
import User from "@/app/models/User";

export async function POST(req: Request) {
  if (!hasAdminAccess(req)) return adminUnauthorizedResponse();

  try {
    await connectDB();

    const { mobile, employeeType, entity, band } = await req.json();
    const cleanMobile = String(mobile ?? "").trim();

    if (!cleanMobile || !isValidMobile(cleanMobile)) {
      return Response.json(
        { message: "Enter a valid 10-digit mobile number." },
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

    const user = await User.findOneAndUpdate(
      { mobile: cleanMobile },
      {
        employeeType: String(employeeType),
        entity: String(entity),
        band: String(band),
      },
      { new: true }
    );

    if (!user) {
      return Response.json({ message: "User not found." }, { status: 404 });
    }

    return Response.json({ success: true, user });
  } catch (err) {
    console.error("[API ERROR]", err);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
