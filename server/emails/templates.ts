import { env } from "../config/env";
import { BRAND, STORE } from "../config/store";

export interface RenderedEmail { subject: string; html: string; text: string }

const BG = "#faf8f5", INK = "#1c1a19", STONE = "#5f5a56", SAND = "#ece4d9", ROSE = "#8e5468";

export const escapeHtml = (s: string): string => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
export const money = (n: number): string => `Rs. ${n.toLocaleString("en-PK")}`;
const firstName = (name: string): string => name.trim().split(/\s+/)[0] || "there";
const url = (path: string): string => `${env.CLIENT_URL.replace(/\/$/, "")}${path}`;

const button = (href: string, label: string): string =>
  `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:${ROSE};color:#ffffff;padding:12px 24px;text-decoration:none;font-size:15px">${escapeHtml(label)}</a></p>`;
const p = (html: string): string => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55">${html}</p>`;
const small = (html: string): string => `<p style="margin:0 0 10px;font-size:13px;line-height:1.5;color:${STONE}">${html}</p>`;

/** One shared layout so every email looks the same. `preheader` is the grey preview text shown in the inbox list. */
function layout(title: string, preheader: string, body: string): string {
  return `<!doctype html><html lang="en"><body style="margin:0;background:${BG}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
<div style="background:${BG};padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:${INK}">
  <div style="max-width:560px;margin:0 auto">
    <p style="font-family:Georgia,serif;font-size:26px;margin:0 0 16px;text-align:center">${escapeHtml(BRAND.name)}</p>
    <div style="background:#ffffff;padding:32px;border:1px solid ${SAND}">
      <h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0 0 18px">${escapeHtml(title)}</h1>
      ${body}
    </div>
    <p style="font-size:12px;color:${STONE};text-align:center;margin:18px 0 0;line-height:1.6">
      Questions? Write to <a href="mailto:${BRAND.email}" style="color:${STONE}">${BRAND.email}</a> or call ${escapeHtml(BRAND.phone)}.<br>${escapeHtml(BRAND.name)}, Pakistan
    </p>
  </div>
</div></body></html>`;
}

const footerText = `\n\nQuestions? ${BRAND.email} or ${BRAND.phone}\n${BRAND.name}`;

// ---------- Account emails ----------

export function welcomeEmail(name: string): RenderedEmail {
  return {
    subject: `Welcome to ${BRAND.name}`,
    text: `Hi ${firstName(name)},\n\nYour email is confirmed and your account is ready. Browse the latest collection: ${url("/shop")}${footerText}`,
    html: layout(`Welcome to ${BRAND.name}`, "Your account is ready.",
      p(`Hi ${escapeHtml(firstName(name))},`) + p("Your email is confirmed and your account is ready. You can save addresses, track your orders and keep a wishlist.") + button(url("/shop"), "Start shopping")
      + small(`Delivery takes ${STORE.delivery.standard.estimate}. Cash on delivery is available across Pakistan.`)),
  };
}

export function verifyEmailEmail(name: string, verifyUrl: string): RenderedEmail {
  return {
    subject: "Confirm your email address",
    text: `Hi ${firstName(name)},\n\nPlease confirm your email address (the link works for 24 hours):\n${verifyUrl}\n\nIf you did not create an account, you can ignore this email.${footerText}`,
    html: layout("Confirm your email", "One click to confirm your email address.",
      p(`Hi ${escapeHtml(firstName(name))},`) + p("Please confirm your email address so we can send you order updates. The link works for 24 hours.") + button(verifyUrl, "Confirm email")
      + small("If you did not create an account, you can ignore this email.")),
  };
}

export function passwordResetEmail(name: string, resetUrl: string): RenderedEmail {
  return {
    subject: "Reset your password",
    text: `Hi ${firstName(name)},\n\nUse this link to choose a new password (valid for 30 minutes):\n${resetUrl}\n\nIf you did not ask for this, you can ignore this email.${footerText}`,
    html: layout("Reset your password", "Choose a new password. The link is valid for 30 minutes.",
      p(`Hi ${escapeHtml(firstName(name))},`) + p("Use the button below to choose a new password. The link is valid for 30 minutes.") + button(resetUrl, "Reset password")
      + small("If you did not ask for this, you can ignore this email. Your password stays the same.")),
  };
}

