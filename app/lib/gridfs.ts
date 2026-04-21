import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import { Readable } from "node:stream";

function getBucket() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("MongoDB connection is not initialized");
  }
  return new GridFSBucket(db, { bucketName: "documents" });
}

export async function uploadToGridFS(file: File, fileName: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const readable = Readable.from(buffer);
  const bucket = getBucket();

  const uploadStream = bucket.openUploadStream(fileName, {
    metadata: {
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    },
  });

  await new Promise<void>((resolve, reject) => {
    readable
      .pipe(uploadStream)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  return uploadStream.id.toString();
}

export async function deleteFromGridFS(fileId?: string) {
  if (!fileId) return;
  try {
    const bucket = getBucket();
    await bucket.delete(new ObjectId(fileId));
  } catch {
    // Ignore delete cleanup failures to avoid blocking user uploads.
  }
}

