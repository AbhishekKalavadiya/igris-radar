import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Sparkles, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'How 404 Errors Impact AI Engine Optimization (AEO) | Igris',
  description: 'Learn what a 404 error is and discover why broken links severely damage your visibility in AI engines like ChatGPT, Claude, and Gemini.',
  alternates: {
    canonical: '/learn/what-is-a-404-error-and-how-it-affects-aeo',
  },
};

export default function AEO404ErrorPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">
            AI Engine Optimization (AEO)
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            How 404 Errors Impact AI Engine Optimization (AEO)
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A 404 error might seem like a minor technical hiccup, but in the era of Generative AI and Large Language Models (LLMs), a broken link can cost you your brand's authority.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              What is a 404 Error?
            </h2>
            <p>
              A <strong>404 Not Found</strong> error happens when a server can't find the requested webpage. To humans, it's annoying. To automated crawlers, it's a roadblock.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Why AI Engines Hate 404 Errors
            </h2>
            <p>
              AI bots (like OpenAI's GPTBot) build <em>knowledge graphs</em>. When they hit a 404 error:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Context Breaks:</strong> The AI fails to connect your content.</li>
              <li><strong>Trust Drops:</strong> LLMs prefer reliable sources. Broken links signal unmaintained data, lowering your domain's factual authority.</li>
            </ul>
          </section>

          <Card className="bg-primary/5 border-primary/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <SearchCheck className="h-4 w-4 text-primary" />
                The Igris Advantage
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Igris Radar Scanner simulates AI bots to find every 404 error before the LLMs crawl it.
              </p>
              <Button asChild size="sm">
                <Link href="/">Run a Free Scan Now</Link>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">How to Fix It</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>Identify:</strong> Scan for broken links continuously.</li>
              <li><strong>Redirect:</strong> Use a 301 redirect if the page moved.</li>
              <li><strong>Remove:</strong> Delete dead links from source text.</li>
            </ol>
          </section>

        </div>
      </div>
    </article>
  );
}