// ---------- Order emails ----------

export interface OrderEmailData {
  _id: string;
  orderNumber: string;
  items: Array<{ name: string; size: string; quantity: number; price: number }>;
  shippingAddress: { fullName: string; phone: string; line1: string; line2?: string; city: string; province: string; postalCode?: string };
  deliveryMethod: "standard" | "express";
  paymentMethod: "cod" | "stripe";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  total: number;
  coupon?: { code: string };
}

const orderUrl = (o: OrderEmailData): string => url(`/account/orders/${o._id}`);
const addressLines = (a: OrderEmailData["shippingAddress"]): string[] => [a.fullName, a.line1, ...(a.line2 ? [a.line2] : []), [a.city, a.province, a.postalCode].filter(Boolean).join(", "), a.phone];
const deliveryLabel = (o: OrderEmailData): string => STORE.delivery[o.deliveryMethod].label;
const paymentLine = (o: OrderEmailData): string => (o.paymentMethod === "cod" ? `Cash on delivery: please keep ${money(o.total)} ready.` : "Paid online by card. Thank you.");

function itemsTable(o: OrderEmailData): string {
  const rows = o.items.map((i) => `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${SAND};font-size:14px">${escapeHtml(i.name)}<br><span style="color:${STONE};font-size:12px">size ${escapeHtml(i.size)}, qty ${i.quantity}</span></td>
    <td style="padding:8px 0;border-bottom:1px solid ${SAND};font-size:14px;text-align:right;white-space:nowrap;vertical-align:top">${money(i.price * i.quantity)}</td></tr>`).join("");
  const line = (label: string, value: string, strong = false) => `<tr><td style="padding:3px 0;font-size:14px;${strong ? "font-weight:bold;" : `color:${STONE};`}">${label}</td><td style="padding:3px 0;font-size:14px;text-align:right;${strong ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:8px 0 16px">${rows}</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:18px">
${line("Subtotal", money(o.subtotal))}${o.discount > 0 ? line(`Discount${o.coupon ? ` (${escapeHtml(o.coupon.code)})` : ""}`, `-${money(o.discount)}`) : ""}${line(escapeHtml(deliveryLabel(o)), o.shippingCost === 0 ? "Free" : money(o.shippingCost))}${o.tax > 0 ? line("Tax", money(o.tax)) : ""}${line("Total", money(o.total), true)}</table>`;
}
const itemsText = (o: OrderEmailData): string => o.items.map((i) => `- ${i.name} (size ${i.size}) x ${i.quantity}: ${money(i.price * i.quantity)}`).join("\n") + `\nTotal: ${money(o.total)}`;
const addressBlock = (o: OrderEmailData): string => `<p style="margin:0 0 6px;font-size:13px;color:${STONE}">Delivering to</p><p style="margin:0 0 18px;font-size:14px;line-height:1.55">${addressLines(o.shippingAddress).map(escapeHtml).join("<br>")}</p>`;
const noteBlock = (label: string, note?: string): string => (note?.trim() ? `<p style="margin:0 0 18px;padding:12px 14px;background:${BG};font-size:14px;line-height:1.5"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(note.trim())}</p>` : "");

export function orderConfirmationEmail(name: string, o: OrderEmailData): RenderedEmail {
  return {
    subject: `Order ${o.orderNumber} confirmed`,
    text: `Hi ${firstName(name)},\n\nThank you for your order ${o.orderNumber}.\n\n${itemsText(o)}\n\n${paymentLine(o)}\nDelivering to: ${addressLines(o.shippingAddress).join(", ")}\nEstimated delivery: ${STORE.delivery[o.deliveryMethod].estimate}\n\nTrack your order: ${orderUrl(o)}${footerText}`,
    html: layout("Thank you for your order", `Order ${o.orderNumber} is confirmed.`,
      p(`Hi ${escapeHtml(firstName(name))}, we have received your order <strong>${escapeHtml(o.orderNumber)}</strong>.`) + itemsTable(o)
      + p(escapeHtml(paymentLine(o))) + addressBlock(o) + p(`Estimated delivery: ${escapeHtml(STORE.delivery[o.deliveryMethod].estimate)}.`) + button(orderUrl(o), "Track your order")),
  };
}

