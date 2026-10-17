import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import type { ReactNode } from "react";
import { CartSync } from "@/components/cart/CartSync";
import { APP_URL } from "@/lib/seo";
import { SITE } from "@/lib/site";
import { StoreProvider } from "@/store/provider";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-cormorant" });
const sans = Jost({ subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: { default: SITE.name, template: `%s | ${SITE.name}` },
  description: SITE.description,
  applicationName: SITE.name,
  // Pages that set their own title/description inherit the rest (site name, locale, card type)
  openGraph: { type: "website", siteName: SITE.name, locale: "en_PK", title: SITE.name, description: SITE.description },
  twitter: { card: "summary_large_image", title: SITE.name, description: SITE.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#faf8f5" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <StoreProvider>
          <CartSync />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
