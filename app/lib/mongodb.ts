import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var mongoose: { conn: any; promise: any } | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not defined");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const dbCache = cached!;

  if (dbCache.conn) return dbCache.conn;

  if (!dbCache.promise) {
    dbCache.promise = mongoose.connect(MONGODB_URI, {
      dbName: "npci-db",
    });
  }

  dbCache.conn = await dbCache.promise;
  return dbCache.conn;
}