import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Wallet, Loader2, Users, CheckCircle, XCircle } from 'lucide-react';
import { WorkerPaymentService } from '@/services/WorkerPaymentService';
import { useToast } from '@/hooks/use-toast';

interface WorkerPaymentInfo {
  applicationId: string;
  workerId: string;
  workerName: string;
  jobId: string;
  jobTitle: string;
  unpaidRecordIds: string[];
  totalUnpaid: number;
}

interface BulkWorkerPaymentProps {
  workers: WorkerPaymentInfo[];
  onComplete: () => void;
  readOnly?: boolean;
}

const BulkWorkerPayment: React.FC<BulkWorkerPaymentProps> = ({
  workers,
  onComplete,
  readOnly = false
}) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [results, setResults] = useState<{ workerId: string; name: string; success: boolean; error?: string; amount?: number }[]>([]);

  const payableWorkers = workers.filter(w => w.unpaidRecordIds.length > 0 && w.totalUnpaid > 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === payableWorkers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payableWorkers.map(w => w.workerId)));
    }
  };

  const totalSelected = payableWorkers
    .filter(w => selectedIds.has(w.workerId))
    .reduce((sum, w) => sum + w.totalUnpaid, 0);

  const handleBulkPay = async () => {
    setProcessing(true);
    setResults([]);
    const payResults: typeof results = [];

    for (const workerId of selectedIds) {
      const worker = payableWorkers.find(w => w.workerId === workerId);
      if (!worker) continue;

      try {
        const result = await WorkerPaymentService.processDailyPayment({
          workerId: worker.workerId,
          jobId: worker.jobId,
          recordIds: worker.unpaidRecordIds,
          paymentMethod: 'mpesa'
        });

        if (result.success) {
          payResults.push({ workerId, name: worker.workerName, success: true, amount: worker.totalUnpaid });
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        payResults.push({ workerId, name: worker.workerName, success: false, error: error.message });
      }
    }

    setResults(payResults);
    const successCount = payResults.filter(r => r.success).length;
    const totalPaid = payResults.filter(r => r.success).reduce((s, r) => s + (r.amount || 0), 0);

    toast({
      title: '💰 Bulk Payment Complete',
      description: `${successCount}/${selectedIds.size} workers paid. Total: KES ${totalPaid.toLocaleString()} (Demo M-Pesa)`
    });

    setProcessing(false);
    if (payResults.every(r => r.success)) {
      setShowDialog(false);
      setSelectedIds(new Set());
      onComplete();
    }
  };

  if (readOnly || payableWorkers.length === 0) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Bulk Worker Payment
          </div>
          {payableWorkers.length > 1 && (
            <Button size="sm" variant="outline" onClick={selectAll}>
              {selectedIds.size === payableWorkers.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant="outline" className="text-xs">
          🔧 Demo Mode — M-Pesa payments are simulated
        </Badge>

        {payableWorkers.map(worker => (
          <div key={worker.workerId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
            <Checkbox
              checked={selectedIds.has(worker.workerId)}
              onCheckedChange={() => toggleSelect(worker.workerId)}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{worker.workerName}</p>
              <p className="text-xs text-muted-foreground">
                {worker.unpaidRecordIds.length} day(s) — KES {worker.totalUnpaid.toLocaleString()}
              </p>
            </div>
          </div>
        ))}

        {selectedIds.size > 0 && (
          <Button className="w-full" onClick={() => setShowDialog(true)}>
            <Wallet className="h-4 w-4 mr-2" />
            Pay {selectedIds.size} Workers — KES {totalSelected.toLocaleString()}
          </Button>
        )}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Bulk Payment</DialogTitle>
              <DialogDescription>
                Pay {selectedIds.size} workers a total of KES {totalSelected.toLocaleString()} via Demo M-Pesa from project escrow.
              </DialogDescription>
            </DialogHeader>

            {results.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1 py-2">
                {results.map(r => (
                  <div key={r.workerId} className="flex items-center gap-2 text-xs">
                    {r.success ? <CheckCircle className="h-3 w-3 text-green-600" /> : <XCircle className="h-3 w-3 text-red-600" />}
                    <span>{r.name}</span>
                    {r.success && <span className="text-green-600 ml-auto">KES {r.amount?.toLocaleString()}</span>}
                    {r.error && <span className="text-red-500 ml-auto">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={processing}>Cancel</Button>
              <Button onClick={handleBulkPay} disabled={processing}>
                {processing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</> : 'Confirm Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BulkWorkerPayment;
