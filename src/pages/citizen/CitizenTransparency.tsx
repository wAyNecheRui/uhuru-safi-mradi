import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Wallet, 
  Building2, 
  Star, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  Eye,
  Download
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import ContractorPortfolioModal from '@/components/transparency/ContractorPortfolioModal';
import ContractorBanner from '@/components/contractor/ContractorBanner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { fetchContractorRatingsFromVerifications } from '@/utils/contractorRatingCalculation';

interface ContractorProfile {
  id: string;
  user_id: string;
  company_name: string;
  verified: boolean;
  average_rating: number;
  project_count: number;
  total_contract_value: number;
  specialization: string[];
  years_in_business: number;
}

interface EscrowAccount {
  id: string;
  project_id: string;
  project_title: string;
  total_amount: number;
  held_amount: number;
  released_amount: number;
  status: string;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
  project_title: string;
  payment_method: string;
}

const CitizenTransparency = () => {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Citizen', href: '/citizen' },
    { label: 'Transparency Portal' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch contractors from PUBLIC view (citizens can't access contractor_profiles directly via RLS)
      const { data: contractorsData } = await supabase
        .from('contractor_profiles_public')
        .select('id, user_id, company_name, verified, specialization, years_in_business, average_rating, previous_projects_count, total_contract_value');

      const contractorIds = (contractorsData || []).map(c => c.user_id).filter(Boolean);
      
      // Fetch all projects for these contractors
      const { data: projectsData } = contractorIds.length > 0
        ? await supabase
            .from('projects')
            .select('contractor_id, budget, status')
            .in('contractor_id', contractorIds)
            .is('deleted_at', null)
        : { data: [] };

      // Fetch REAL ratings from milestone_verifications
      const realRatingsData = contractorIds.length > 0
        ? await fetchContractorRatingsFromVerifications(contractorIds)
        : {};

      // Build stats maps
      const projectStats: Record<string, { count: number; totalValue: number }> = {};
      (projectsData || []).forEach(p => {
        if (!p.contractor_id) return;
        if (!projectStats[p.contractor_id]) {
          projectStats[p.contractor_id] = { count: 0, totalValue: 0 };
        }
        projectStats[p.contractor_id].count += 1;
        projectStats[p.contractor_id].totalValue += Number(p.budget) || 0;
      });

      // Transform with dynamic calculations using REAL ratings
      const transformedContractors: ContractorProfile[] = (contractorsData || []).map(c => {
        const projectStat = projectStats[c.user_id] || { count: 0, totalValue: 0 };
        const realRating = realRatingsData[c.user_id];
        const avgRating = realRating?.averageRating || 0;

        return {
          id: c.id,
          user_id: c.user_id,
          company_name: c.company_name,
          verified: c.verified,
          average_rating: avgRating,
          project_count: projectStat.count,
          total_contract_value: projectStat.totalValue,
          specialization: c.specialization || [],
          years_in_business: c.years_in_business || 0
        };
      });

      // Sort by rating, then by project count
      transformedContractors.sort((a, b) => {
        if (b.average_rating !== a.average_rating) {
          return b.average_rating - a.average_rating;
        }
        return b.project_count - a.project_count;
      });

      setContractors(transformedContractors);

      // Fetch escrow accounts with project titles
      const { data: escrowData } = await supabase
        .from('escrow_accounts')
        .select(`
          id,
          project_id,
          total_amount,
          held_amount,
          released_amount,
          status,
          projects(title)
        `)
        .order('created_at', { ascending: false });

      const transformedEscrow: EscrowAccount[] = (escrowData || []).map(ea => ({
        id: ea.id,
        project_id: ea.project_id,
        project_title: (ea.projects as any)?.title || 'Unknown Project',
        total_amount: ea.total_amount,
        held_amount: ea.held_amount,
        released_amount: ea.released_amount,
        status: ea.status
      }));

      setEscrowAccounts(transformedEscrow);

      // Fetch payment transactions with project titles
      const { data: paymentsData } = await supabase
        .from('payment_transactions')
        .select(`
          id,
          amount,
          transaction_type,
          status,
          created_at,
          payment_method,
          escrow_accounts(
            projects(title)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      const transformedPayments: PaymentTransaction[] = (paymentsData || []).map(pt => ({
        id: pt.id,
        amount: pt.amount,
        transaction_type: pt.transaction_type,
        status: pt.status,
        created_at: pt.created_at,
        payment_method: pt.payment_method || 'N/A',
        project_title: (pt.escrow_accounts as any)?.projects?.title || 'Unknown Project'
      }));

      setTransactions(transformedPayments);

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load transparency data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTransactionBadge = (type: string, status: string) => {
    if (status === 'completed') {
      if (type === 'deposit') {
        return <Badge className="bg-green-100 text-green-800">Funded</Badge>;
      } else if (type === 'release') {
        return <Badge className="bg-blue-100 text-blue-800">Released</Badge>;
      }
    }
    return <Badge className="bg-yellow-100 text-yellow-800">{status}</Badge>;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-muted-foreground/30'}`} 
      />
    ));
  };

  const totalEscrowHeld = escrowAccounts.reduce((sum, acc) => sum + (acc.held_amount || 0), 0);
  const totalEscrowReleased = escrowAccounts.reduce((sum, acc) => sum + (acc.released_amount || 0), 0);

  const handleViewPortfolio = (contractorId: string) => {
    setSelectedContractorId(contractorId);
    setIsPortfolioOpen(true);
  };

  const handleReportContractorIssue = (contractorId: string) => {
    toast.info('Redirecting to EACC issue reporting...');
    window.open('https://eacc.go.ke/default/report-corruption/', '_blank');
  };

  const handleDownloadReport = (account: EscrowAccount) => {
    try {
      const csvContent = [
        'Field,Value',
        `Project,${account.project_title}`,
        `Status,${account.status}`,
        `Total Budget,KES ${account.total_amount?.toLocaleString() || 0}`,
        `Held in Escrow,KES ${account.held_amount?.toLocaleString() || 0}`,
        `Released,KES ${account.released_amount?.toLocaleString() || 0}`,
        `Funding Progress,${account.total_amount ? Math.round(((account.held_amount + account.released_amount) / account.total_amount) * 100) : 0}%`,
        `Report Generated,${new Date().toLocaleString('en-KE')}`
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `escrow-report-${account.project_title.replace(/\s+/g, '-').toLowerCase()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded successfully');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  const filteredContractors = contractors.filter(contractor =>
    contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contractor.specialization || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Transparency Portal</h1>
            <p className="text-muted-foreground">Access public data on projects, contractors, and financial transactions.</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-800">
                      KES {(totalEscrowHeld / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-green-600">Funds in Escrow</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-800">
                      KES {(totalEscrowReleased / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-blue-600">Released Payments</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-800">{contractors.length}</div>
                    <div className="text-sm text-purple-600">Verified Contractors</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-800">{escrowAccounts.length}</div>
                    <div className="text-sm text-orange-600">Active Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="contractors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white shadow-lg">
              <TabsTrigger value="contractors">Contractor Performance</TabsTrigger>
              <TabsTrigger value="escrow">Escrow Accounts</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="contractors" className="space-y-6">
              {/* Search */}
              <Card>
                <CardContent className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search contractors by name or specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="animate-pulse">Loading contractors...</div>
                  </CardContent>
                </Card>
              ) : filteredContractors.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Contractors Found</h3>
                    <p className="text-muted-foreground">No verified contractors match your search criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredContractors.map((contractor) => (
                    <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <ContractorBanner contractorId={contractor.user_id} />
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-foreground">
                                {contractor.company_name}
                              </h3>
                              {contractor.verified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1 mb-3">
                              {getRatingStars(contractor.average_rating)}
                              <span className="ml-2 text-sm text-muted-foreground">
                                {contractor.average_rating > 0 
                                  ? `(${contractor.average_rating.toFixed(1)})` 
                                  : '(No ratings yet)'
                                }
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              {(contractor.specialization || []).map((spec, index) => (
                                <Badge key={index} variant="outline">
                                  {spec}
                                </Badge>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Projects:</span>
                                <div className="font-semibold">{contractor.project_count}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Value:</span>
                                <div className="font-semibold text-green-600">
                                  KES {((contractor.total_contract_value || 0) / 1000000).toFixed(1)}M
                                </div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Experience:</span>
                                <div className="font-semibold">{contractor.years_in_business || 0} years</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewPortfolio(contractor.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Portfolio
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-orange-600"
                              onClick={() => handleReportContractorIssue(contractor.id)}
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Report Issue
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Blacklist Alert Section */}
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    EACC Investigation Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700 text-sm mb-4">
                    This section displays contractors currently under EACC investigation or blacklisted.
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-red-200">
                    <p className="text-muted-foreground text-center">No contractors currently under investigation.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="escrow" className="space-y-6">
              <div className="grid gap-4">
                {escrowAccounts.map((account) => (
                  <Card key={account.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <Badge className={getStatusColor(account.status)}>
                              {account.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {/* Project Title */}
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            {account.project_title}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Project ID: {account.project_id?.substring(0, 8)}
                          </p>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Total Amount</div>
                              <div className="text-xl font-bold text-foreground">
                                {formatCurrency(account.total_amount || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Held in Escrow</div>
                              <div className="text-xl font-bold text-orange-600">
                                {formatCurrency(account.held_amount || 0)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Released</div>
                              <div className="text-xl font-bold text-green-600">
                                {formatCurrency(account.released_amount || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadReport(account.project_id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {escrowAccounts.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Escrow Accounts</h3>
                      <p className="text-muted-foreground">No escrow accounts available for viewing.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Public Payment History</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All payment transactions are publicly available for transparency.
                  </p>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p>Loading payment history...</p>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No payment transactions found.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div 
                          key={transaction.id} 
                          className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTransactionBadge(transaction.transaction_type, transaction.status)}
                              <span className="text-sm text-muted-foreground">
                                {transaction.transaction_type === 'deposit' ? 'Escrow Funding' : 'Payment Release'}
                              </span>
                            </div>
                            <h4 className="font-medium text-foreground">{transaction.project_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleDateString('en-KE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit'
                              })}
                              {' • '}{transaction.payment_method}
                            </p>
                          </div>
                          <div className="text-right mt-2 md:mt-0">
                            <div className={`text-xl font-bold ${
                              transaction.transaction_type === 'deposit' 
                                ? 'text-green-600' 
                                : 'text-blue-600'
                            }`}>
                              {transaction.transaction_type === 'deposit' ? '+' : '-'}
                              {formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResponsiveContainer>
      </main>

      {/* Portfolio Modal */}
      <ContractorPortfolioModal
        isOpen={isPortfolioOpen}
        onClose={() => setIsPortfolioOpen(false)}
        contractorId={selectedContractorId || ''}
      />
    </div>
  );
};

export default CitizenTransparency;
