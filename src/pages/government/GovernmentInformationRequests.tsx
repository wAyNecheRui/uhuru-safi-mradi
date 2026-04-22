import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSearch, Calendar, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, isPast } from 'date-fns';

interface InfoRequest {
  id: string;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  subject: string;
  description: string;
  status: string;
  statutory_deadline: string;
  created_at: string;
  response: string | null;
  rejection_reason: string | null;
  responded_at: string | null;
}

const GovernmentInformationRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<InfoRequest | null>(null);
  const [responseText, setResponseText] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionMode, setActionMode] = useState<'respond' | 'reject' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('information_requests')
      .select('*')
      .order('statutory_deadline', { ascending: true });
    if (error) {
      toast({ title: 'Failed to load requests', description: error.message, variant: 'destructive' });
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetch();
  }, []);

  const submitAction = async () => {
    if (!selected || !user?.id) return;
    if (actionMode === 'respond' && responseText.trim().length < 10) {
      toast({ title: 'Response too short', variant: 'destructive' });
      return;
    }
    if (actionMode === 'reject' && rejectionReason.trim().length < 10) {
      toast({ title: 'Rejection reason required (min 10 chars)', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const updates: any = {
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        status: actionMode === 'respond' ? 'fulfilled' : 'rejected',
      };
      if (actionMode === 'respond') updates.response = responseText.trim();
      if (actionMode === 'reject') updates.rejection_reason = rejectionReason.trim();

      const { error } = await supabase
        .from('information_requests')
        .update(updates)
        .eq('id', selected.id);
      if (error) throw error;

      toast({ title: 'Request updated', description: 'Action recorded.' });
      setSelected(null);
      setActionMode(null);
      setResponseText('');
      setRejectionReason('');
      fetch();
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filterBy = (status: string) =>
    status === 'all' ? requests : requests.filter((r) => r.status === status);

  const statusBadge = (req: InfoRequest) => {
    const overdue = isPast(new Date(req.statutory_deadline)) && req.status === 'submitted';
    if (overdue) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Overdue</Badge>;
    }
    switch (req.status) {
      case 'submitted':
        return <Badge variant="secondary">Pending</Badge>;
      case 'fulfilled':
        return <Badge className="bg-primary/15 text-primary border-primary/30 gap-1"><CheckCircle2 className="h-3 w-3" />Fulfilled</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="gap-1"><XCircle className="h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{req.status}</Badge>;
    }
  };

  const RequestCard = ({ req }: { req: InfoRequest }) => {
    const deadline = new Date(req.statutory_deadline);
    const overdue = isPast(deadline) && req.status === 'submitted';
    return (
      <Card className={overdue ? 'border-destructive/50' : ''}>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{req.subject}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                From: {req.requester_name ?? 'Anonymous'} · Submitted{' '}
                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
              </p>
            </div>
            {statusBadge(req)}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Deadline: {deadline.toLocaleDateString('en-KE')}
            </span>
            <Button size="sm" variant="outline" onClick={() => setSelected(req)}>
              View & respond
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const breadcrumbItems = [
    { label: 'Government', href: '/government' },
    { label: 'Information Requests' },
  ];

  const overdueCount = requests.filter(
    (r) => r.status === 'submitted' && isPast(new Date(r.statutory_deadline))
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ResponsiveContainer className="py-6">
          <BreadcrumbNav items={breadcrumbItems} />
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <FileSearch className="h-7 w-7 text-primary" />
              Access to Information Requests
            </h1>
            <p className="text-muted-foreground text-sm">
              Statutory 21-day response under ATIA 2016, Section 9
            </p>
          </div>

          {overdueCount > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{overdueCount}</strong> request{overdueCount > 1 ? 's are' : ' is'} past
                the 21-day statutory deadline. Immediate action required.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="submitted">
            <TabsList>
              <TabsTrigger value="submitted">
                Pending ({filterBy('submitted').length})
              </TabsTrigger>
              <TabsTrigger value="fulfilled">
                Fulfilled ({filterBy('fulfilled').length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({filterBy('rejected').length})
              </TabsTrigger>
              <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
            </TabsList>

            {(['submitted', 'fulfilled', 'rejected', 'all'] as const).map((s) => (
              <TabsContent key={s} value={s} className="space-y-3 mt-4">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filterBy(s).length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                      No requests in this category.
                    </CardContent>
                  </Card>
                ) : (
                  filterBy(s).map((r) => <RequestCard key={r.id} req={r} />)
                )}
              </TabsContent>
            ))}
          </Tabs>
        </ResponsiveContainer>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.subject}</DialogTitle>
                <DialogDescription>
                  Request ID: {selected.id.slice(0, 8).toUpperCase()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Requester</span>
                    <p className="font-medium">{selected.requester_name ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status</span>
                    <p>{statusBadge(selected)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p className="font-mono break-all">{selected.requester_email ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <p className="font-mono">{selected.requester_phone ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted</span>
                    <p>{new Date(selected.created_at).toLocaleString('en-KE')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Deadline (ATIA 21d)</span>
                    <p
                      className={
                        isPast(new Date(selected.statutory_deadline)) &&
                        selected.status === 'submitted'
                          ? 'text-destructive font-semibold'
                          : ''
                      }
                    >
                      {new Date(selected.statutory_deadline).toLocaleString('en-KE')}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Information requested</Label>
                  <p className="mt-1 p-3 rounded-md bg-muted/40 text-sm whitespace-pre-wrap">
                    {selected.description}
                  </p>
                </div>

                {selected.response && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Previous response</Label>
                    <p className="mt-1 p-3 rounded-md bg-primary/5 text-sm whitespace-pre-wrap">
                      {selected.response}
                    </p>
                  </div>
                )}
                {selected.rejection_reason && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Rejection reason</Label>
                    <p className="mt-1 p-3 rounded-md bg-destructive/5 text-sm whitespace-pre-wrap">
                      {selected.rejection_reason}
                    </p>
                  </div>
                )}

                {selected.status === 'submitted' && (
                  <div className="space-y-3 pt-2 border-t">
                    {!actionMode ? (
                      <div className="flex gap-2">
                        <Button onClick={() => setActionMode('respond')} className="flex-1">
                          Provide response
                        </Button>
                        <Button
                          onClick={() => setActionMode('reject')}
                          variant="outline"
                          className="flex-1"
                        >
                          Reject (with reason)
                        </Button>
                      </div>
                    ) : actionMode === 'respond' ? (
                      <div className="space-y-2">
                        <Label>Your response</Label>
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={6}
                          placeholder="Provide the requested information..."
                          maxLength={10000}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Reason for rejection (must cite ATIA Sections 6 or 13)</Label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows={4}
                          placeholder="e.g., Information is exempt under Section 6 (national security)..."
                          maxLength={2000}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter>
                {actionMode ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setActionMode(null)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button onClick={submitAction} disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Submit
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GovernmentInformationRequests;
