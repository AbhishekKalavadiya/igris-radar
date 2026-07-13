import Link from 'next/link';
import { ArrowLeft, Lock, GlobeLock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'What is an SSL Certificate? | Igris Radar Knowledge Base',
  description: 'A quick definition of an SSL Certificate and why it is required for both security and SEO.',
  alternates: {
    canonical: '/learn/what-is-an-ssl-certificate',
  },
};

export default function SSLCertificatePage() {
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
            What is an SSL Certificate?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            SSL (Secure Sockets Layer) is the standard technology for keeping an internet connection secure. It is the difference between `http://` and `https://`.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <GlobeLock className="h-5 w-5 text-igris-teal" />
              The Padlock Icon
            </h2>
            <p>
              An SSL certificate encrypts the data sent between a user's browser and your website. Without it, hackers can intercept passwords and credit card numbers. Because of this, search engines heavily penalize sites that do not have an active SSL certificate.
            </p>
          </section>

          <Card className="bg-igris-teal/5 border-igris-teal/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-igris-teal" />
                Monitor SSL Expirations with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Forgetting to renew an SSL certificate will instantly break your website and destroy your SEO. Igris Radar monitors your certificates and alerts you before they expire.
              </p>
              <Button className="bg-igris-teal hover:bg-igris-dark text-white" asChild size="sm">
                <Link href="/">Check SSL Status</Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </article>
  );
}
