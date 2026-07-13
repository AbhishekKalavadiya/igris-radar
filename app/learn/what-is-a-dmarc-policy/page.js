import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Fingerprint, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'What is a DMARC Policy? | Igris Radar Knowledge Base',
  description: 'Understand how a DMARC policy protects your domain from spoofing and phishing attacks, and why it is critical for email deliverability.',
  alternates: {
    canonical: '/learn/what-is-a-dmarc-policy',
  },
};

export default function DMARCPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-igris-teal/10 text-igris-teal hover:bg-igris-teal/20">
            Security & Integrity
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            What is a DMARC Policy?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            DMARC is the ultimate gatekeeper for your domain's emails. Without it, scammers can easily forge emails that look like they came from you.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-500" />
              The Spoofing Problem
            </h2>
            <p>
              By default, anyone can send an email and pretend it came from your domain. If scammers spoof your domain to send phishing emails, email providers (like Gmail) will punish <em>your</em> reputation.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-blue-500" />
              How DMARC Works
            </h2>
            <p>
              DMARC (Domain-based Message Authentication, Reporting, and Conformance) relies on two other records: <strong>SPF</strong> and <strong>DKIM</strong>. It tells email providers exactly what to do if an email fails authentication:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>None:</strong> Monitor only. Do nothing.</li>
              <li><strong>Quarantine:</strong> Send unauthenticated emails to the spam folder.</li>
              <li><strong>Reject:</strong> Block unauthenticated emails completely.</li>
            </ul>
          </section>

          <Card className="bg-igris-teal/5 border-igris-teal/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-igris-teal" />
                Audit Your DMARC with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Setting up DMARC incorrectly can accidentally block your own legitimate emails. Igris Radar instantly verifies if your policy is secure and properly configured.
              </p>
              <Button className="bg-igris-teal hover:bg-igris-dark text-white" asChild size="sm">
                <Link href="/">Run Security Audit</Link>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">How to Fix It</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>Scan:</strong> Check your current DNS records.</li>
              <li><strong>Configure SPF & DKIM:</strong> Ensure your authorized senders are validated.</li>
              <li><strong>Publish DMARC:</strong> Add a TXT record starting at `p=none` and slowly move to `p=reject`.</li>
            </ol>
          </section>

        </div>
      </div>
    </article>
  );
}
