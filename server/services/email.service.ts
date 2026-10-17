import nodemailer from "nodemailer";
import { env, isProduction } from "../config/env";
import { passwordResetEmail, type RenderedEmail } from "../emails/templates";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

const smtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD);
const port = Number(env.SMTP_PORT) || 587;
const transporter = smtpConfigured
  ? nodemailer.createTransport({ host: env.SMTP_HOST, port, secure: port === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } })
  : null;

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!transporter) {
    // Without SMTP configured, print the email in development so flows like password reset can still be tested.
    if (isProduction) console.warn(`SMTP is not configured; email "${message.subject}" was not sent.`);
    else console.log(`\n[email not sent: SMTP not configured]\nTo: ${message.to}\nSubject: ${message.subject}\n${message.text}\n`);
    return;
  }
  await transporter.sendMail({ from: env.SMTP_FROM || env.SMTP_USER, ...message });
}

/**
 * Sends in the background. Emails are a courtesy: a mail server problem must never fail an order, a
 * registration or a status change, so errors are logged and swallowed. Callers do not await this.
 */
export function sendEmailInBackground(message: EmailMessage, label: string): void {
  sendEmail(message).catch((error: unknown) => console.error(`Email "${label}" to ${message.to} failed:`, error));
}

export const toMessage = (to: string, e: RenderedEmail): EmailMessage => ({ to, subject: e.subject, html: e.html, text: e.text });

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  await sendEmail(toMessage(to, passwordResetEmail(name, resetUrl)));
}
