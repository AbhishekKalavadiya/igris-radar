'use client';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FILTERS = ['all', 'failed', 'critical', 'high', 'medium', 'low', 'passed'];

/**
 * Search + severity filter chips for findings lists.
 * Controlled: parent owns `query` and `severity` state.
 */
export default function FindingsToolbar({ query, onQueryChange, severity, onSeverityChange, counts = {} }) {
  return (
    <div className="flex flex-col md:flex-row gap-3 md:items-center">
      <div className="relative md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search findings…"
          className="pl-9 h-9 bg-background/50"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          aria-label="Search findings"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => {
          const active = severity === f;
          const count = counts[f];
          return (
            <button
              key={f}
              type="button"
              onClick={() => onSeverityChange(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors capitalize
                ${active
                  ? 'bg-primary/15 border-primary/50 text-primary'
                  : 'bg-background/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'}`}
            >
              {f}
              {typeof count === 'number' && <span className="ml-1.5 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Filter helper shared by all scanner pages. */
export function filterFindings(findings, query, severity) {
  let out = findings;
  if (severity === 'failed') out = out.filter((f) => !f.passed && f.severity !== 'passed');
  else if (severity === 'passed') out = out.filter((f) => f.passed || f.severity === 'passed');
  else if (severity !== 'all') out = out.filter((f) => f.severity === severity && !f.passed);
  if (query) {
    const q = query.toLowerCase();
    out = out.filter(
      (f) =>
        f.title?.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
    );
  }
  return out;
}