export function orderShippedEmail(name: string, o: OrderEmailData, note?: string): RenderedEmail {
  return {
    subject: `Order ${o.orderNumber} is on its way`,
    text: `Hi ${firstName(name)},\n\nGood news: order ${o.orderNumber} has been shipped.${note?.trim() ? `\nCourier details: ${note.trim()}` : ""}\n\n${itemsText(o)}\n\n${paymentLine(o)}\nDelivering to: ${addressLines(o.shippingAddress).join(", ")}\n\nTrack your order: ${orderUrl(o)}${footerText}`,
    html: layout("Your order is on its way", `Order ${o.orderNumber} has been shipped.`,
      p(`Hi ${escapeHtml(firstName(name))}, order <strong>${escapeHtml(o.orderNumber)}</strong> has been shipped. Estimated delivery: ${escapeHtml(STORE.delivery[o.deliveryMethod].estimate)}.`)
      + noteBlock("Courier details", note) + itemsTable(o) + p(escapeHtml(paymentLine(o))) + addressBlock(o) + button(orderUrl(o), "Track your order")),
  };
}

export function orderDeliveredEmail(name: string, o: OrderEmailData): RenderedEmail {
  return {
    subject: `Order ${o.orderNumber} was delivered`,
    text: `Hi ${firstName(name)},\n\nOrder ${o.orderNumber} has been delivered. We hope you love it.\n\nIf something is not right, you can return items within ${BRAND.returnDays} days. You can also review your articles: ${orderUrl(o)}${footerText}`,
    html: layout("Your order has arrived", `Order ${o.orderNumber} was delivered.`,
      p(`Hi ${escapeHtml(firstName(name))}, order <strong>${escapeHtml(o.orderNumber)}</strong> has been delivered. We hope you love it.`)
      + p(`If something is not right, you can return items within ${BRAND.returnDays} days. Once you have tried your articles, a review helps other shoppers.`) + button(orderUrl(o), "View order and write a review")),
  };
}

export type CancelledBy = "customer" | "store" | "payment-timeout";

export function orderCancelledEmail(name: string, o: OrderEmailData, opts: { by: CancelledBy; note?: string; refunded?: boolean; refundPending?: boolean }): RenderedEmail {
  const why = opts.by === "customer" ? "You cancelled this order." : opts.by === "payment-timeout" ? "The online payment was not completed in time, so the order was released." : "We had to cancel this order.";
  const money_ = opts.refunded ? `Your payment of ${money(o.total)} has been refunded to your card. It can take 5 to 10 working days to show on your statement.`
    : opts.refundPending ? `You paid ${money(o.total)} by card. We will refund it and contact you shortly; you do not need to do anything.`
      : o.paymentMethod === "stripe" && o.paymentStatus !== "paid" ? "You were not charged." : o.paymentMethod === "cod" ? "You do not need to pay anything." : "";
  return {
    subject: `Order ${o.orderNumber} was cancelled`,
    text: `Hi ${firstName(name)},\n\nOrder ${o.orderNumber} has been cancelled. ${why}${opts.note?.trim() && opts.by === "store" ? `\nReason: ${opts.note.trim()}` : ""}\n${money_}\n\n${itemsText(o)}\n\nYou can order again any time: ${url("/shop")}${footerText}`,
    html: layout("Your order was cancelled", `Order ${o.orderNumber} was cancelled.`,
      p(`Hi ${escapeHtml(firstName(name))}, order <strong>${escapeHtml(o.orderNumber)}</strong> has been cancelled. ${escapeHtml(why)}`)
      + (opts.by === "store" ? noteBlock("Reason", opts.note) : "") + (money_ ? p(escapeHtml(money_)) : "") + itemsTable(o) + button(url("/shop"), "Continue shopping")),
  };
}
