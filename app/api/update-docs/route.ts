export const runtime = "nodejs";

import { connectDB } from "@/app/lib/mongodb";
import { deleteFromGridFS, uploadToGridFS } from "@/app/lib/gridfs";
import User from "@/app/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const mobile = formData.get("mobile")?.toString();
    const file = formData.get("file") as File;
    const documentName = formData.get("documentName")?.toString();
    const documentId = formData.get("documentId")?.toString();

    if (!mobile || !file || !documentName) {
      return Response.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const timestampedName = `${Date.now()}-${file.name}`;
    const fileId = await uploadToGridFS(file, timestampedName);
    const fileUrl = `/api/documents/file/${encodeURIComponent(fileId)}`;

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
      const previousFileId = user.documents[existingDocIndex]?.fileId;
      user.documents[existingDocIndex] = {
        ...user.documents[existingDocIndex],
        docId: normalizedDocId,
        name: documentName,
        fileId,
        fileUrl,
        status: "pending",
        uploadedAt: new Date(),
      };
      void deleteFromGridFS(previousFileId);
    } else {
      user.documents.push({
        docId: normalizedDocId,
        name: documentName,
        fileId,
        fileUrl,
        status: "pending",
        uploadedAt: new Date(),
      });
    }

    user.uploadedDocs = user.documents.filter(
      (doc: { fileUrl?: string; fileId?: string }) =>
        Boolean(doc.fileId || doc.fileUrl)
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
