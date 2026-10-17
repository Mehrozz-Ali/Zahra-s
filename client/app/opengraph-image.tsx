import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// The picture shown when the site's address is shared on WhatsApp, Facebook or X, unless a page has its own (products do).
export const alt = `${SITE.name}: ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const mark = `data:image/png;base64,${(await readFile(path.join(process.cwd(), "public/brand/zahra-mark.png"))).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#faf8f5", color: "#1c1a19", fontFamily: "Georgia, serif" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mark} alt="" width={170} height={180} />
        <div style={{ fontSize: 96, letterSpacing: 26, marginTop: 24, textTransform: "uppercase" }}>{SITE.name}</div>
        <div style={{ fontSize: 34, marginTop: 18, color: "#8e5468", fontFamily: "sans-serif" }}>{SITE.tagline}</div>
        <div style={{ fontSize: 28, marginTop: 40, color: "#5f5a56", fontFamily: "sans-serif" }}>Cash on delivery across Pakistan</div>
      </div>
    ),
    size,
  );
}
