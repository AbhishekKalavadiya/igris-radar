import { Mail, MessageSquare, CreditCard, Handshake } from 'lucide-react';
import ContactForm from '@/components/landing/ContactForm';
import { Button } from '@/components/ui/button';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Contact Igris Radar: Sales, Support & Enterprise',
  description:
    'Talk to the Igris Radar team about enterprise plans, agency partnerships, product support, or anything about AI search visibility, AEO, and GEO.',
  path: '/landing/contact',
});

const REASONS = [
  { icon: CreditCard, title: 'Enterprise & custom plans', text: 'Unlimited sites, custom terms, procurement and security reviews. Tell us what your rollout needs.' },
  { icon: Handshake, title: 'Agencies & partners', text: 'White-label reports, API access and multi-client workflows are built for agencies. Let\'s talk volume.' },
  { icon: MessageSquare, title: 'Product questions', text: 'Not sure whether AEO or GEO is your bottleneck? Describe your situation and we\'ll point you at the right audit.' },
];

export default function ContactPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Contact', path: '/landing/contact' },
      ])} />
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% -10%, hsl(var(--accent)) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-12 text-center relative">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Get in touch</h1>
          <p className="mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
            Whether you need a custom enterprise plan or have a question about our AEO metrics,
            the team reads everything.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Form */}
          <ContactForm />

          {/* Reasons + direct */}
          <div className="space-y-5">
            {REASONS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 flex items-start gap-4">
                <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{text}</p>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-border bg-muted/50 p-6 flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Prefer email?</h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Write to <span className="font-mono text-foreground">support@igrisecurity.com</span> and it lands in the same inbox.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
