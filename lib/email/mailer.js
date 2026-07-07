/**
 * lib/email/mailer.js
 * Email delivery with three transports, picked by environment configuration:
 *
 *   1. SMTP (nodemailer)  — when SMTP_HOST + SMTP_USER + SMTP_PASS are set
 *                           (works with Gmail App Passwords: host smtp.gmail.com, port 587)
 *   2. Resend REST API    — when RESEND_API_KEY is set (plus EMAIL_FROM)
 *   3. Console fallback   — neither configured; the email is logged so the
 *                           full flow stays testable in development.
 *
 * All sends are best-effort: sendEmail never throws, so a mail failure can
 * never break the primary operation (scan, login, password change).
 */

import { env } from '@/lib/env'
import { getKey } from '@/lib/systemConfig'

/**
 * Resend key resolves through lib/systemConfig.js (admin panel overrides
 * .env), so adding RESEND_API_KEY via /admin activates real delivery
 * immediately. SMTP credentials remain .env-only.
 * @returns {Promise<'smtp'|'resend'|'console'>}
 */
export async function getEmailTransport() {
  if (env.smtpHost && env.smtpUser && env.smtpPass) return 'smtp'
  if (await getKey('RESEND_API_KEY')) return 'resend'
  return 'console'
}

async function sendViaSmtp({ to, subject, html, text, replyTo }) {
  const nodemailer = (await import('nodemailer')).default
  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  })
  await transporter.sendMail({ from: env.emailFrom, to, subject, html, text, replyTo })
}

async function sendViaResend({ to, subject, html, text, replyTo }) {
  const apiKey = await getKey('RESEND_API_KEY')
  const payload = { from: env.emailFrom, to: [to], subject, html, text }
  if (replyTo) payload.reply_to = replyTo
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend API ${res.status}: ${body}`)
  }
}

/**
 * Sends an email through the configured transport. Never throws.
 * @param {Object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 * @returns {Promise<{sent: boolean, transport: string, error?: string}>}
 */
export async function sendEmail({ to, subject, html, text, replyTo }) {
  const transport = await getEmailTransport()
  try {
    if (transport === 'smtp') {
      await sendViaSmtp({ to, subject, html, text, replyTo })
    } else if (transport === 'resend') {
      await sendViaResend({ to, subject, html, text, replyTo })
    } else {
      // Dev fallback — no credentials configured. Log enough to verify the
      // flow end-to-end without spamming the console with full HTML.
      console.error(`[mailer] Email NOT sent (no SMTP/Resend configured). To: ${to} | Subject: ${subject}`)
      return { sent: false, transport, error: 'Email transport not configured' }
    }
    return { sent: true, transport }
  } catch (error) {
    console.error(`[mailer] ${transport} send failed:`, error.message)
    return { sent: false, transport, error: error.message }
  }
}
