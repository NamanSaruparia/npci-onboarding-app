export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const mobile = formData.get("mobile")?.toString();
    const file = formData.get("file") as File;
    const documentName = formData.get("documentName")?.toString();

    console.log("Uploading file:", file?.name);
    console.log("Mobile:", mobile);

    if (!mobile || !file || !documentName) {
      return Response.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = Date.now() + "-" + file.name;
    const filePath = path.join(uploadDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = "/uploads/" + fileName;

    const user = await User.findOne({ mobile });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    user.documents = user.documents || [];

    user.documents.push({
      name: documentName,
      fileUrl,
      status: "pending",
    });

    await user.save();

    return Response.json({ success: true, fileUrl });
  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return Response.json(
      { success: false, message: "Server crash in upload API" },
      { status: 500 }
    );
  }
}
