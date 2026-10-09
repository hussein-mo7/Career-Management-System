import mongoose from "mongoose";
import "@/server/models";

const globalForMongoose = globalThis as unknown as {
  mongooseCache?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!globalForMongoose.mongooseCache) {
    globalForMongoose.mongooseCache = { conn: null, promise: null };
  }

  const cached = globalForMongoose.mongooseCache;
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      ...(process.env.MONGODB_DB ? { dbName: process.env.MONGODB_DB } : {}),
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
