import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Loader2, ListChecks } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WorkflowGuardService } from '@/services/WorkflowGuardService';
import { LiveNotificationService } from '@/services/LiveNotificationService';

interface BulkApprovalPanelProps {
  reports: any[];
  onComplete: () => void;
}

const BulkApprovalPanel: React.FC<BulkApprovalPanelProps> = ({ reports, onComplete }) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');
  const [defaultBudget, setDefaultBudget] = useState('');
  const [results, setResults] = useState<{ id: string; title: string; success: boolean; error?: string }[]>([]);

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

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);
    setResults([]);

    const actionResults: typeof results = [];
    const { data: { user } } = await supabase.auth.getUser();

    for (const id of selectedIds) {
      const report = reports.find(r => r.id === id);
      try {
        if (bulkAction === 'approve') {
          // Set budget if provided
          if (defaultBudget) {
            const budget = parseFloat(defaultBudget.replace(/,/g, ''));
            if (!isNaN(budget)) {
              await supabase.from('problem_reports').update({
                estimated_cost: budget,
                budget_allocated: budget
              }).eq('id', id);
            }
          }
          const result = await WorkflowGuardService.approveReport(id);
          if (!result.success) throw new Error(result.error);
          
          if (user && report) {
            LiveNotificationService.onReportApproved(id, user.id, report.title, report.reported_by);
          }
          actionResults.push({ id, title: report?.title || id, success: true });
        } else {
          await supabase.from('problem_reports').update({
            status: 'rejected',
            updated_at: new Date().toISOString()
          }).eq('id', id);
          actionResults.push({ id, title: report?.title || id, success: true });
        }
      } catch (error: any) {
        actionResults.push({ id, title: report?.title || id, success: false, error: error.message });
      }
    }

    setResults(actionResults);
    const successCount = actionResults.filter(r => r.success).length;
    const failCount = actionResults.filter(r => !r.success).length;

    toast({
      title: `Bulk ${bulkAction === 'approve' ? 'Approval' : 'Rejection'} Complete`,
      description: `${successCount} succeeded${failCount > 0 ? `, ${failCount} failed` : ''}`,
      variant: failCount > 0 ? 'destructive' : 'default'
    });

    setProcessing(false);
    if (failCount === 0) {
      setShowBulkDialog(false);
      setSelectedIds(new Set());
      onComplete();
    }
  };

  if (reports.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            <ListChecks className="h-4 w-4 mr-1" />
            {selectedIds.size === reports.length ? 'Deselect All' : 'Select All'}
          </Button>
          {selectedIds.size > 0 && (
            <Badge variant="secondary">{selectedIds.size} selected</Badge>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => { setBulkAction('approve'); setShowBulkDialog(true); }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve Selected ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => { setBulkAction('reject'); setShowBulkDialog(true); }}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject Selected ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Checkboxes on each report */}
      <div className="space-y-2">
        {reports.map(report => (
          <div key={report.id} className="flex items-start gap-3">
            <Checkbox
              checked={selectedIds.has(report.id)}
              onCheckedChange={() => toggleSelect(report.id)}
              className="mt-1"
            />
            <div className="flex-1 text-sm">
              <span className="font-medium">{report.title}</span>
              <span className="text-muted-foreground ml-2">— {report.location || 'No location'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Bulk {bulkAction === 'approve' ? 'Approve' : 'Reject'} Reports
            </DialogTitle>
            <DialogDescription>
              This will {bulkAction} {selectedIds.size} report(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {bulkAction === 'approve' && (
              <div>
                <Label>Default Budget (KES) — applied to reports without one</Label>
                <Input
                  value={defaultBudget}
                  onChange={(e) => setDefaultBudget(e.target.value)}
                  placeholder="Leave blank to use each report's estimate"
                />
              </div>
            )}

            {results.length > 0 && (
              <div className="max-h-40 overflow-y-auto space-y-1">
                {results.map(r => (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    {r.success ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-600" />
                    )}
                    <span className="truncate">{r.title}</span>
                    {r.error && <span className="text-red-500">— {r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)} disabled={processing}>Cancel</Button>
            <Button
              onClick={handleBulkAction}
              disabled={processing}
              variant={bulkAction === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
              ) : (
                `${bulkAction === 'approve' ? 'Approve' : 'Reject'} ${selectedIds.size} Reports`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkApprovalPanel;
