import Link from 'next/link';
import { ArrowLeft, ShieldCheck, MailWarning, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Understanding Domain Reputation for Email Security | Igris',
  description: 'Learn what domain reputation is, how ISPs use it to filter spam, and why continuous security monitoring is essential to keep your emails out of the spam folder.',
  alternates: {
    canonical: '/learn/understanding-domain-reputation-for-email-security',
  },
};

export default function DomainReputationPage() {
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
            Understanding Domain Reputation for Email Security
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Your domain reputation is essentially your digital credit score. If it drops, your critical communications, marketing emails, and system alerts go straight to the spam folder.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              What is Domain Reputation?
            </h2>
            <p>
              It's your domain's digital credit score. ISPs (like Gmail and Outlook) score your domain based on how users interact with your emails. A low score means your emails go to spam.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <MailWarning className="h-5 w-5 text-destructive" />
              What Causes a Bad Reputation?
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>High Bounces:</strong> Emailing inactive addresses.</li>
              <li><strong>Spam Complaints:</strong> Users marking your email as spam.</li>
              <li><strong>Missing Security:</strong> Lacking SPF, DKIM, or DMARC allows spoofers to ruin your reputation.</li>
            </ul>
          </section>

          <Card className="bg-igris-teal/5 border-igris-teal/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-igris-teal" />
                Protect Your Reputation with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Igris Radar Security Scanner continuously audits your DNS records to ensure SPF, DKIM, and DMARC are properly configured.
              </p>
              <Button className="bg-igris-teal hover:bg-igris-dark text-white" asChild size="sm">
                <Link href="/">Audit Your Domain Now</Link>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">How to Fix It</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>Implement DMARC:</strong> Prevent unauthorized senders.</li>
              <li><strong>Clean Lists:</strong> Remove bounced emails.</li>
              <li><strong>Monitor Blacklists:</strong> Ensure you aren't flagged.</li>
            </ol>
          </section>

        </div>
      </div>
    </article>
  );
}
