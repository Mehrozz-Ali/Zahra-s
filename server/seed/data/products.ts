import type { ProductStatus, Size } from "../../types";
import type { ColorKey, Garment } from "./palette";

export interface DemoProduct {
  sku: string;
  name: string;
  category: string; // must match a name in categories.ts
  garment: Garment;
  color: ColorKey; // the article's one colour (it decides which sample picture is used)
  sizes: Size[];
  price: number;
  discountPrice?: number;
  material: string;
  short: string;
  featured?: boolean;
  bestSeller?: boolean;
  newArrival?: boolean;
  status?: ProductStatus;
  stock?: "normal" | "low" | "out";
  daysOld: number;
}

const TOP: Size[] = ["XS", "S", "M", "L", "XL"];
const SUIT: Size[] = ["S", "M", "L", "XL"];

/** Sample articles for `npm run seed`. SKUs start with DEMO- so they can be found and removed again (npm run seed:reset). */
export const DEMO_PRODUCTS: DemoProduct[] = [
  // Summer Collection
  { sku: "DEMO-001", name: "Gulabi Printed Lawn Suit", category: "Summer Collection", garment: "suit", color: "rose", sizes: SUIT, price: 6200, material: "Premium lawn", short: "Soft printed lawn shirt with matching trousers.", featured: true, bestSeller: true, daysOld: 90 },
  { sku: "DEMO-002", name: "Chambeli Embroidered Lawn Suit", category: "Summer Collection", garment: "suit", color: "ivory", sizes: SUIT, price: 7800, material: "Embroidered lawn", short: "Neck embroidery on breathable lawn.", bestSeller: true, daysOld: 85 },
  { sku: "DEMO-003", name: "Sabz Cotton Kurta", category: "Summer Collection", garment: "kurta", color: "ivory", sizes: TOP, price: 3200, material: "Cotton", short: "An easy everyday kurta in pure cotton.", bestSeller: true, daysOld: 100 },
  { sku: "DEMO-004", name: "Saaya Linen Shirt", category: "Summer Collection", garment: "kurta", color: "sage", sizes: TOP, price: 3900, material: "Linen blend", short: "Relaxed linen shirt that stays cool.", daysOld: 70 },
  // Winter Collection
  { sku: "DEMO-005", name: "Barfi Khaddar Suit", category: "Winter Collection", garment: "suit", color: "maroon", sizes: SUIT, price: 8900, material: "Khaddar", short: "Warm khaddar suit for cold mornings.", featured: true, daysOld: 60 },
  { sku: "DEMO-006", name: "Kashmiri Embroidered Khaddar", category: "Winter Collection", garment: "suit", color: "teal", sizes: SUIT, price: 11500, material: "Khaddar with Kashmiri embroidery", short: "Hand-finished embroidery on soft khaddar.", featured: true, bestSeller: true, daysOld: 55 },
  { sku: "DEMO-007", name: "Karandi Winter Suit", category: "Winter Collection", garment: "suit", color: "lavender", sizes: SUIT, price: 9800, material: "Karandi", short: "Textured karandi with a gentle drape.", daysOld: 50, stock: "low" },
  { sku: "DEMO-008", name: "Woolen Cardigan Kurta", category: "Winter Collection", garment: "kurta", color: "charcoal", sizes: TOP, price: 5400, material: "Wool blend", short: "A long cardigan-style kurta in warm wool.", daysOld: 45 },
  // Dresses
  { sku: "DEMO-009", name: "Maya Chiffon Maxi Dress", category: "Dresses", garment: "dress", color: "rose", sizes: TOP, price: 9500, material: "Chiffon", short: "Floaty maxi dress with a fitted waist.", featured: true, daysOld: 80 },
  { sku: "DEMO-010", name: "Layla Silk Evening Dress", category: "Dresses", garment: "dress", color: "maroon", sizes: TOP, price: 14800, material: "Pure silk", short: "A graceful silk dress for evenings and weddings.", bestSeller: true, daysOld: 75 },
  { sku: "DEMO-011", name: "Anaya Cotton Day Dress", category: "Dresses", garment: "dress", color: "mustard", sizes: TOP, price: 4800, material: "Cotton", short: "A light cotton dress for everyday wear.", daysOld: 65 },
  { sku: "DEMO-012", name: "Sahar Pleated Midi Dress", category: "Dresses", garment: "dress", color: "lavender", sizes: TOP, price: 6900, material: "Crinkle georgette", short: "Pleated midi with a flattering flare.", daysOld: 58 },
  // Two Piece
  { sku: "DEMO-013", name: "Hira Cotton Co-ord Set", category: "Two Piece", garment: "suit", color: "ivory", sizes: SUIT, price: 5200, material: "Cotton", short: "Matching shirt and trousers in soft cotton.", daysOld: 62 },
  { sku: "DEMO-014", name: "Zoya Linen Two Piece", category: "Two Piece", garment: "suit", color: "sage", sizes: SUIT, price: 6400, material: "Linen blend", short: "Breathable linen set for warm days.", daysOld: 52 },
  { sku: "DEMO-015", name: "Fiza Printed Two Piece", category: "Two Piece", garment: "suit", color: "teal", sizes: SUIT, price: 4600, material: "Printed cotton", short: "Bold prints with an easy fit.", daysOld: 48 },
  // Three Piece
  { sku: "DEMO-016", name: "Rani Formal Three Piece", category: "Three Piece", garment: "suit", color: "maroon", sizes: SUIT, price: 16500, material: "Jacquard with chiffon dupatta", short: "Formal suit with dupatta for special occasions.", featured: true, daysOld: 70 },
  { sku: "DEMO-017", name: "Shehnai Embroidered Three Piece", category: "Three Piece", garment: "suit", color: "rose", sizes: SUIT, price: 18900, material: "Organza and raw silk", short: "Heavily embroidered three piece for weddings.", bestSeller: true, daysOld: 66, stock: "low" },
  { sku: "DEMO-018", name: "Iqra Cotton Three Piece", category: "Three Piece", garment: "suit", color: "sage", sizes: SUIT, price: 7200, material: "Cotton with voile dupatta", short: "Everyday three piece with a light dupatta.", daysOld: 60 },
  // New Arrivals
  { sku: "DEMO-029", name: "Autumn Khaddar Kurta", category: "New Arrivals", garment: "kurta", color: "mustard", sizes: TOP, price: 4900, material: "Khaddar", short: "Just in: a warm kurta for the first cool days.", newArrival: true, featured: true, daysOld: 6 },
  { sku: "DEMO-030", name: "Velvet Formal Shirt", category: "New Arrivals", garment: "kurta", color: "maroon", sizes: TOP, price: 7600, material: "Velvet", short: "A rich velvet shirt for winter weddings.", newArrival: true, daysOld: 9 },
  { sku: "DEMO-031", name: "Block Print Cotton Suit", category: "New Arrivals", garment: "suit", color: "sage", sizes: SUIT, price: 6600, material: "Block printed cotton", short: "Hand block prints on soft cotton.", newArrival: true, daysOld: 4 },
  { sku: "DEMO-032", name: "Shawl Collar Cardigan Dress", category: "New Arrivals", garment: "dress", color: "charcoal", sizes: TOP, price: 8400, material: "Knit blend", short: "A cosy knit dress with a wrap collar.", newArrival: true, daysOld: 11 },
  // Sale
  { sku: "DEMO-033", name: "Last Season Lawn Suit", category: "Sale", garment: "suit", color: "peach", sizes: SUIT, price: 6800, discountPrice: 4200, material: "Lawn", stock: "out", short: "Last season's print at a reduced price.", daysOld: 120 },
  { sku: "DEMO-034", name: "Classic Kurti Clearance", category: "Sale", garment: "kurta", color: "ivory", sizes: TOP, price: 3200, discountPrice: 1990, material: "Cotton", short: "A classic kurti, now at a lower price.", daysOld: 115 },
  // Not for sale yet: shows the draft and archived states in the admin
  { sku: "DEMO-037", name: "Eid Preview Embroidered Suit", category: "Three Piece", garment: "suit", color: "rose", sizes: SUIT, price: 21000, material: "Organza", short: "Coming soon.", status: "draft", daysOld: 3 },
  { sku: "DEMO-038", name: "Discontinued Lawn Suit", category: "Summer Collection", garment: "suit", color: "lavender", sizes: SUIT, price: 5800, material: "Lawn", short: "No longer sold.", status: "archived", daysOld: 200 },
];
