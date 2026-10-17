/** Turns an RTK Query error into a message that is safe to show to the customer. */
export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (typeof error === "object" && error !== null) {
    if ("status" in error && (error as { status: unknown }).status === "FETCH_ERROR") {
      return "Cannot reach the server. Please check your connection and try again.";
    }
    if ("data" in error) {
      const data = (error as { data: unknown }).data;
      if (typeof data === "object" && data !== null && "message" in data && typeof (data as { message: unknown }).message === "string") {
        return (data as { message: string }).message;
      }
    }
  }
  return fallback;
}

/** The per-field problems the API reported (e.g. "Discount price must be lower than the regular price"), if any. */
export function getFieldErrors(error: unknown): string[] {
  if (typeof error !== "object" || error === null || !("data" in error)) return [];
  const data = (error as { data: unknown }).data;
  if (typeof data !== "object" || data === null || !("errors" in data) || !Array.isArray((data as { errors: unknown }).errors)) return [];
  return (data as { errors: Array<{ field?: string; message?: unknown }> }).errors
    .map((e) => (typeof e.message === "string" ? e.message : ""))
    .filter(Boolean);
}
