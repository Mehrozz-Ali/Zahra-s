/**
 * A visitor without an account keeps their wishlist (product ids) in this browser. It is merged into the
 * account when they log in. All reads and writes are wrapped, because storage can be blocked or full.
 */
const KEY = "guest-wishlist";
const MAX = 100;
const EMPTY: string[] = [];
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function load(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch { return []; }
}

export function getGuestWishlist(): string[] {
  if (cache === null) cache = load();
  return cache;
}
export const getGuestWishlistServer = (): string[] => EMPTY;

function save(ids: string[]): void {
  cache = ids;
  try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* kept in memory for this visit */ }
  listeners.forEach((l) => l());
}

export function subscribeGuestWishlist(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; listener(); } }; // another tab changed it
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(listener); window.removeEventListener("storage", onStorage); };
}

export function addGuestWishlist(id: string): boolean {
  const ids = getGuestWishlist();
  if (ids.includes(id)) return true;
  if (ids.length >= MAX) return false;
  save([...ids, id]);
  return true;
}
export function removeGuestWishlist(id: string): void { save(getGuestWishlist().filter((x) => x !== id)); }
export function clearGuestWishlist(): void { save([]); }
