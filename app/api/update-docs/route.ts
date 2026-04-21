export const runtime = "nodejs";

import { put } from "@vercel/blob";
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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return Response.json(
        {
          success: false,
          message: "File storage is not configured. Missing BLOB_READ_WRITE_TOKEN.",
        },
        { status: 500 }
      );
    }

    const blob = await put(
      `documents/${mobile}/${Date.now()}-${file.name}`,
      file,
      {
        access: "public",
      }
    );

    const fileUrl = blob.url;

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
