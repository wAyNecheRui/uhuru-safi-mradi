import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Building2, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  availableBalance: number;
  onComplete?: () => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * Top up / send coins to a contractor using their Business Registration Number.
 * Resolves recipient via contractor_profiles.business_registration_number.
 */
const SendByBusinessRegDialog: React.FC<Props> = ({
  availableBalance,
  onComplete,
  trigger,
  title = 'Top Up Contractor',
  description = "Enter the contractor's Business Registration Number. Coins are routed instantly to their wallet.",
}) => {
  const [open, setOpen] = useState(false);
  const [brn, setBrn] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const cleanedBrn = brn.replace(/\s/g, '').toUpperCase();
  const numAmount = Number(amount);
  const isValid =
    cleanedBrn.length >= 4 &&
    numAmount > 0 &&
    numAmount <= availableBalance;

  const reset = () => {
    setBrn('');
    setAmount('');
    setNote('');
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('wallet_send_by_business_reg' as any, {
        p_business_reg: cleanedBrn,
        p_amount: numAmount,
        p_note: note || null,
      });
      if (error) throw error;
      toast({
        title: '✅ Top-up sent',
        description: `KES ${numAmount.toLocaleString()} sent to contractor ${cleanedBrn}.`,
      });
      reset();
      setOpen(false);
      onComplete?.();
    } catch (err: any) {
      toast({
        title: 'Top-up failed',
        description: err?.message ?? 'Could not complete the transfer.',
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
          <Button variant="outline" className="gap-2">
            <Building2 className="w-4 h-4" />
            Top Up Contractor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="brn">Business Registration Number</Label>
            <Input
              id="brn"
              placeholder="e.g. PVT-XYZ123"
              value={brn}
              onChange={(e) => setBrn(e.target.value)}
              maxLength={32}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amt">Amount (KES)</Label>
            <Input
              id="amt"
              type="number"
              min={1}
              max={availableBalance}
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Available: KES {availableBalance.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Textarea
              id="note"
              placeholder="Reference / purpose"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
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
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
            ) : (
              <>Send KES {numAmount > 0 ? numAmount.toLocaleString() : '0'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendByBusinessRegDialog;
