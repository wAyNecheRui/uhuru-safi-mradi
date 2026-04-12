import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { PlayCircle, Loader2, CheckCircle, XCircle, ListChecks } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkBiddingPanelProps {
  reports: any[];
  openBidding: (reportId: string) => Promise<boolean>;
  onComplete: () => void;
}

const BulkBiddingPanel: React.FC<BulkBiddingPanelProps> = ({ reports, openBidding, onComplete }) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === reports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reports.map(r => r.id)));
    }
  };

  const handleBulkOpen = async () => {
    setProcessing(true);
    let success = 0, fail = 0;

    for (const id of selectedIds) {
      try {
        const result = await openBidding(id);
        if (result) success++; else fail++;
      } catch {
        fail++;
      }
    }

    toast({
      title: 'Bulk Bidding Complete',
      description: `${success} opened${fail > 0 ? `, ${fail} failed` : ''}`,
      variant: fail > 0 ? 'destructive' : 'default'
    });

    setProcessing(false);
    setShowDialog(false);
    setSelectedIds(new Set());
    onComplete();
  };

  if (reports.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={selectAll}>
        <ListChecks className="h-4 w-4 mr-1" />
        {selectedIds.size === reports.length ? 'Deselect All' : 'Select All'}
      </Button>

      {reports.map(r => (
        <div key={r.id} className="flex items-center gap-1.5">
          <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
          <span className="text-xs truncate max-w-[120px]">{r.title}</span>
        </div>
      ))}

      {selectedIds.size > 1 && (
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <PlayCircle className="h-4 w-4 mr-1" />
          Open Bidding ({selectedIds.size})
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Open Bidding for {selectedIds.size} Reports</DialogTitle>
            <DialogDescription>
              All selected approved reports will be opened for contractor bidding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={processing}>Cancel</Button>
            <Button onClick={handleBulkOpen} disabled={processing}>
              {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Opening...</> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkBiddingPanel;
