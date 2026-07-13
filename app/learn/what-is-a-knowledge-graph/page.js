import Link from 'next/link';
import { ArrowLeft, Sparkles, Brain, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'What is a Knowledge Graph? | Igris Radar Knowledge Base',
  description: 'A quick definition of a Knowledge Graph and why it matters for AEO.',
  alternates: {
    canonical: '/learn/what-is-a-knowledge-graph',
  },
};

export default function KnowledgeGraphPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-purple-500/10 text-purple-600 hover:bg-purple-500/20">
            Glossary: AEO
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            What is a Knowledge Graph?
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            A Knowledge Graph is how AI models store and connect information, treating entities as a web of relationships rather than just flat text.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Connecting the Dots
            </h2>
            <p>
              When Google or ChatGPT reads your website, it doesn't just index keywords. It builds a graph. It links your "Company Name" (Entity A) to your "CEO" (Entity B) and your "Product" (Entity C). The stronger and clearer these connections are, the higher you rank in AI-generated answers.
            </p>
          </section>

          <Card className="bg-purple-500/5 border-purple-500/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <SearchCheck className="h-4 w-4 text-purple-500" />
                Analyze Your Graph with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you feeding AI the right data? Igris Radar scans your semantic HTML and structured data to ensure your Knowledge Graph connections are perfectly clear to bots.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" asChild size="sm">
                <Link href="/">Check Structured Data</Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </article>
  );
}
