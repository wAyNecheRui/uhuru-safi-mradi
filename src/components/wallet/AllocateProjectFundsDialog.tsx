import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Coins, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProjectOpt {
  id: string;
  title: string;
  budget: number | null;
}

interface Props {
  trigger?: React.ReactNode;
  onComplete?: () => void;
}

const AllocateProjectFundsDialog: React.FC<Props> = ({ trigger, onComplete }) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from('projects')
      .select('id, title, budget, status')
      .not('contractor_id', 'is', null)
      .in('status', ['funded', 'in_progress', 'verification', 'bid_awarded'])
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) {
          toast({ title: 'Could not load projects', description: error.message, variant: 'destructive' });
        } else {
          setProjects((data ?? []) as ProjectOpt[]);
        }
        setLoading(false);
      });
  }, [open, toast]);

  const numAmount = Number(amount);
  const isValid = !!projectId && numAmount > 0;

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('wallet_topup_project_escrow' as any, {
        p_project_id: projectId,
        p_amount: numAmount,
        p_reason: reason || null,
      });
      if (error) throw error;
      toast({
        title: '✅ Funds allocated',
        description: `KES ${numAmount.toLocaleString()} added to project escrow.`,
      });
      setProjectId('');
      setAmount('');
      setReason('');
      setOpen(false);
      onComplete?.();
    } catch (err: any) {
      toast({
        title: 'Allocation failed',
        description: err?.message ?? 'Could not allocate funds.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Coins className="w-4 h-4" /> Allocate Coins
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Allocate / Top Up Project Funds
          </DialogTitle>
          <DialogDescription>
            Mint coins from the Treasury into a project's escrow. Use this for cost overruns or
            variations — initial funding happens automatically on bid award.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select value={projectId} onValueChange={setProjectId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Loading…' : 'Select an awarded project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} — KES {Number(p.budget ?? 0).toLocaleString()}
                  </SelectItem>
                ))}
                {!loading && projects.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No awarded projects available.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amt">Amount (KES)</Label>
            <Input
              id="amt"
              type="number"
              min={1}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason / Reference</Label>
            <Textarea
              id="reason"
              placeholder="e.g. Variation order #3 — additional drainage"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={300}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Allocating…</>
            ) : (
              <>Allocate KES {numAmount > 0 ? numAmount.toLocaleString() : '0'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AllocateProjectFundsDialog;
