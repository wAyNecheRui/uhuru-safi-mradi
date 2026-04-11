import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Wallet, Loader2, CheckCircle, XCircle, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ReleasableMilestone {
  id: string;
  title: string;
  projectTitle: string;
  amount: number;
  paymentPercentage: number;
}

interface BulkPaymentReleaseProps {
  milestones: ReleasableMilestone[];
  onComplete: () => void;
}

const BulkPaymentRelease: React.FC<BulkPaymentReleaseProps> = ({ milestones, onComplete }) => {
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
    if (selectedIds.size === milestones.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(milestones.map(m => m.id)));
    }
  };

  const totalAmount = milestones
    .filter(m => selectedIds.has(m.id))
    .reduce((sum, m) => sum + m.amount, 0);

  const handleBulkRelease = async () => {
    setProcessing(true);
    let success = 0, fail = 0;

    const { data: { user } } = await supabase.auth.getUser();
    
    for (const id of selectedIds) {
      try {
        const idempotencyKey = `release-${id}-${user?.id}-${Date.now()}`;
        const { error } = await supabase.functions.invoke('release-milestone-payment', {
          body: { milestoneId: id },
          headers: { 'X-Idempotency-Key': idempotencyKey }
        });
        if (error) throw error;
        success++;
      } catch {
        fail++;
      }
    }

    toast({
      title: '💰 Bulk Payment Release Complete',
      description: `${success} released, ${fail} failed. (Demo Mode)`,
      variant: fail > 0 ? 'destructive' : 'default'
    });

    setProcessing(false);
    setShowDialog(false);
    setSelectedIds(new Set());
    onComplete();
  };

  if (milestones.length === 0) return null;

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-green-600" />
            Bulk Payment Release
            <Badge variant="outline" className="text-[10px]">Demo</Badge>
          </div>
          {milestones.length > 1 && (
            <Button variant="outline" size="sm" onClick={selectAll}>
              <ListChecks className="h-3 w-3 mr-1" />
              {selectedIds.size === milestones.length ? 'Deselect' : 'Select All'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {milestones.map(m => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selectedIds.has(m.id)} onCheckedChange={() => toggleSelect(m.id)} />
            <span className="flex-1 truncate">{m.projectTitle} — {m.title}</span>
            <span className="text-green-700 font-medium text-xs">KES {m.amount.toLocaleString()}</span>
          </div>
        ))}

        {selectedIds.size > 0 && (
          <Button className="w-full mt-2" size="sm" onClick={() => setShowDialog(true)}>
            <Wallet className="h-4 w-4 mr-1" />
            Release {selectedIds.size} Payments — KES {totalAmount.toLocaleString()}
          </Button>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirm Bulk Payment Release</DialogTitle>
              <DialogDescription>
                Release KES {totalAmount.toLocaleString()} across {selectedIds.size} milestones via Demo M-Pesa.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={processing}>Cancel</Button>
              <Button onClick={handleBulkRelease} disabled={processing} className="bg-green-600 hover:bg-green-700">
                {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : 'Confirm Release'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BulkPaymentRelease;
