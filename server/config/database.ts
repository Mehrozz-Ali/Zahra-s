import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env";

mongoose.set("strictQuery", true);

export async function connectDatabase(): Promise<void> {
  // Some networks refuse the DNS lookup that mongodb+srv:// needs when Node uses the default DNS server
  const dnsServers = env.MONGODB_DNS_SERVERS.split(",").map((s) => s.trim()).filter(Boolean);
  if (dnsServers.length > 0) dns.setServers(dnsServers);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export const isDatabaseConnected = (): boolean => mongoose.connection.readyState === 1;
