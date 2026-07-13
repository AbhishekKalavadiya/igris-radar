import Link from 'next/link';
import { ArrowLeft, Shield, MailCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'What is an SPF Record? | Igris Radar Knowledge Base',
  description: 'A quick definition of an SPF (Sender Policy Framework) record and why it matters for email security.',
  alternates: {
    canonical: '/learn/what-is-an-spf-record',
  },
};

export default function SPFRecordPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-igris-teal/10 text-igris-teal hover:bg-igris-teal/20">
            Glossary: Security
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            What is an SPF Record?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Sender Policy Framework (SPF) is a DNS record that lists exactly which servers are allowed to send emails on behalf of your domain.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <MailCheck className="h-5 w-5 text-igris-teal" />
              The Guest List for Emails
            </h2>
            <p>
              Think of an SPF record like a VIP guest list at a club. When an email arrives at a provider (like Gmail) claiming to be from `@yourcompany.com`, the provider checks the SPF record. If the server that sent the email isn't on the list, the email is bounced or marked as spam.
            </p>
          </section>

          <Card className="bg-igris-teal/5 border-igris-teal/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-igris-teal" />
                Check Your SPF with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                A missing or misconfigured SPF record leaves you vulnerable to spoofing. Igris Radar verifies your SPF syntax instantly.
              </p>
              <Button className="bg-igris-teal hover:bg-igris-dark text-white" asChild size="sm">
                <Link href="/">Verify SPF Record</Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </article>
  );
}
