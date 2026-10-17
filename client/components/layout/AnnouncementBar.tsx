import { SITE } from "@/lib/site";

export function AnnouncementBar() {
  return <section aria-label="Announcement" className="bg-ink px-4 py-2 text-center text-xs tracking-wide text-ivory">{SITE.announcement}</section>;
}
