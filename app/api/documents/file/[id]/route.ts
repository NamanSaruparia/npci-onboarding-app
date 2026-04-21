export const runtime = "nodejs";

import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "node:stream";
import { connectDB } from "@/app/lib/mongodb";

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not initialized");
  }
  return new GridFSBucket(db, { bucketName: "documents" });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const objectId = new ObjectId(id);
    const bucket = getBucket();

    const fileDoc = await bucket.find({ _id: objectId }).next();
    if (!fileDoc) {
      return Response.json(
        { success: false, message: "File not found" },
        { status: 404 }
      );
    }

    const downloadStream = bucket.openDownloadStream(objectId);
    const webStream = Readable.toWeb(downloadStream) as ReadableStream<Uint8Array>;
    const url = new URL(req.url);
    const isDownload = url.searchParams.get("download") === "1";
    const metadata = fileDoc.metadata as { mimeType?: string } | undefined;
    const contentType = metadata?.mimeType || "application/octet-stream";

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${encodeURIComponent(fileDoc.filename)}"`,
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.error("GRIDFS READ ERROR:", err);
    return Response.json(
      { success: false, message: "Unable to load file" },
      { status: 500 }
    );
  }
}

