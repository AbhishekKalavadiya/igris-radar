import Link from 'next/link';
import { ArrowLeft, BookA, SearchCheck } from 'lucide-react';
import { FINDING_EXPLANATIONS } from '@/lib/scannerExplanations';
import { slugify } from '@/lib/slugify';

export const metadata = {
  title: 'Vulnerability & SEO Rules Dictionary | Igris Radar',
  description: 'An A-Z dictionary of every security vulnerability, technical SEO issue, and AEO rule detected by the Igris Radar scanner.',
};

export default function RulesDirectoryPage() {
  // Extract all rule titles, sort them alphabetically
  const rules = Object.keys(FINDING_EXPLANATIONS).sort((a, b) => a.localeCompare(b));

  // Group rules by their first letter
  const groupedRules = rules.reduce((acc, rule) => {
    const letter = rule.charAt(0).toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(rule);
    return acc;
  }, {});

  const letters = Object.keys(groupedRules).sort();

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Back Link */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Knowledge Base
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
          <BookA className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Rules Dictionary
        </h1>
        <p className="text-lg text-muted-foreground">
          An A-Z index of every security vulnerability, technical SEO flaw, and AI optimization rule the Igris Radar detects.
        </p>
      </div>

      {/* A-Z Jump Links */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-wrap justify-center gap-2 p-4 bg-muted/30 rounded-xl border border-border/50">
          {letters.map(letter => (
            <a 
              key={letter} 
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary hover:text-primary-foreground font-medium text-sm transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>
      </div>

      {/* Directory Listing */}
      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-12">
        {letters.map(letter => (
          <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
            <h2 className="text-3xl font-bold border-b pb-2 mb-6 text-foreground/80 flex items-center gap-3">
              <span className="bg-primary text-primary-foreground w-10 h-10 flex items-center justify-center rounded-lg shadow-sm">
                {letter}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {groupedRules[letter].map(rule => (
                <Link 
                  key={rule} 
                  href={`/learn/rules/${slugify(rule)}`}
                  className="group flex items-start gap-2 py-2 hover:bg-muted/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <SearchCheck className="h-4 w-4 mt-1 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  <span className="font-medium text-foreground/90 group-hover:text-primary transition-colors">
                    {rule}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

    </div>
  );
}
