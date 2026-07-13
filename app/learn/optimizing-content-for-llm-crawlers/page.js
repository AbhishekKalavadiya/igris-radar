import Link from 'next/link';
import { ArrowLeft, Bot, FileText, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Optimizing Content for LLM Crawlers | Igris Radar Knowledge Base',
  description: 'Learn how to structure your website so that Large Language Models (LLMs) can properly read, index, and cite your brand.',
  alternates: {
    canonical: '/learn/optimizing-content-for-llm-crawlers',
  },
};

export default function LLMCrawlerPage() {
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
            Optimizing Content for LLM Crawlers
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            AI bots don't care about your website's CSS or visual layout. They care about raw text, structure, and factual density.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Bot className="h-5 w-5 text-purple-500" />
              How LLM Crawlers Work
            </h2>
            <p>
              Crawlers like GPTBot (OpenAI) or ClaudeBot scan your site to build training data. They strip away heavy JavaScript and styling to extract the core text. If your text relies heavily on client-side rendering without proper HTML structure, the bots see a blank page.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              The Factual Density Rule
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Semantic HTML:</strong> Use `h1`, `h2`, `article`, and `table` tags correctly.</li>
              <li><strong>Clear Entities:</strong> Explicitly name your product and features. Avoid vague pronouns.</li>
              <li><strong>Provide a `/llms.txt`:</strong> A dedicated markdown file summarizing your core documentation explicitly for AI consumption.</li>
            </ul>
          </section>

          <Card className="bg-primary/5 border-primary/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <SearchCheck className="h-4 w-4 text-primary" />
                Analyze Your AEO with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Igris Radar analyzes your page exactly how an LLM crawler sees it, highlighting missing entities and poor semantic structure.
              </p>
              <Button asChild size="sm">
                <Link href="/">Test Your Content Structure</Link>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">How to Fix It</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>Audit:</strong> Use an AEO scanner to view your page as a bot.</li>
              <li><strong>Structure Data:</strong> Implement JSON-LD schema markup.</li>
              <li><strong>Clean Code:</strong> Ensure essential text loads without requiring JavaScript interaction.</li>
            </ol>
          </section>

        </div>
      </div>
    </article>
  );
}
