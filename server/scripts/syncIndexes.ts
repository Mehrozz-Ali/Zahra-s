import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/database";
import "../models"; // registers every model

async function main(): Promise<void> {
  await connectDatabase();
  for (const name of mongoose.modelNames()) {
    await mongoose.model(name).syncIndexes();
    console.log(`Indexes synced: ${name}`);
  }
  await disconnectDatabase();
}

main().catch((error: unknown) => {
  console.error("Index sync failed:", error);
  process.exit(1);
});
