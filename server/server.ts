import { createApp } from "./app";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { env } from "./config/env";
import { expireUnpaidCardOrders } from "./services/order.service";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const server = createApp().listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
  });

  // Release stock held by card orders that were never paid (every 5 minutes)
  setInterval(() => void expireUnpaidCardOrders().catch((e: unknown) => console.error("Order expiry failed:", e)), 5 * 60 * 1000).unref();

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((error: unknown) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
