import Link from "next/link";
import type { ReactNode } from "react";
import { SITE } from "@/lib/site";

const columns: Array<{ title: string; links: Array<[string, string]> }> = [
  { title: "Shop by", links: [["All suits", "/shop"], ["New arrivals", "/category/new-arrivals"], ["Orders", "/account/orders"], ["Profile", "/account"], ["Wishlist", "/wishlist"]] },
  { title: "Customer service", links: [["Contact", "/contact"], ["Shipping policy", "/shipping-policy"], ["Return policy", "/return-policy"], ["Terms of service", "/terms-and-conditions"]] },
  { title: "Information links", links: [["About us", "/about"], ["Privacy policy", "/privacy-policy"]] },
];

const linkClass = "transition-colors hover:text-rose-dark";
const underlined = "underline underline-offset-4 transition-colors hover:text-rose-dark";

function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 bg-white text-ink shadow-sm transition-colors hover:border-rose-dark hover:text-rose-dark">
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-sand/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-5 lg:py-16">
        <div className="space-y-5 text-[0.95rem] leading-relaxed">
          <p>We are located at {SITE.address}.</p>
          <p>Call us: <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className={underlined}>{SITE.phone}</a></p>
          <p>Email:<br /><a href={`mailto:${SITE.email}`} className={`${underlined} break-all`}>{SITE.email}</a></p>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="mb-5 text-base font-bold uppercase">{col.title}</h2>
            <ul className="space-y-3 text-[0.95rem]">
              {col.links.map(([label, href]) => <li key={label}><Link href={href} className={linkClass}>{label}</Link></li>)}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="mb-5 text-base font-bold uppercase">Follow us</h2>
          <div className="flex gap-4">
            <Social href={SITE.facebookUrl} label="Zahra's on Facebook">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden><path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.400-3.9 4v2.2H7.8v3h2.600V21h3.1z" /></svg>
            </Social>
            <Social href={SITE.instagramUrl} label="Zahra's on Instagram">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
            </Social>
          </div>
        </div>
      </div>

      <p className="border-t border-ink/70 px-6 py-6 text-center text-[0.95rem]">&copy; {new Date().getFullYear()} {SITE.name}. All Rights Reserved.</p>
    </footer>
  );
}
