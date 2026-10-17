/**
 * Draws the sample product pictures used by `npm run seed` into client/public/seed.
 * They are simple illustrations (clearly labelled "Sample image"), so the store looks complete before you upload real photos.
 * Only needed if you want to change the look: npx tsx seed/tools/generatePlaceholders.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COLORS, GARMENTS, type ColorKey, type Garment } from "../data/palette";

const OUT = join(__dirname, "../../../client/public/seed");

const mix = (hex: string, withHex: string, amount: number): string => {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(hex), p(withHex)];
  return `#${a.map((v, i) => Math.round(v * (1 - amount) + b[i]! * amount).toString(16).padStart(2, "0")).join("")}`;
};

const SHAPES: Record<Garment, string> = {
  dress: `<path d="M235 165 Q300 205 365 165 L388 205 L352 330 Q425 470 462 700 Q300 735 138 700 Q175 470 248 330 L212 205 Z"/>`,
  kurta: `<path d="M238 150 Q300 190 362 150 L445 205 L478 372 L424 386 L398 290 L404 660 L196 660 L202 290 L176 386 L122 372 L155 205 Z"/>`,
  suit: `<path d="M240 150 Q300 188 360 150 L440 200 L468 340 L418 352 L396 270 L400 500 L200 500 L204 270 L182 352 L132 340 L160 200 Z"/><path d="M212 512 L388 512 L412 722 L322 722 L300 585 L278 722 L188 722 Z"/>`,
};
const FOLDS: Record<Garment, string> = {
  dress: `<path d="M300 330 Q290 520 270 705 M300 330 Q315 520 345 710 M262 330 Q225 500 200 702" />`,
  kurta: `<path d="M300 195 L300 640 M240 290 Q238 480 232 650 M360 290 Q362 480 368 650" />`,
  suit: `<path d="M300 195 L300 495 M300 585 L300 715 M240 290 Q238 400 232 495" />`,
};

const frame = (bg: string, body: string, label: string, caption = "SAMPLE IMAGE") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800" role="img" aria-label="${label}"><rect width="600" height="800" fill="${bg}"/>${body}<text x="300" y="770" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" letter-spacing="3" fill="#00000055">${caption}</text></svg>`;

function garment(g: Garment, key: ColorKey): string {
  const base = COLORS[key].code, dark = mix(base, "#000000", 0.22), light = mix(base, "#ffffff", 0.82);
  const body = `<ellipse cx="300" cy="735" rx="190" ry="14" fill="#00000012"/>
<g fill="${base}" stroke="${dark}" stroke-width="3" stroke-linejoin="round">${SHAPES[g]}</g>
<g fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round" opacity=".45">${FOLDS[g]}</g>
<path d="M262 160 Q300 188 338 160" fill="none" stroke="${mix(base, "#ffffff", 0.55)}" stroke-width="5" stroke-linecap="round"/>`;
  return frame(light, body, `${COLORS[key].name} ${g} (sample image)`);
}

/** The back of the same piece: no front neckline, a centre-back seam and a small zip, so the hover picture visibly differs. */
function garmentBack(g: Garment, key: ColorKey): string {
  const base = COLORS[key].code, dark = mix(base, "#000000", 0.22), light = mix(base, "#ffffff", 0.82);
  const top = 175;
  const body = `<ellipse cx="300" cy="735" rx="190" ry="14" fill="#00000012"/>
<g fill="${mix(base, "#000000", 0.06)}" stroke="${dark}" stroke-width="3" stroke-linejoin="round">${SHAPES[g]}</g>
<g fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round" opacity=".45">${FOLDS[g]}</g>
<path d="M300 ${top} L300 ${g === "dress" ? 330 : 300}" stroke="${dark}" stroke-width="4" stroke-dasharray="3 5" stroke-linecap="round" fill="none"/>`;
  return frame(light, body, `${COLORS[key].name} ${g}, back view (sample image)`, "SAMPLE IMAGE - BACK");
}

function swatch(key: ColorKey): string {
  const base = COLORS[key].code, light = mix(base, "#ffffff", 0.35), dark = mix(base, "#000000", 0.2);
  const body = `<defs><pattern id="w" width="36" height="36" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="36" height="36" fill="${base}"/><rect width="18" height="36" fill="${light}" opacity=".35"/><circle cx="18" cy="18" r="4" fill="${dark}" opacity=".5"/></pattern></defs>
<rect x="70" y="120" width="460" height="560" rx="6" fill="url(#w)" stroke="${dark}" stroke-width="3"/>`;
  return frame(mix(base, "#ffffff", 0.85), body, `${COLORS[key].name} fabric detail (sample image)`);
}

mkdirSync(OUT, { recursive: true });
let count = 0;
for (const key of Object.keys(COLORS) as ColorKey[]) {
  writeFileSync(join(OUT, `swatch-${key}.svg`), swatch(key)); count++;
  for (const g of GARMENTS) {
    writeFileSync(join(OUT, `${g}-${key}.svg`), garment(g, key)); count++;
    writeFileSync(join(OUT, `${g}-${key}-back.svg`), garmentBack(g, key)); count++;
  }
}
console.log(`Wrote ${count} sample images to ${OUT}`);
