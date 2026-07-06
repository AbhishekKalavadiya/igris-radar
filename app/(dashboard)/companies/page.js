'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Loader2, Globe, ArrowRight, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { PageTransition, Stagger, MotionItem } from '@/components/ui/motion';
import { ListSkeleton } from '@/components/ui/PageSkeleton';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api?path=companies&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setCompanies(data.data);
      }
    } catch {
      toast({ title: 'Error loading companies', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    if (!newDomain) return;
    setAdding(true);
    try {
      const res = await fetch('/api?path=companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Company Added', description: `${data.data.domain} has been added.` });
        setCompanies([data.data, ...companies.filter(c => c.domain !== data.data.domain)]);
        setAddModalOpen(false);
        setNewDomain('');
      } else {
        toast({ title: 'Error adding company', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Companies Hub"
        description="Manage and view scan history for all your tracked domains."
        actions={
          <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-primary text-white button-shine">
                <Plus className="h-4 w-4" /> Add New Company
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-elevated">
              <DialogHeader>
                <DialogTitle>Add a Company to Track</DialogTitle>
                <DialogDescription>
                  Enter the domain name of the company. We'll automatically start organizing its scan history here.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label htmlFor="new-domain" className="text-sm font-medium mb-2 block">Domain URL</label>
                <Input
                  id="new-domain"
                  placeholder="e.g. apple.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCompany(); }}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddCompany} disabled={adding || !newDomain}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Company
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Companies Found"
          description="You haven't added or scanned any companies yet. Add a new domain to get started."
          action={<Button onClick={() => setAddModalOpen(true)}>Add your first company</Button>}
        />
      ) : (
        <Stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company) => (
            <MotionItem key={company.id}>
              <Card className="glass-card group h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{company.name || company.domain}</CardTitle>
                      <CardDescription className="truncate font-mono text-xs">{company.domain}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4 flex-1">
                  <p className="text-xs text-muted-foreground">
                    Added on {new Date(company.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/companies/${company.domain}`} className="w-full">
                    <Button variant="outline" className="w-full group-hover:bg-primary/5 group-hover:border-primary/40 transition-colors gap-2">
                      View Scan History <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </MotionItem>
          ))}
        </Stagger>
      )}
    </PageTransition>
  );
}
