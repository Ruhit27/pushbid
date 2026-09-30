import mongoose from "mongoose";

const cached = globalThis as unknown as { mongoosePromise?: Promise<typeof mongoose> };

/** One connection per server instance, reused across hot reloads and serverless invocations. */
export function connectDb(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set. Add it to .env.local.");
  cached.mongoosePromise ??= mongoose.connect(uri, { dbName: "push-bid", bufferCommands: false }).catch((err) => {
    cached.mongoosePromise = undefined;
    throw err;
  });
  return cached.mongoosePromise;
}
