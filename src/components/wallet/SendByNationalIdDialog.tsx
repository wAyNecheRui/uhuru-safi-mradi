import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowUpRight, Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  availableBalance: number;
  onComplete?: () => void;
  trigger?: React.ReactNode;
}

const SendByNationalIdDialog: React.FC<Props> = ({ availableBalance, onComplete, trigger }) => {
  const [open, setOpen] = useState(false);
  const [nationalId, setNationalId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const cleanedId = nationalId.replace(/\D/g, '');
  const numAmount = Number(amount);
  const isValid =
    cleanedId.length >= 6 &&
    cleanedId.length <= 12 &&
    numAmount > 0 &&
    numAmount <= availableBalance;

  const reset = () => {
    setNationalId('');
    setAmount('');
    setNote('');
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('wallet_send_by_national_id' as any, {
        p_recipient_national_id: cleanedId,
        p_amount: numAmount,
        p_note: note || null,
      });
      if (error) throw error;
      toast({
        title: '✅ Sent successfully',
        description: `KES ${numAmount.toLocaleString()} sent to ID ${cleanedId}.`,
      });
      reset();
      setOpen(false);
      onComplete?.();
    } catch (err: any) {
      toast({
        title: 'Send failed',
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
            <Send className="w-4 h-4" />
            Send
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            Send Coins by National ID
          </DialogTitle>
          <DialogDescription>
            Enter the recipient's National ID. We'll route the coins instantly — they don't need a phone
            number or bank account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nid">Recipient National ID</Label>
            <Input
              id="nid"
              inputMode="numeric"
              placeholder="e.g. 32145678"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              maxLength={12}
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
              placeholder="What's this for?"
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
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
              </>
            ) : (
              <>Send KES {numAmount > 0 ? numAmount.toLocaleString() : '0'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SendByNationalIdDialog;
