import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDownLeft, Loader2, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  availableBalance: number;
  onComplete?: () => void;
  trigger?: React.ReactNode;
}

const WithdrawDialog: React.FC<Props> = ({ availableBalance, onComplete, trigger }) => {
  const [open, setOpen] = useState(false);
  const [destinationType, setDestinationType] = useState<'mpesa' | 'bank'>('mpesa');
  const [account, setAccount] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const numAmount = Number(amount);
  const isValid =
    account.trim().length >= 4 && numAmount > 0 && numAmount <= availableBalance;

  const reset = () => {
    setAccount('');
    setName('');
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('wallet_request_withdrawal' as any, {
        p_amount: numAmount,
        p_destination_type: destinationType,
        p_destination_account: account.trim(),
        p_destination_name: name.trim() || null,
      });
      if (error) throw error;
      const ref = (data as any)?.reference ?? '—';
      toast({
        title: '✅ Withdrawal requested',
        description: `KES ${numAmount.toLocaleString()} queued. Reference: ${ref}`,
      });
      reset();
      setOpen(false);
      onComplete?.();
    } catch (err: any) {
      toast({
        title: 'Withdrawal failed',
        description: err?.message ?? 'Could not submit the request.',
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
            <ArrowDownLeft className="w-4 h-4" />
            Withdraw
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Withdraw Coins
          </DialogTitle>
          <DialogDescription>
            Convert your coins back to KES. Funds are queued for processing — you'll get a notification
            when they're paid out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Tabs value={destinationType} onValueChange={(v) => setDestinationType(v as 'mpesa' | 'bank')}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="bank">Bank</TabsTrigger>
            </TabsList>
            <TabsContent value="mpesa" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa phone number</Label>
                <Input
                  id="phone"
                  inputMode="tel"
                  placeholder="07XXXXXXXX"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
            </TabsContent>
            <TabsContent value="bank" className="space-y-3 pt-3">
              <div className="space-y-2">
                <Label htmlFor="acct">Bank account number</Label>
                <Input
                  id="acct"
                  placeholder="e.g. 0123456789"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acctname">Account holder name</Label>
                <Input
                  id="acctname"
                  placeholder="As registered on the account"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="wamt">Amount (KES)</Label>
            <Input
              id="wamt"
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
              </>
            ) : (
              <>Withdraw KES {numAmount > 0 ? numAmount.toLocaleString() : '0'}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;
