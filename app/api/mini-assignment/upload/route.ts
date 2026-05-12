export const runtime = "nodejs";

import { connectDB } from "@/app/lib/mongodb";
import { uploadToGridFS } from "@/app/lib/gridfs";

export async function POST(req: Request) {
  try {
    await connectDB();

    const formData = await req.formData();
    const mobile = formData.get("mobile")?.toString();
    const file = formData.get("file") as File;

    if (!mobile || !file) {
      return Response.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const timestampedName = `${Date.now()}-${file.name}`;
    const fileId = await uploadToGridFS(file, timestampedName);
    const fileUrl = `/api/documents/file/${encodeURIComponent(fileId)}`;

    return Response.json({ success: true, fileId, fileUrl, fileName: file.name });
  } catch (err) {
    console.error("[MINI ASSIGNMENT UPLOAD ERROR]", err);
    return Response.json({ success: false, message: "Server crash in upload API" }, { status: 500 });
  }
}

