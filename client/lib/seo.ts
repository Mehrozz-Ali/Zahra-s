/** The public address of the site, without a trailing slash. Set NEXT_PUBLIC_APP_URL in production. */
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const absoluteUrl = (path: string): string => `${APP_URL}${path.startsWith("/") ? path : `/${path}`}`;
