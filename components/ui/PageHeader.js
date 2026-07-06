'use client';

/**
 * Standard dashboard page header: accent icon chip + title + description,
 * with an optional right-aligned actions slot.
 */
export default function PageHeader({ icon: Icon, title, description, accent, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${accent?.bgSoft || 'bg-primary/10'} ${accent?.border || 'border-primary/30'}`}>
            <Icon className={`h-6 w-6 ${accent?.text || 'text-primary'}`} />
          </div>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
