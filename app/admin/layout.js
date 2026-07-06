export const metadata = {
  title: 'Admin Portal | Provenance',
  description: 'Global plan limit and feature configuration.',
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {children}
    </div>
  );
}
