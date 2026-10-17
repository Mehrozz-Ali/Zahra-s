/**
 * Finds product images on Cloudinary that no article references (e.g. uploaded in the form, then the tab was closed).
 * Only images older than 24 hours are considered. Dry run by default:
 *   npm run images:clean               -> lists orphans
 *   npm run images:clean -- --delete   -> deletes them
 */
import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary";
import { connectDatabase, disconnectDatabase } from "../config/database";
import { Product } from "../models/Product";

const PREFIX = "women-clothing-store/products/";
const MIN_AGE_MS = 24 * 60 * 60 * 1000;

interface CloudinaryResource {
  public_id: string;
  created_at: string;
}

async function listUploaded(): Promise<CloudinaryResource[]> {
  const all: CloudinaryResource[] = [];
  let cursor: string | undefined;
  do {
    const page = (await cloudinary.api.resources({ type: "upload", prefix: PREFIX, max_results: 500, next_cursor: cursor })) as { resources: CloudinaryResource[]; next_cursor?: string };
    all.push(...page.resources);
    cursor = page.next_cursor;
  } while (cursor);
  return all;
}

async function main(): Promise<void> {
  if (!isCloudinaryConfigured) throw new Error("Set the CLOUDINARY_* values in server/.env first");
  const shouldDelete = process.argv.includes("--delete");
  await connectDatabase();

  const products = await Product.find().select("images.publicId").lean();
  const used = new Set(products.flatMap((p) => p.images.map((i) => i.publicId)));
  const orphans = (await listUploaded()).filter((r) => !used.has(r.public_id) && Date.now() - Date.parse(r.created_at) > MIN_AGE_MS);

  console.log(`${orphans.length} unused product image(s) older than 24h`);
  orphans.forEach((o) => console.log(`  ${o.public_id}`));

  if (shouldDelete && orphans.length > 0) {
    for (let i = 0; i < orphans.length; i += 100) {
      await cloudinary.api.delete_resources(orphans.slice(i, i + 100).map((o) => o.public_id));
    }
    console.log("Deleted.");
  } else if (orphans.length > 0) {
    console.log("Dry run. Add --delete to remove them.");
  }
  await disconnectDatabase();
}

main().catch((error: unknown) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
});
