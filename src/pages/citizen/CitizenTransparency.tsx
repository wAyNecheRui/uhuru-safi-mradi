import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  DollarSign, 
  Building2, 
  Star, 
  AlertTriangle,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Download
} from 'lucide-react';
import Header from '@/components/Header';
import BreadcrumbNav from '@/components/BreadcrumbNav';
import ResponsiveContainer from '@/components/ResponsiveContainer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ContractorProfile {
  id: string;
  company_name: string;
  verified: boolean;
  average_rating: number;
  previous_projects_count: number;
  total_contract_value: number;
  specialization: string[];
  years_in_business: number;
}

interface EscrowAccount {
  id: string;
  project_id: string;
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
}

const CitizenTransparency = () => {
  const [contractors, setContractors] = useState<ContractorProfile[]>([]);
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [budgetFilter, setBudgetFilter] = useState('all');

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
      // Fetch verified contractors
      const { data: contractorsData } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('verified', true)
        .order('average_rating', { ascending: false });

      setContractors(contractorsData || []);

      // Fetch escrow accounts
      const { data: escrowData } = await supabase
        .from('escrow_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      setEscrowAccounts(escrowData || []);

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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  const totalEscrowHeld = escrowAccounts.reduce((sum, acc) => sum + (acc.held_amount || 0), 0);
  const totalEscrowReleased = escrowAccounts.reduce((sum, acc) => sum + (acc.released_amount || 0), 0);

  const handleViewPortfolio = (contractorId: string) => {
    toast.info('Portfolio viewer opening. Showing contractor project history.');
  };

  const handleReportContractorIssue = (contractorId: string) => {
    toast.info('Issue report form opened. Your report will be reviewed by EACC.');
  };

  const handleDownloadReport = (projectId: string) => {
    toast.success('Downloading escrow account report...');
    // In a real implementation, this would generate and download a PDF
  };

  const filteredContractors = contractors.filter(contractor =>
    contractor.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contractor.specialization || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main>
        <ResponsiveContainer className="py-6 sm:py-8">
          <BreadcrumbNav items={breadcrumbItems} />
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Transparency Portal</h1>
            <p className="text-gray-600">Access public data on projects, contractors, and financial transactions.</p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contractors Found</h3>
                    <p className="text-gray-600">No verified contractors match your search criteria.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredContractors.map((contractor) => (
                    <Card key={contractor.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl font-semibold text-gray-900">
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
                              {getRatingStars(contractor.average_rating || 0)}
                              <span className="ml-2 text-sm text-gray-600">
                                ({contractor.average_rating?.toFixed(1) || 'N/A'})
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
                                <span className="text-gray-600">Projects:</span>
                                <div className="font-semibold">{contractor.previous_projects_count || 0}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Total Value:</span>
                                <div className="font-semibold text-green-600">
                                  KES {((contractor.total_contract_value || 0) / 1000000).toFixed(1)}M
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">Experience:</span>
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
                    <p className="text-gray-600 text-center">No contractors currently under investigation.</p>
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
                            <span className="text-sm text-gray-600">
                              Project ID: {account.project_id?.substring(0, 8)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <div className="text-sm text-gray-600">Total Amount</div>
                              <div className="text-xl font-bold text-gray-900">
                                KES {(account.total_amount || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Held in Escrow</div>
                              <div className="text-xl font-bold text-orange-600">
                                KES {(account.held_amount || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Released</div>
                              <div className="text-xl font-bold text-green-600">
                                KES {(account.released_amount || 0).toLocaleString()}
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
                      <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No Escrow Accounts</h3>
                      <p className="text-gray-600">No escrow accounts available for viewing.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Public Payment History</CardTitle>
                  <p className="text-sm text-gray-600">
                    All payment transactions are publicly available for transparency.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Payment history will appear here as transactions are processed.</p>
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

export default CitizenTransparency;
