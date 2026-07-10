import Link from 'next/link';
import { buildMetadata, breadcrumbJsonLd, SITE_NAME } from '@/lib/seo';
import JsonLd from '@/components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Privacy Policy - Igris Radar',
  description:
    'How Igris Radar collects, uses, and protects your data across our security, SEO, AEO, GEO, brand visibility, and site health audit platform.',
  path: '/landing/privacy',
});

const LAST_UPDATED = 'July 7, 2026';

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    body: (
      <p>
        This Privacy Policy explains what data {SITE_NAME} ("we", "us", "our") collects when you use
        our website, dashboard, and audit tools (the "Service"), how we use it, and the choices you
        have. By using the Service, you agree to the practices described here.
      </p>
    ),
  },
  {
    id: 'data-we-collect',
    title: '2. Data we collect',
    body: (
      <>
        <p className="font-semibold text-foreground">Account data</p>
        <p>
          When you sign up, we store your name, email address, and a bcrypt-hashed password. We
          never store your plaintext password, and it is never returned by our API.
        </p>
        <p className="font-semibold text-foreground mt-2">Audit and scan data</p>
        <p>
          When you run a scan, we store the target URL, the findings and scores our engines
          generate, and a timestamped scan history tied to your account so you can track progress
          over time.
        </p>
        <p className="font-semibold text-foreground mt-2">Usage and device data</p>
        <p>
          We automatically log request metadata such as IP address, user agent, and timestamps for
          security, rate-limiting, and abuse-prevention purposes (see Section 5).
        </p>
        <p className="font-semibold text-foreground mt-2">Payment data</p>
        <p>
          Paid plans are processed by Stripe. We do not store your card number; Stripe handles
          payment data under its own privacy policy.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: '3. How we use your data',
    body: (
      <ul className="list-disc pl-6 space-y-1.5 marker:text-primary">
        <li>To operate the Service - running audits, storing results, and rendering your dashboard.</li>
        <li>To authenticate you and keep your account secure via session cookies.</li>
        <li>To enforce plan limits (scan counts, tracked sites) tied to your account.</li>
        <li>To send account, security, and billing emails (e.g. login alerts, password changes, scan-complete notifications).</li>
        <li>To detect and prevent abuse, fraud, and security incidents.</li>
        <li>To improve the accuracy of our audit engines and scoring methodology.</li>
      </ul>
    ),
  },
  {
    id: 'cookies',
    title: '4. Cookies and sessions',
    body: (
      <>
        <p>
          We use a single HttpOnly session cookie (<code className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded-sm">provenance_session</code>) to
          keep you signed in. It is set server-side, cannot be read by client-side JavaScript, and is
          cleared when you log out. We do not use third-party advertising or tracking cookies.
        </p>
        <p>
          A small amount of non-sensitive state (such as whether you've completed onboarding) is
          kept in your browser's local storage to avoid redundant server calls; no credentials or
          personal data are stored there.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: '5. Third-party services',
    body: (
      <>
        <p>Running an audit may send the target URL (never your account credentials) to third-party providers we use to power specific checks, including:</p>
        <ul className="list-disc pl-6 space-y-1.5 marker:text-primary">
          <li>Google (Custom Search, PageSpeed) - for SEO and site-health signals.</li>
          <li>Google Gemini, OpenAI, and Anthropic - for AI-driven deep analysis and AEO/GEO citation testing, where enabled.</li>
          <li>Perplexity - for answer-engine citation checks.</li>
          <li>Stripe - for billing and subscription management.</li>
          <li>Our email delivery provider (SMTP or Resend) - for transactional email.</li>
        </ul>
        <p>
          Each provider processes data under its own privacy policy and only receives the minimum
          information necessary to perform the specific check you requested.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: '6. Data retention',
    body: (
      <p>
        We retain account and scan data for as long as your account is active, so you can view
        historical trends. If you delete your account from Settings, we delete your account record
        and associated personal data within a reasonable period, except where we are required to
        retain limited records (e.g. billing records) for legal or accounting purposes.
      </p>
    ),
  },
  {
    id: 'security',
    title: '7. How we protect your data',
    body: (
      <ul className="list-disc pl-6 space-y-1.5 marker:text-primary">
        <li>Passwords are hashed with bcrypt (12 rounds) - never stored or logged in plaintext.</li>
        <li>Sessions are carried in HttpOnly, SameSite cookies, inaccessible to page scripts.</li>
        <li>All production traffic is served over HTTPS.</li>
        <li>Access to production data is limited to personnel who need it to operate the Service.</li>
        <li>We apply rate limiting and request-size limits to reduce abuse and denial-of-service risk.</li>
      </ul>
    ),
  },
  {
    id: 'your-rights',
    title: '8. Your rights and choices',
    body: (
      <>
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc pl-6 space-y-1.5 marker:text-primary">
          <li>Access, correct, or export the personal data we hold about you.</li>
          <li>Delete your account and associated personal data from Settings at any time.</li>
          <li>Object to or restrict certain processing, or withdraw consent where processing relies on it.</li>
          <li>Lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>
          To exercise any of these rights, email{' '}
          <a href="mailto:support@igrisecurity.com" className="text-primary hover:underline">support@igrisecurity.com</a>{' '}
          and we will respond within a reasonable timeframe.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: '9. Children\'s privacy',
    body: (
      <p>
        The Service is not directed at individuals under 18, and we do not knowingly collect
        personal data from children. If you believe a child has provided us with personal data,
        contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'international',
    title: '10. International data transfers',
    body: (
      <p>
        We and the third-party providers listed in Section 5 may process data in countries other
        than your own. Where required, we rely on appropriate safeguards (such as standard
        contractual clauses) to protect data transferred internationally.
      </p>
    ),
  },
  {
    id: 'changes',
    title: '11. Changes to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. Material changes will be reflected by
        updating the "Last updated" date below, and where appropriate, by notifying you via email or
        an in-product notice.
      </p>
    ),
  },
  {
    id: 'contact',
    title: '12. Contact',
    body: (
      <p>
        Questions about this Privacy Policy can be sent to{' '}
        <a href="mailto:support@igrisecurity.com" className="text-primary hover:underline">support@igrisecurity.com</a>{' '}
        or via our <Link href="/landing/contact" className="text-primary hover:underline">contact page</Link>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Privacy Policy', path: '/landing/privacy' },
      ])} />

      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% -10%, hsl(var(--accent)) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-10 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24">
        <div className="space-y-10">
          {SECTIONS.map(({ id, title, body }) => (
            <div key={id} id={id} className="scroll-mt-24">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
              <div className="mt-3 space-y-3 text-muted-foreground leading-relaxed">{body}</div>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            See also our <Link href="/landing/terms" className="text-primary hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
