import mongoose from "mongoose";

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not defined");
  }
  return uri;
}

type MongooseCache = {
  conn: mongoose.Mongoose | null;
  promise: Promise<mongoose.Mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = {
    conn: null,
    promise: null,
  };
}

export async function connectDB() {
  const dbCache =
    cached ??
    (global.mongooseCache = {
      conn: null,
      promise: null,
    });

  if (dbCache.conn) return dbCache.conn;

  if (!dbCache.promise) {
    dbCache.promise = mongoose.connect(getMongoUri(), {
      dbName: "npci-db",
    });
  }

  dbCache.conn = await dbCache.promise;
  cached = dbCache;
  return dbCache.conn;
}