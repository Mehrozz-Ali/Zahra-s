/** Store-wide pricing rules. The server is the only place these are applied. Keep client/lib/site.ts (display text) in sync. */
export const STORE = {
  taxRate: 0, // e.g. 0.18 for 18%; 0 means prices already include tax
  maxQuantityPerLine: 10,
  delivery: {
    standard: { label: "Standard delivery", estimate: "3-5 working days", fee: 250, freeOver: 5000 as number | null },
    express: { label: "Express delivery", estimate: "1-2 working days", fee: 600, freeOver: null as number | null },
  },
} as const;

/** Brand details shown in emails. Keep in sync with client/lib/site.ts. */
export const BRAND = {
  name: "Zahra's",
  email: "hello@example.com", // TODO before launch: your real contact details
  phone: "0300 0000000",
  returnDays: 7,
} as const;
