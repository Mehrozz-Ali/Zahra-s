import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../app";
import { connectDatabase, isDatabaseConnected } from "../config/database";

/**
 * Vercel entry point. Vercel runs each request in a short-lived function instead of one long-running
 * server, so the Express app is built once per warm instance and the database connection is reused.
 * (server.ts is still what runs on Render, EC2 or your own computer.)
 */
const app = createApp();
let connecting: Promise<void> | null = null;

async function ensureDatabase(): Promise<void> {
  if (isDatabaseConnected()) return;
  connecting ??= connectDatabase().finally(() => { connecting = null; });
  await connecting;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    await ensureDatabase();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, message: "The service is temporarily unavailable. Please try again." }));
    return;
  }
  app(req, res);
}
