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
    const documentId = formData.get("documentId")?.toString();

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

    const normalizedDocId = documentId || documentName;
    const existingDocIndex = user.documents.findIndex(
      (doc: { docId?: string; name?: string }) =>
        (doc.docId && doc.docId === normalizedDocId) || doc.name === documentName
    );

    if (existingDocIndex >= 0) {
      user.documents[existingDocIndex] = {
        ...user.documents[existingDocIndex],
        docId: normalizedDocId,
        name: documentName,
        fileUrl,
        status: "pending",
        uploadedAt: new Date(),
      };
    } else {
      user.documents.push({
        docId: normalizedDocId,
        name: documentName,
        fileUrl,
        status: "pending",
        uploadedAt: new Date(),
      });
    }

    user.uploadedDocs = user.documents.filter(
      (doc: { fileUrl?: string }) => Boolean(doc.fileUrl)
    ).length;

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
