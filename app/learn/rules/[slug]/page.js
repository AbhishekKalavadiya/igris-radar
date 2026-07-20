import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldAlert, Activity, SearchCheck, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FINDING_EXPLANATIONS } from '@/lib/scannerExplanations';
import { slugify } from '@/lib/slugify';

// Pre-compute a map of slug -> original title
const SLUG_MAP = new Map();
Object.keys(FINDING_EXPLANATIONS).forEach(title => {
  SLUG_MAP.set(slugify(title), title);
});

export function generateStaticParams() {
  return Array.from(SLUG_MAP.keys()).map((slug) => ({
    slug: slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = params;
  const originalTitle = SLUG_MAP.get(slug);

  // No fallback metadata needed here: the page component below calls
  // notFound() for unknown slugs, which discards this function's return
  // value entirely and serves a real 404 with the parent layout's
  // metadata instead - verified via curl (404 status, inherited title).
  if (!originalTitle) {
    notFound();
  }

  // Generate a snippet of the explanation for the meta description
  const explanation = FINDING_EXPLANATIONS[originalTitle];
  const snippet = explanation.substring(0, 150) + (explanation.length > 150 ? '...' : '');

  return {
    title: `${originalTitle} | Igris Radar Rules Dictionary`,
    description: snippet,
    alternates: {
      canonical: `/learn/rules/${slug}`,
    },
  };
}

export default function RuleDefinitionPage({ params }) {
  const { slug } = params;
  const originalTitle = SLUG_MAP.get(slug);

  if (!originalTitle) {
    notFound();
  }

  const explanation = FINDING_EXPLANATIONS[originalTitle];

  // Try to intelligently guess the icon/color based on keywords in the title or explanation
  let Icon = SearchCheck;
  let colorClass = 'text-primary';
  let bgClass = 'bg-primary/10';
  let badgeText = 'Scanner Rule';

  const lowerStr = (originalTitle + ' ' + explanation).toLowerCase();
  
  if (lowerStr.includes('seo') || lowerStr.includes('tag') || lowerStr.includes('link')) {
    Icon = Globe;
    colorClass = 'text-orange-600';
    bgClass = 'bg-orange-500/10';
    badgeText = 'SEO Check';
  } else if (lowerStr.includes('security') || lowerStr.includes('vulnerability') || lowerStr.includes('xss')) {
    Icon = ShieldAlert;
    colorClass = 'text-red-500';
    bgClass = 'bg-red-500/10';
    badgeText = 'Security Vulnerability';
  } else if (lowerStr.includes('ssl') || lowerStr.includes('tls') || lowerStr.includes('certificate')) {
    Icon = Lock;
    colorClass = 'text-igris-teal';
    bgClass = 'bg-igris-teal/10';
    badgeText = 'SSL / Encryption';
  } else if (lowerStr.includes('ai') || lowerStr.includes('llm') || lowerStr.includes('gpt')) {
    Icon = Activity;
    colorClass = 'text-purple-600';
    bgClass = 'bg-purple-500/10';
    badgeText = 'AEO / AI Optimization';
  }

  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 py-8 px-4">
      <Link href="/learn/rules" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Rules Directory
      </Link>

      <div className="space-y-8">
        <div className="space-y-4">
          <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${bgClass} ${colorClass} border-transparent`}>
            {badgeText}
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            {originalTitle}
          </h1>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed">
          
          <section className="space-y-4 pt-4">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Icon className={`h-6 w-6 ${colorClass}`} />
              What is this?
            </h2>
            <p className="text-lg">
              {explanation}
            </p>
          </section>

          <Card className={`${bgClass.replace('/10', '/5')} border-${colorClass.split('-')[1]}-500/20 my-8 shadow-sm`}>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Icon className={`h-5 w-5 ${colorClass}`} />
                How Igris Radar detects it
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                The Igris Radar scanner automatically flags <strong>{originalTitle}</strong> during its comprehensive audit of your web property. We simulate real-world crawlers and attack vectors to find issues before they impact your business.
              </p>
              <Button className={`w-full sm:w-auto bg-${colorClass.split('-')[1]}-600 hover:bg-${colorClass.split('-')[1]}-700 text-white`} asChild>
                <Link href="/">Scan your site for this issue</Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </article>
  );
}
