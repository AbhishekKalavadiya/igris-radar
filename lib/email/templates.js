/**
 * lib/email/templates.js
 * HTML email templates. Kept deliberately simple (inline styles, table-free)
 * for broad email-client compatibility. Igris dark-teal identity colors are
 * fine here — email clients can't use the app's Tailwind tokens.
 */

import { env } from '@/lib/env'

const BRAND_TEAL = '#3bbcdc'
// Absolute URL — email clients can't resolve relative /public paths, and
// data URIs have inconsistent support across mail clients.
const LOGO_URL = `${env.siteUrl}/logo-white.png`

function layout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0c1116;font-family:Arial,Helvetica,sans-serif;color:#d7dde3;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding-right:8px;"><img src="${LOGO_URL}" width="18" height="18" alt="" style="display:block;" /></td>
        <td style="color:${BRAND_TEAL};font-weight:bold;letter-spacing:2px;font-size:13px;">IGRIS RADAR</td>
      </tr>
    </table>
    <h1 style="font-size:20px;color:#ffffff;margin:0 0 16px;">${title}</h1>
    ${bodyHtml}
    <p style="font-size:12px;color:#6b7580;margin-top:32px;border-top:1px solid #1d2530;padding-top:16px;">
      You are receiving this because of your notification settings in Igris Radar.
      Manage them in Settings &rarr; Notifications.
    </p>
  </div>
</body>
</html>`
}

const row = (label, value) =>
  `<p style="margin:6px 0;font-size:14px;"><span style="color:#8b95a1;">${label}:</span> <strong style="color:#ffffff;">${value}</strong></p>`

/** Scan-complete alert. */
export function scanAlertEmail({ name, scanType, url, score, findingsCount, criticalCount }) {
  const title = `${scanType} scan complete — ${score}/100`
  const html = layout(title, `
    <p style="font-size:14px;">Hi ${name || 'there'}, your scan has finished.</p>
    ${row('Target', url)}
    ${row('Scan type', scanType)}
    ${row('Score', `${score}/100`)}
    ${row('Findings', String(findingsCount))}
    ${criticalCount ? row('Critical / high severity', String(criticalCount)) : ''}
    <p style="font-size:14px;margin-top:16px;">Open the dashboard to review findings and remediation steps.</p>
  `)
  const text = `${title}\nTarget: ${url}\nFindings: ${findingsCount}`
  return { subject: `[Igris Radar] ${title}`, html, text }
}

/** New sign-in alert. */
export function loginAlertEmail({ name, ip, time }) {
  const title = 'New sign-in to your account'
  const html = layout(title, `
    <p style="font-size:14px;">Hi ${name || 'there'}, a new sign-in to your Igris Radar account was detected.</p>
    ${row('IP address', ip || 'unknown')}
    ${row('Time', time)}
    <p style="font-size:14px;margin-top:16px;">If this was you, no action is needed. If not, change your password immediately in Settings &rarr; Security.</p>
  `)
  return { subject: '[Igris Radar] New sign-in detected', html, text: `${title} — IP: ${ip}, Time: ${time}` }
}

/** Password-changed confirmation. */
export function passwordChangedEmail({ name, time }) {
  const title = 'Your password was changed'
  const html = layout(title, `
    <p style="font-size:14px;">Hi ${name || 'there'}, your Igris Radar password was changed at ${time}.</p>
    <p style="font-size:14px;">If you did not make this change, contact support immediately.</p>
  `)
  return { subject: '[Igris Radar] Password changed', html, text: `${title} at ${time}` }
}

/** Scheduled-monitoring threshold alert — score dropped below the configured limit. */
export function monitoringAlertEmail({ name, scanType, url, score, threshold, frequency }) {
  const title = `Score alert: ${url} dropped to ${score}/100`
  const html = layout(title, `
    <p style="font-size:14px;">Hi ${name || 'there'}, your ${frequency} ${scanType.toUpperCase()} monitoring detected a score below your alert threshold.</p>
    ${row('Site', url)}
    ${row('Scan type', scanType.toUpperCase())}
    ${row('Score', `${score}/100`)}
    ${row('Your threshold', `${threshold}/100`)}
    <p style="font-size:14px;margin-top:16px;">Open the dashboard to review what changed and the recommended fixes.</p>
  `)
  return {
    subject: `[Igris Radar] ⚠ ${url} scored ${score}/100 (below your ${threshold} threshold)`,
    html,
    text: `${title} — threshold ${threshold}/100`,
  }
}

/** Weekly SEO & visibility digest. */
export function weeklyDigestEmail({ name, periodLabel, totals, sites }) {
  const siteRows = sites.map(s => `
    <div style="border:1px solid #1d2530;border-radius:6px;padding:12px 16px;margin:8px 0;">
      ${row('Site', s.domain)}
      ${s.seoScore != null ? row('Latest SEO score', `${s.seoScore}/100`) : ''}
      ${s.aeoScore != null ? row('Latest AEO score', `${s.aeoScore}/100`) : ''}
      ${s.geoScore != null ? row('Latest GEO score', `${s.geoScore}/100`) : ''}
    </div>`).join('')

  const html = layout(`Your weekly SEO &amp; visibility digest`, `
    <p style="font-size:14px;">Hi ${name || 'there'}, here is your summary for ${periodLabel}.</p>
    ${row('Scans run this week', String(totals.scans))}
    ${row('Sites monitored', String(totals.sites))}
    ${siteRows || '<p style="font-size:14px;color:#8b95a1;">No scans in the past 7 days — run an audit to populate next week’s digest.</p>'}
  `)
  return {
    subject: `[Igris Radar] Weekly digest — ${totals.scans} scan${totals.scans === 1 ? '' : 's'}, ${totals.sites} site${totals.sites === 1 ? '' : 's'}`,
    html,
    text: `Weekly digest for ${periodLabel}: ${totals.scans} scans across ${totals.sites} sites.`,
  }
}

/** Internal: New user signup alert sent to support */
export function newUserSignupEmail({ email, name, time }) {
  const title = 'New User Signup'
  const html = layout(title, `
    <p style="font-size:14px;">A new user has just registered for Igris Radar.</p>
    ${row('Name', name || 'N/A')}
    ${row('Email', email)}
    ${row('Time', time)}
  `)
  return { subject: `[Internal] New User Signup: ${email}`, html, text: `New user signup: ${name} (${email}) at ${time}` }
}

/** Internal: Contact form submission */
export function contactFormEmail({ firstName, lastName, email, message, time }) {
  const title = 'New Contact Form Submission'
  const html = layout(title, `
    <p style="font-size:14px;">A new message was submitted via the contact form.</p>
    ${row('Name', `${firstName} ${lastName}`)}
    ${row('Email', email)}
    ${row('Time', time)}
    <div style="margin-top:16px;padding:16px;background:#1d2530;border-radius:6px;font-size:14px;color:#d7dde3;white-space:pre-wrap;">${message}</div>
  `)
  return { subject: `[Internal] Contact Form: ${firstName} ${lastName}`, html, text: `Contact from: ${firstName} ${lastName} (${email})\n\nMessage:\n${message}` }
}
