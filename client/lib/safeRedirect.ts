/** Only allows same-site paths, so a crafted ?redirect= link cannot send users to another website. */
export function safeRedirect(target: string | null, fallback = "/"): string {
  return target && target.startsWith("/") && !target.startsWith("//") && !target.startsWith("/\\") ? target : fallback;
}
