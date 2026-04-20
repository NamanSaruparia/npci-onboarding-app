import mongoose from "mongoose";

type MongooseCache = {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI not defined");
}

const uri: string = MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const dbCache = cached!;

  if (dbCache.conn) return dbCache.conn;

  if (!dbCache.promise) {
    dbCache.promise = mongoose.connect(uri, {
      dbName: "npci-db",
    });
  }

  dbCache.conn = await dbCache.promise;
  return dbCache.conn;
}