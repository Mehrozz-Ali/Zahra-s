import { randomBytes } from "crypto";

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Returns `base`, or `base-2`, `base-3`... until `exists` says the slug is free. */
export async function generateUniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || "item";
  let slug = root;
  let n = 1;
  while (await exists(slug)) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export const randomCode = (bytes: number): string => randomBytes(bytes).toString("hex").toUpperCase();
