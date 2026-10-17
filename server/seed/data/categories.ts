export const categories = [
  { name: "New Arrivals", description: "The latest pieces, just landed." },
  { name: "Winter Collection", description: "Khaddar, karandi and warm suits for the cold season." },
  { name: "Summer Collection", description: "Light lawn and cotton for hot days." },
  { name: "Dresses", description: "Ready-to-wear dresses for every occasion." },
  { name: "Two Piece", description: "Matching shirt and trouser suits." },
  { name: "Three Piece", description: "Complete suits with shirt, trouser and dupatta." },
  { name: "Sale", description: "Selected styles at reduced prices." },
] as const;

/** Categories this store no longer uses. `npm run seed` removes them when they have no articles (otherwise it leaves them and says so). */
export const RETIRED_CATEGORIES = ["Tops", "Trousers", "Shawls", "Accessories"] as const;
