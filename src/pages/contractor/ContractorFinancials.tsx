import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, CreditCard, TrendingUp, Clock, CheckCircle, 
  AlertTriangle, BarChart3, PiggyBank, ArrowUpRight, ArrowDownRight, Loader2, ArrowLeft
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface EscrowAccount {
  id: string;
  projectName: string;
  totalAmount: number;
  heldAmount: number;
  releasedAmount: number;
  status: string;
  milestones: { name: string; amount: number; status: string }[];
}

interface PaymentTransaction {
  id: string;
  projectName: string;
  amount: number;
  type: 'release' | 'pending';
  date: string;
  status: string;
  paymentMethod: string;
}

const ContractorFinancials = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [stats, setStats] = useState({
    totalEscrow: 0,
    pendingPayments: 0,
    releasedPayments: 0,
    expectedThisMonth: 0
  });

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Contractor', href: '/contractor' },
    { label: 'Financial Management' }
  ];

  const [stableUserId, setStableUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && !stableUserId) setStableUserId(user.id);
    if (!user && stableUserId) {
      setStableUserId(null);
      setEscrowAccounts([]);
      setTransactions([]);
      setStats({ totalEscrow: 0, pendingPayments: 0, releasedPayments: 0, expectedThisMonth: 0 });
    }
  }, [user?.id, stableUserId]);

  useEffect(() => {
    if (stableUserId) fetchFinancialData(stableUserId);
  }, [stableUserId]);

  const fetchFinancialData = async (contractorId: string) => {
    try {
      setLoading(true);
      const { data: projects } = await supabase
        .from('projects')
        .select(`id, title, budget, escrow_accounts(id, total_amount, held_amount, released_amount, status), project_milestones(id, title, payment_percentage, status)`)
        .eq('contractor_id', contractorId);

      const contractorEscrowIds = projects
        ?.filter(p => p.escrow_accounts && p.escrow_accounts.length > 0)
        ?.flatMap(p => (p.escrow_accounts as any[])?.map(e => e.id) || []) || [];

      let transactionData: PaymentTransaction[] = [];
      if (contractorEscrowIds.length > 0) {
        const { data: payments } = await supabase
          .from('payment_transactions')
          .select(`id, amount, status, transaction_type, created_at, payment_method, escrow_accounts(projects(title, contractor_id))`)
          .in('escrow_account_id', contractorEscrowIds)
          .order('created_at', { ascending: false })
          .limit(20);

        transactionData = (payments || [])
          .filter(p => (p.escrow_accounts as any)?.projects?.contractor_id === contractorId)
          .map(p => ({
            id: p.id,
            projectName: (p.escrow_accounts as any)?.projects?.title || 'Unknown Project',
            amount: p.amount,
            type: p.transaction_type === 'release' ? 'release' as const : 'pending' as const,
            date: p.created_at,
            status: p.status,
            paymentMethod: p.payment_method || 'Bank Transfer'
          }));
      }

      const escrowData: EscrowAccount[] = projects?.filter(p => p.escrow_accounts && p.escrow_accounts.length > 0).map(p => ({
        id: (p.escrow_accounts as any[])[0]?.id || p.id,
        projectName: p.title,
        totalAmount: (p.escrow_accounts as any[])[0]?.total_amount || p.budget || 0,
        heldAmount: (p.escrow_accounts as any[])[0]?.held_amount || 0,
        releasedAmount: (p.escrow_accounts as any[])[0]?.released_amount || 0,
        status: (p.escrow_accounts as any[])[0]?.status || 'pending',
        milestones: (p.project_milestones as any[])?.map(m => ({
          name: m.title,
          amount: (p.budget || 0) * (m.payment_percentage / 100),
          status: m.status
        })) || []
      })) || [];

      const totalEscrow = escrowData.reduce((sum, e) => sum + e.totalAmount, 0);
      const pendingPayments = escrowData.reduce((sum, e) => sum + e.heldAmount, 0);
      const releasedPayments = escrowData.reduce((sum, e) => sum + e.releasedAmount, 0);

      setEscrowAccounts(escrowData);
      setTransactions(transactionData);
      setStats({ totalEscrow, pendingPayments, releasedPayments, expectedThisMonth: pendingPayments * 0.3 });
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'released': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning-foreground';
      case 'active': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading financial data...</span>
        </main>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Escrow', value: formatCurrency(stats.totalEscrow), icon: Wallet, color: 'text-primary', bg: 'bg-primary/5', border: 'border-l-primary' },
    { label: 'Pending Payments', value: formatCurrency(stats.pendingPayments), icon: Clock, color: 'text-warning-foreground', bg: 'bg-warning/10', border: 'border-l-warning' },
    { label: 'Released Payments', value: formatCurrency(stats.releasedPayments), icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-l-success' },
    { label: 'Expected This Month', value: formatCurrency(stats.expectedThisMonth), icon: TrendingUp, color: 'text-accent-foreground', bg: 'bg-accent/10', border: 'border-l-accent' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <ResponsiveContainer className="py-5 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </div>
          <BreadcrumbNav items={breadcrumbItems} />

          <div className="mb-6">
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-1">Financial Management</h1>
            <p className="text-sm text-muted-foreground">Track escrow accounts, payments, and financial analytics for your projects.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {statCards.map((s) => (
              <Card key={s.label} className={`border-l-4 ${s.border}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                      <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                    <s.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${s.color} opacity-60`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="escrow" className="space-y-5">
            <TabsList className="w-full bg-muted/50 flex-wrap h-auto p-1 rounded-xl">
              <TabsTrigger value="escrow" className="text-xs sm:text-sm rounded-lg">Escrow Accounts</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm rounded-lg">Transactions</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm rounded-lg">Analytics</TabsTrigger>
              <TabsTrigger value="cashflow" className="text-xs sm:text-sm rounded-lg">Cash Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="escrow" className="space-y-4">
              {escrowAccounts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Wallet className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">No Escrow Accounts</h3>
                    <p className="text-xs text-muted-foreground">You don't have any active escrow accounts yet.</p>
                  </CardContent>
                </Card>
              ) : (
                escrowAccounts.map((escrow) => (
                  <Card key={escrow.id}>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base sm:text-lg mb-2">{escrow.projectName}</CardTitle>
                          <Badge className={getStatusColor(escrow.status)}>{escrow.status}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-bold text-primary">{formatCurrency(escrow.totalAmount)}</p>
                          <p className="text-xs text-muted-foreground">Total Escrow</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <div className="bg-warning/10 p-3 rounded-xl">
                          <p className="text-xs text-muted-foreground font-medium">Held Amount</p>
                          <p className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(escrow.heldAmount)}</p>
                        </div>
                        <div className="bg-success/10 p-3 rounded-xl">
                          <p className="text-xs text-muted-foreground font-medium">Released Amount</p>
                          <p className="text-base sm:text-lg font-bold text-foreground">{formatCurrency(escrow.releasedAmount)}</p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-xl">
                          <p className="text-xs text-muted-foreground font-medium">Release Progress</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={(escrow.releasedAmount / escrow.totalAmount) * 100} className="flex-1 h-2" />
                            <span className="text-xs font-bold text-foreground">
                              {Math.round((escrow.releasedAmount / escrow.totalAmount) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {escrow.milestones.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-sm text-foreground mb-2">Milestone Payments</h4>
                          <div className="space-y-2">
                            {escrow.milestones.map((milestone, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {milestone.status === 'completed' || milestone.status === 'paid' ? (
                                    <CheckCircle className="h-4 w-4 text-success" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-warning-foreground" />
                                  )}
                                  <span className="font-medium text-sm text-foreground">{milestone.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-success">{formatCurrency(milestone.amount)}</span>
                                  <Badge className={getStatusColor(milestone.status)} variant="outline">{milestone.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No payment transactions yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.type === 'release' ? 'bg-success/10' : 'bg-warning/10'}`}>
                              {tx.type === 'release' ? (
                                <ArrowDownRight className="h-4 w-4 text-success" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-warning-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-foreground">{tx.projectName}</p>
                              <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()} • {tx.paymentMethod}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${tx.type === 'release' ? 'text-success' : 'text-warning-foreground'}`}>
                              {tx.type === 'release' ? '+' : ''}{formatCurrency(tx.amount)}
                            </p>
                            <Badge className={getStatusColor(tx.status)} variant="outline">{tx.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold">
                    <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                    Revenue Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-sm mb-1">Analytics Coming Soon</h3>
                    <p className="text-xs text-muted-foreground">Detailed financial charts and projections will appear here as you complete projects.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-base font-semibold">
                    <PiggyBank className="h-4 w-4 mr-2 text-primary" />
                    Cash Flow Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <PiggyBank className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-semibold text-sm mb-1">Cash Flow Forecast</h3>
                    <p className="text-xs text-muted-foreground">Cash flow projections will be available once you have active escrow accounts.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>
    </div>
  );
};

export default ContractorFinancials;
