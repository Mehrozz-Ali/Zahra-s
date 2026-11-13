import { SITE } from "@/lib/site";

/**
 * The store's WhatsApp number in international form without "+" (for example 923001234567).
 * Set NEXT_PUBLIC_WHATSAPP_NUMBER; if it is empty the shop phone number from lib/site.ts is used.
 * A local Pakistani number such as 0300 1234567 is converted to 92300 1234567.
 */
export function getWhatsAppNumber(): string {
  const raw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || SITE.phone).replace(/\D/g, "");
  const intl = raw.startsWith("00") ? raw.slice(2) : raw.startsWith("0") ? `92${raw.slice(1)}` : raw;
  return /^\d{10,15}$/.test(intl) ? intl : "";
}

export function whatsAppLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
