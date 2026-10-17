/** Rounds a maximum up to a clean axis top (e.g. 8,300 -> 10,000) and returns evenly spaced ticks including 0. */
export function niceScale(max: number, tickCount = 4): { top: number; ticks: number[] } {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const rough = max / tickCount;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= rough) ?? 10) * pow;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step) };
}

/** 0 / 1K / 2.5K / 1.2M for axis ticks. */
export function compact(n: number): string {
  const abs = Math.abs(n);
  const fmt = (v: number, s: string) => `${Number.isInteger(v) ? v : v.toFixed(1)}${s}`;
  if (abs >= 1_000_000) return fmt(n / 1_000_000, "M");
  if (abs >= 1_000) return fmt(n / 1_000, "K");
  return String(n);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-13" -> "13 Oct" (no Date object, so the shop's calendar day is never shifted by the browser's time zone). */
export function dayLabel(key: string): string {
  const [, m, d] = key.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]}`;
}
/** "2026-10" -> "Oct 26". */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y.slice(2)}`;
}
export function monthLabelLong(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}
