/**
 * Makes an existing account an admin, so you can open /admin with it.
 *   npm run make-admin -- you@example.com
 * The account must already exist (register on the website first). Only someone with access to the server can run this.
 */
import { connectDatabase, disconnectDatabase } from "../config/database";
import { User } from "../models/User";

async function main(): Promise<void> {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Give the email address: npm run make-admin -- you@example.com");
  await connectDatabase();
  const result = await User.updateOne({ email }, { role: "admin", isActive: true, isEmailVerified: true });
  console.log(result.matchedCount === 0 ? `No account found for ${email}. Register it on the website first, then run this again.` : `${email} is now an admin. Log out and log in again, then open /admin`);
  await disconnectDatabase();
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
