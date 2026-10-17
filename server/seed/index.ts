import { connectDatabase, disconnectDatabase } from "../config/database";
import { env } from "../config/env";
import { Category } from "../models/Category";
import { Coupon } from "../models/Coupon";
import { Order } from "../models/Order";
import { Product } from "../models/Product";
import { Review } from "../models/Review";
import { Subscriber } from "../models/Subscriber";
import { User } from "../models/User";
import { categories, RETIRED_CATEGORIES } from "./data/categories";
import { DEMO_EMAIL_DOMAIN } from "./data/customers";
import { buildDemo, DEMO_COUPON_CODES } from "./demo";

const args = new Set(process.argv.slice(2));
const RESET = args.has("--reset") || args.has("--fresh");
const RESEED = !args.has("--reset");
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || "Demo@12345";
const demoEmailPattern = new RegExp(`@${DEMO_EMAIL_DOMAIN.replace(/\./g, "\\.")}$`, "i");

async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.log("Admin skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env to create one");
    return;
  }
  const email = env.ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(existing.role === "admin" ? `Admin exists: ${email}` : `Skipped: ${email} already exists as a customer`);
    return;
  }
  await User.create({ name: "Store Admin", email, password: env.ADMIN_PASSWORD, role: "admin", isEmailVerified: true });
  console.log(`Admin created: ${email}`);
}

async function seedCategories(): Promise<void> {
  let created = 0;
  for (const [index, c] of categories.entries()) {
    if (await Category.exists({ name: c.name })) continue;
    await Category.create({ ...c, sortOrder: index });
    created += 1;
  }
  console.log(`Categories: ${created} created, ${categories.length - created} already existed`);
}

/** Removes only the sample data (sample customers, their orders and reviews, DEMO- articles, sample coupons and subscribers). */
/** This store sells suits only. Old categories that no longer belong are removed once they hold no articles. */
async function retireCategories(): Promise<void> {
  for (const name of RETIRED_CATEGORIES) {
    const category = await Category.findOne({ name });
    if (!category) continue;
    if (await Product.exists({ category: category._id })) {
      console.log(`Category "${name}" still has articles, so it was kept. Move or delete those articles, then delete the category in Admin > Categories.`);
      continue;
    }
    await category.deleteOne();
    console.log(`Category "${name}" removed`);
  }
}

async function resetDemo(): Promise<void> {
  const users = await User.find({ email: demoEmailPattern, role: "customer" }).select("_id").lean();
  const ids = users.map((u) => u._id);
  const reviews = await Review.deleteMany({ user: { $in: ids } });
  const orders = await Order.deleteMany({ user: { $in: ids } });
  const products = await Product.deleteMany({ sku: /^DEMO-/ });
  const coupons = await Coupon.deleteMany({ code: { $in: [...DEMO_COUPON_CODES] } });
  const subscribers = await Subscriber.deleteMany({ email: demoEmailPattern });
  const customers = await User.deleteMany({ _id: { $in: ids } });
  console.log(`Sample data removed: ${customers.deletedCount} customers, ${products.deletedCount} articles, ${orders.deletedCount} orders, ${reviews.deletedCount} reviews, ${coupons.deletedCount} coupons, ${subscribers.deletedCount} subscribers`);
}

async function seedDemo(): Promise<void> {
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(DEMO_PASSWORD)) throw new Error("SEED_DEMO_PASSWORD needs at least 8 characters with a letter and a number");
  if (await Product.exists({ sku: /^DEMO-/ })) {
    console.log("Sample data already exists (use `npm run seed:fresh` to rebuild it)");
    return;
  }
  const cats = await Category.find().select("name").lean();
  const categoryIds = new Map(cats.map((c) => [c.name, c._id]));
  const demo = buildDemo({ password: DEMO_PASSWORD, categoryIds });
  const save = async <T extends object>(Model: { new (doc: T): { save(o: { timestamps: false }): Promise<unknown> } }, docs: T[]) => {
    for (const doc of docs) await new Model(doc).save({ timestamps: false }); // keep the back-dated createdAt/updatedAt
  };
  await save(User, demo.users);
  await save(Product, demo.products);
  await save(Coupon, demo.coupons);
  await save(Order, demo.orders);
  await save(Review, demo.reviews);
  await save(Subscriber, demo.subscribers);
  console.log(`Sample data created: ${demo.users.length} customers, ${demo.products.length} articles, ${demo.coupons.length} coupons, ${demo.orders.length} orders, ${demo.reviews.length} reviews, ${demo.subscribers.length} subscribers`);
  console.log(`Sample customers sign in with their email (for example ${demo.users[0]!.email}) and the password ${DEMO_PASSWORD}`);
  console.log(`Coupons to try: WELCOME10 (10% off Rs. 3,000+), FLAT500 (Rs. 500 off Rs. 5,000+)`);
}

async function main(): Promise<void> {
  if (env.NODE_ENV === "production" && RESET) throw new Error("--reset and --fresh remove sample data and are not allowed in production");
  await connectDatabase();
  await seedAdmin();
  await seedCategories();
  if (RESET) await resetDemo();
  await retireCategories();
  if (RESEED && env.NODE_ENV !== "production") await seedDemo();
  else if (RESEED) console.log("Production: sample data skipped");
  await disconnectDatabase();
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
