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

  // SECURITY: Use stable user ID to prevent cross-user data leakage
  const [stableUserId, setStableUserId] = useState<string | null>(null);

  useEffect(() => {
    // Only set stable user ID when auth is fully loaded and user exists
    if (user?.id && !stableUserId) {
      setStableUserId(user.id);
    }
    // Clear stable ID if user logs out
    if (!user && stableUserId) {
      setStableUserId(null);
      setEscrowAccounts([]);
      setTransactions([]);
      setStats({ totalEscrow: 0, pendingPayments: 0, releasedPayments: 0, expectedThisMonth: 0 });
    }
  }, [user?.id, stableUserId]);

  useEffect(() => {
    if (stableUserId) {
      fetchFinancialData(stableUserId);
    }
  }, [stableUserId]);

  const fetchFinancialData = async (contractorId: string) => {
    try {
      setLoading(true);
      
      // SECURITY: Fetch ONLY projects belonging to THIS contractor
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id, title, budget,
          escrow_accounts(id, total_amount, held_amount, released_amount, status),
          project_milestones(id, title, payment_percentage, status)
        `)
        .eq('contractor_id', contractorId);

      // Get escrow account IDs for this contractor's projects only
      const contractorEscrowIds = projects
        ?.filter(p => p.escrow_accounts && p.escrow_accounts.length > 0)
        ?.flatMap(p => (p.escrow_accounts as any[])?.map(e => e.id) || []) || [];

      // SECURITY: Fetch payment transactions ONLY for this contractor's escrow accounts
      let transactionData: PaymentTransaction[] = [];
      if (contractorEscrowIds.length > 0) {
        const { data: payments } = await supabase
          .from('payment_transactions')
          .select(`
            id, amount, status, transaction_type, created_at, payment_method,
            escrow_accounts(projects(title, contractor_id))
          `)
          .in('escrow_account_id', contractorEscrowIds)
          .order('created_at', { ascending: false })
          .limit(20);

        // Double-check: Only include transactions for this contractor's projects
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

      // Transform escrow data
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

      // Calculate stats from contractor's own data only
      const totalEscrow = escrowData.reduce((sum, e) => sum + e.totalAmount, 0);
      const pendingPayments = escrowData.reduce((sum, e) => sum + e.heldAmount, 0);
      const releasedPayments = escrowData.reduce((sum, e) => sum + e.releasedAmount, 0);

      setEscrowAccounts(escrowData);
      setTransactions(transactionData);
      setStats({
        totalEscrow,
        pendingPayments,
        releasedPayments,
        expectedThisMonth: pendingPayments * 0.3 // Estimate
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': case 'released': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2">Loading financial data...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Financial Management</h1>
            <p className="text-gray-600">Track escrow accounts, payments, and financial analytics for your projects.</p>
          </div>

          {/* Financial Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="shadow-lg border-l-4 border-l-blue-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Escrow</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEscrow)}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-yellow-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.pendingPayments)}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-green-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Released Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.releasedPayments)}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-lg border-l-4 border-l-purple-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.expectedThisMonth)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="escrow" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
              <TabsTrigger value="escrow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Escrow Accounts
              </TabsTrigger>
              <TabsTrigger value="transactions" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                Transactions
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
              <TabsTrigger value="cashflow" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
                Cash Flow
              </TabsTrigger>
            </TabsList>

            <TabsContent value="escrow" className="space-y-6">
              {escrowAccounts.length === 0 ? (
                <Card className="shadow-lg">
                  <CardContent className="p-8 text-center">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Escrow Accounts</h3>
                    <p className="text-gray-600">You don't have any active escrow accounts yet.</p>
                  </CardContent>
                </Card>
              ) : (
                escrowAccounts.map((escrow) => (
                  <Card key={escrow.id} className="shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">{escrow.projectName}</CardTitle>
                          <Badge className={getStatusColor(escrow.status)}>{escrow.status}</Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">{formatCurrency(escrow.totalAmount)}</p>
                          <p className="text-sm text-gray-500">Total Escrow</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <p className="text-sm text-yellow-800 font-medium">Held Amount</p>
                          <p className="text-xl font-bold text-yellow-900">{formatCurrency(escrow.heldAmount)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-800 font-medium">Released Amount</p>
                          <p className="text-xl font-bold text-green-900">{formatCurrency(escrow.releasedAmount)}</p>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800 font-medium">Release Progress</p>
                          <div className="flex items-center gap-2">
                            <Progress value={(escrow.releasedAmount / escrow.totalAmount) * 100} className="flex-1" />
                            <span className="text-sm font-bold text-blue-900">
                              {Math.round((escrow.releasedAmount / escrow.totalAmount) * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {escrow.milestones.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Milestone Payments</h4>
                          <div className="space-y-2">
                            {escrow.milestones.map((milestone, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  {milestone.status === 'completed' ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                  )}
                                  <span className="font-medium">{milestone.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-green-600">{formatCurrency(milestone.amount)}</span>
                                  <Badge className={getStatusColor(milestone.status)} variant="outline">
                                    {milestone.status}
                                  </Badge>
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

            <TabsContent value="transactions" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No payment transactions yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-full ${tx.type === 'release' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                              {tx.type === 'release' ? (
                                <ArrowDownRight className="h-5 w-5 text-green-600" />
                              ) : (
                                <ArrowUpRight className="h-5 w-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{tx.projectName}</p>
                              <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString()} • {tx.paymentMethod}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${tx.type === 'release' ? 'text-green-600' : 'text-yellow-600'}`}>
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

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                      Profitability Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="font-medium">Total Revenue</span>
                        <span className="font-bold text-green-600">{formatCurrency(stats.releasedPayments)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="font-medium">Est. Costs (70%)</span>
                        <span className="font-bold text-red-600">{formatCurrency(stats.releasedPayments * 0.7)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <span className="font-medium">Est. Profit</span>
                        <span className="font-bold text-blue-600">{formatCurrency(stats.releasedPayments * 0.3)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                      Key Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.totalEscrow === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p>No project data available yet. Key metrics will appear once you have active projects.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Payment Collection Rate</span>
                            <span className="font-bold">{stats.totalEscrow > 0 ? Math.round((stats.releasedPayments / stats.totalEscrow) * 100) : 0}%</span>
                          </div>
                          <Progress value={stats.totalEscrow > 0 ? (stats.releasedPayments / stats.totalEscrow) * 100 : 0} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Escrow Funded</span>
                            <span className="font-bold">{stats.totalEscrow > 0 ? Math.round((stats.pendingPayments / stats.totalEscrow) * 100) : 0}%</span>
                          </div>
                          <Progress value={stats.totalEscrow > 0 ? (stats.pendingPayments / stats.totalEscrow) * 100 : 0} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Active Projects</span>
                            <span className="font-bold">{escrowAccounts.length}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="cashflow" className="space-y-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PiggyBank className="h-5 w-5 mr-2 text-orange-600" />
                    Cash Flow Forecast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">Expected Income (30 days)</p>
                        <p className="text-2xl font-bold text-green-900">{formatCurrency(stats.expectedThisMonth)}</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">Expected Expenses</p>
                        <p className="text-2xl font-bold text-red-900">{formatCurrency(stats.expectedThisMonth * 0.6)}</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">Net Cash Flow</p>
                        <p className="text-2xl font-bold text-blue-900">{formatCurrency(stats.expectedThisMonth * 0.4)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Upcoming Payments</h4>
                      <div className="space-y-2">
                        {escrowAccounts.slice(0, 3).map((escrow, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{escrow.projectName}</p>
                              <p className="text-sm text-gray-500">Next milestone payment</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">{formatCurrency(escrow.heldAmount * 0.3)}</p>
                              <p className="text-xs text-gray-500">Expected in 7-14 days</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
