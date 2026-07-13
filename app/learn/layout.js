import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Igris Radar Knowledge Base',
  description: 'Learn about AEO, GEO, Technical SEO, and Domain Security. Understand how these metrics affect your digital presence and how to optimize them.',
};

export default function LearnLayout({ children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Knowledge Base Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/learn" className="flex items-center gap-2 font-bold text-lg text-primary hover:opacity-80 transition-opacity">
            <BookOpen className="h-5 w-5 text-igris-teal" />
            <span>Igris Radar Knowledge Base</span>
          </Link>
          <nav>
            <Button variant="outline" size="sm" asChild>
              <Link href="/">Back to App</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container mx-auto px-4 py-12 md:py-16 max-w-5xl">
        {children}
      </main>
      
      {/* Simple Footer for SEO pages */}
      <footer className="border-t py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Igris. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
