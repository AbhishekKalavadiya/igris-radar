import Link from 'next/link';
import { ArrowLeft, Brain, Network, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Brand Entity Recognition in Generative AI | Igris Radar Knowledge Base',
  description: 'Understand how AI models perceive your brand as an entity and how to influence Generative Engine Optimization (GEO).',
  alternates: {
    canonical: '/learn/brand-entity-recognition-in-generative-ai',
  },
};

export default function BrandEntityPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            Generative Engine Optimization (GEO)
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            Brand Entity Recognition
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            When a user asks ChatGPT to recommend a product in your industry, will it mention you? That depends on your Brand Entity strength.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              What is an Entity?
            </h2>
            <p>
              To an AI, a word isn't just text; it's a node in a massive neural network called an <em>Entity</em>. If your brand is a strong entity, the AI understands what you do, who your competitors are, and why you are valuable.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Network className="h-5 w-5 text-indigo-500" />
              How AI Learns Your Brand
            </h2>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Co-occurrence:</strong> How often your brand name appears next to key industry terms across the entire internet.</li>
              <li><strong>Sentiment:</strong> Is the context surrounding your brand name generally positive or negative?</li>
              <li><strong>Authoritative Citations:</strong> Mentions on high-trust domains (like Wikipedia or major news outlets) act as strong signals to the AI.</li>
            </ul>
          </section>

          <Card className="bg-blue-500/5 border-blue-500/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                Track Your Entity with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Igris Radar continuously monitors the web and AI responses to calculate your Brand Entity Score, alerting you to shifts in sentiment or visibility.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" asChild size="sm">
                <Link href="/">Check Brand Visibility</Link>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">How to Fix It</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>Consistent Messaging:</strong> Use the same exact phrasing to describe your product everywhere.</li>
              <li><strong>Digital PR:</strong> Get cited on high-authority domains.</li>
              <li><strong>Schema Markup:</strong> Use `Organization` schema to explicitly tell crawlers who you are.</li>
            </ol>
          </section>

        </div>
      </div>
    </article>
  );
}
