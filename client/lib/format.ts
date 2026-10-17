export const formatPrice = (amount: number): string => `Rs. ${amount.toLocaleString("en-PK")}`;

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
