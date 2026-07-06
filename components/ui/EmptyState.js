'use client';

/**
 * Uniform "nothing here yet" block with icon, message and optional action.
 */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={`py-12 px-6 text-center border border-dashed border-border rounded-lg bg-background/30 ${className || ''}`}>
      {Icon && (
        <div className="mx-auto mb-4 h-12 w-12 rounded-lg bg-muted/50 border border-border flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
