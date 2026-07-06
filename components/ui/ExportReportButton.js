'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export default function ExportReportButton({ scanResult, scanType = 'audit' }) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  if (!scanResult) return null;

  const handleExportJson = () => {
    const dataStr = JSON.stringify(scanResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `provenance-${scanType}-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`/api?path=export/pdf&scanType=${scanType}&scanId=${scanResult.id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate PDF');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `igris-radar-${scanType}-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Export failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-card border-border shadow-igris-sm" disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Preparing...' : 'Export Report'}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 border-border">
        <DropdownMenuItem onClick={handleExportPdf} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span>Save as PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJson} className="gap-2 cursor-pointer">
          <FileJson className="h-4 w-4 text-muted-foreground" />
          <span>Export JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
