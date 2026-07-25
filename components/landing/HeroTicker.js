'use client';

const ENGINES = [
  'ChatGPT', 'Gemini', 'Perplexity', 'Claude', 'Google AI Overviews', 'Bing Chat',
];

export default function HeroTicker() {
  const doubled = [...ENGINES, ...ENGINES];
  return (
    <div className="mt-12 pt-6 border-t border-border/40 overflow-hidden">
      <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-4 font-medium">
        Monitoring brand citations across leading AI search engines
      </p>
      <div className="relative overflow-hidden">
        <div className="animate-ticker gap-10 flex">
          {doubled.map((engine, i) => (
            <span key={i} className="flex items-center gap-2 shrink-0 text-sm font-medium text-muted-foreground px-4">
              <span className="text-primary">◆</span>
              <span className="text-foreground">{engine}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
