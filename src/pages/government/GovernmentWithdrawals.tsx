import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import BreadcrumbNav from '@/components/BreadcrumbNav';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  destination_type: 'mpesa' | 'bank';
  destination_account: string;
  destination_name: string | null;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  reference: string;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const statusVariant: Record<Withdrawal['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  processing: 'secondary',
  paid: 'default',
  failed: 'destructive',
  cancelled: 'destructive',
};

const formatKES = (n: number) => `KES ${Number(n ?? 0).toLocaleString()}`;

const GovernmentWithdrawals: React.FC = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');
  const [activeAction, setActiveAction] = useState<{ w: Withdrawal; action: 'paid' | 'failed' } | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Government', href: '/government' },
    { label: 'Withdrawals' },
  ];

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wallet_withdrawals' as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setItems((data ?? []) as unknown as Withdrawal[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
    const channel = supabase
      .channel('withdrawals-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_withdrawals' }, fetchItems)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProcess = async () => {
    if (!activeAction || submitting) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('wallet_process_withdrawal' as any, {
        p_withdrawal_id: activeAction.w.id,
        p_new_status: activeAction.action,
        p_notes: notes || null,
      });
      if (error) throw error;
      toast({
        title: activeAction.action === 'paid' ? '✅ Marked as paid' : '↩️ Refunded to user',
        description: `Reference ${activeAction.w.reference} • ${formatKES(activeAction.w.amount)}`,
      });
      setActiveAction(null);
      setNotes('');
      fetchItems();
    } catch (err: any) {
      toast({ title: 'Action failed', description: err?.message ?? 'Try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const pending = items.filter((i) => i.status === 'pending' || i.status === 'processing');
  const history = items.filter((i) => !['pending', 'processing'].includes(i.status));
  const list = tab === 'pending' ? pending : history;

  return (
    <DashboardLayout>
      <BreadcrumbNav items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wallet className="w-8 h-8 text-primary" />
          Withdrawals Queue
        </h1>
        <p className="text-muted-foreground mt-1">
          Process coin-to-cash payouts. Marking <em>paid</em> closes the request; <em>failed</em> auto-refunds the user.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mb-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending <Badge variant="secondary" className="ml-2">{pending.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{tab === 'pending' ? 'Awaiting payout' : 'Processed withdrawals'}</CardTitle>
              <CardDescription>
                {tab === 'pending'
                  ? 'Send the cash via M-Pesa B2C or bank transfer, then mark the row as paid.'
                  : 'Audit trail of all completed and failed withdrawals.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : list.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No {tab === 'pending' ? 'pending' : 'historical'} withdrawals.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {list.map((w) => (
                    <div key={w.id} className="py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={statusVariant[w.status]} className="capitalize">
                            {w.status}
                          </Badge>
                          <span className="font-mono text-xs text-muted-foreground">{w.reference}</span>
                        </div>
                        <p className="font-semibold mt-1">{formatKES(w.amount)}</p>
                        <p className="text-sm text-muted-foreground">
                          {w.destination_type.toUpperCase()} → {w.destination_account}
                          {w.destination_name ? ` (${w.destination_name})` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Requested {format(parseISO(w.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                        {w.notes && <p className="text-xs italic mt-1 text-muted-foreground">"{w.notes}"</p>}
                      </div>
                      {tab === 'pending' && (
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => { setActiveAction({ w, action: 'failed' }); setNotes(''); }}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Mark Failed
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => { setActiveAction({ w, action: 'paid' }); setNotes(''); }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Mark Paid
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!activeAction} onOpenChange={(o) => !o && setActiveAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeAction?.action === 'paid' ? (
                <><CheckCircle2 className="w-5 h-5 text-primary" /> Confirm payout</>
              ) : (
                <><XCircle className="w-5 h-5 text-destructive" /> Refund to user</>
              )}
            </DialogTitle>
            <DialogDescription>
              {activeAction?.action === 'paid'
                ? 'Confirm that the cash has been sent to the destination account. This is final.'
                : 'The locked coins will be returned to the user\'s wallet immediately.'}
            </DialogDescription>
          </DialogHeader>
          {activeAction && (
            <div className="text-sm space-y-1 py-2">
              <p><strong>Reference:</strong> <span className="font-mono">{activeAction.w.reference}</span></p>
              <p><strong>Amount:</strong> {formatKES(activeAction.w.amount)}</p>
              <p><strong>Destination:</strong> {activeAction.w.destination_type.toUpperCase()} {activeAction.w.destination_account}</p>
              <textarea
                className="w-full mt-3 p-2 border rounded-md text-sm bg-background"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                rows={2}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveAction(null)} disabled={submitting}>Cancel</Button>
            <Button
              onClick={handleProcess}
              disabled={submitting}
              variant={activeAction?.action === 'failed' ? 'destructive' : 'default'}
            >
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : <>Confirm <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default GovernmentWithdrawals;
