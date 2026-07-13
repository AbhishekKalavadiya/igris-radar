import Link from 'next/link';
import { ArrowLeft, Search, Link as LinkIcon, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'What is a Canonical Tag? | Igris Radar Knowledge Base',
  description: 'A quick definition of a Canonical Tag and how it prevents duplicate content issues in SEO.',
  alternates: {
    canonical: '/learn/what-is-a-canonical-tag',
  },
};

export default function CanonicalTagPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
            Glossary: Technical SEO
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            What is a Canonical Tag?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A canonical tag (`rel="canonical"`) is an HTML snippet that tells search engines which version of a URL is the "master" copy.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-orange-500" />
              Solving Duplicate Content
            </h2>
            <p>
              If you have the exact same content on `website.com/shirts` and `website.com/shirts?color=red`, Google gets confused about which one to rank. A canonical tag points the `?color=red` page back to the main `/shirts` page, consolidating your SEO ranking power into one single URL.
            </p>
          </section>

          <Card className="bg-orange-500/5 border-orange-500/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <SearchCheck className="h-4 w-4 text-orange-500" />
                Find Missing Canonicals with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Missing canonical tags can silently split your ranking authority. Igris Radar crawls your site to ensure every page clearly declares its canonical source.
              </p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild size="sm">
                <Link href="/">Run SEO Scan</Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </article>
  );
}
