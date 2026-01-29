
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Shield, Clock, CheckCircle, AlertTriangle, Smartphone, Building2, Eye, Loader2 } from 'lucide-react';
import { usePaymentTransparency } from '@/hooks/usePaymentTransparency';

const PaymentTransparency = () => {
  const { paymentTrails, upcomingMilestones, loading } = usePaymentTransparency();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading payment data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show demo data message if no real data
  const hasRealData = paymentTrails.length > 0 || upcomingMilestones.length > 0;
  
  const demoPaymentTrails = hasRealData ? [] : [
    {
      id: 'TX-2024-001',
      projectTitle: 'Machakos Market Road Rehabilitation',
      amount: 1200000,
      milestone: 'Foundation & Drainage Complete',
      paymentMethod: 'M-Pesa Business',
      mpesaReference: 'QJK8H3M2P1',
      contractorPhone: '+254 722 123 456',
      releaseDate: '2024-02-01T14:30:00Z',
      verificationStatus: 'citizen_verified',
      citizenVerifications: 38,
      holdingBank: 'Kenya Commercial Bank',
      escrowAccount: 'KCB-ESC-2024-045',
      blockchainHash: '0x1a2b3c4d5e6f7g8h9i0j',
      ncaVerification: 'verified',
      eaccClearance: 'cleared'
    },
    {
      id: 'TX-2024-002',
      projectTitle: 'Kibera Water Pipeline Extension',
      amount: 1260000,
      milestone: 'Planning & Permits Approved',
      paymentMethod: 'M-Pesa Business',
      mpesaReference: 'PLM9K4N7R2',
      contractorPhone: '+254 733 987 654',
      releaseDate: '2024-01-18T09:45:00Z',
      verificationStatus: 'government_verified',
      citizenVerifications: 67,
      holdingBank: 'Equity Bank',
      escrowAccount: 'EQB-ESC-2024-023',
      blockchainHash: '0x5f6g7h8i9j0k1l2m3n4o',
      ncaVerification: 'verified',
      eaccClearance: 'cleared'
    }
  ];

  const demoUpcomingMilestones = hasRealData ? [] : [
    {
      projectTitle: 'Machakos Market Road Rehabilitation',
      milestone: 'Surface Laying',
      expectedAmount: 1440000,
      expectedDate: '2024-03-15',
      progressRequired: 75,
      currentProgress: 68,
      citizenVerificationsNeeded: 30,
      currentVerifications: 23
    },
    {
      projectTitle: 'Nairobi School Roof Repair',
      milestone: 'Material Procurement',
      expectedAmount: 630000,
      expectedDate: '2024-02-28',
      progressRequired: 25,
      currentProgress: 15,
      citizenVerificationsNeeded: 25,
      currentVerifications: 8
    }
  ];

  // Use real data if available, otherwise demo data
  const displayPaymentTrails = hasRealData ? paymentTrails : demoPaymentTrails;
  const displayUpcomingMilestones = hasRealData ? upcomingMilestones : demoUpcomingMilestones;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'citizen_verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'government_verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!hasRealData && (
        <Card className="border-muted bg-muted/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">No Payment Data</p>
                <p className="text-sm text-muted-foreground">Payment data will appear here once projects have escrow accounts and transactions.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="shadow-xl border-t-4 border-t-blue-600">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
          <CardTitle className="flex items-center text-2xl">
            <Eye className="h-6 w-6 mr-3 text-blue-600" />
            Real-Time Payment Transparency Dashboard
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Complete audit trail of all government payments with M-Pesa integration, blockchain verification, and citizen oversight.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="recent" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-white shadow-lg">
          <TabsTrigger 
            value="recent" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
          >
            Recent Payments
          </TabsTrigger>
          <TabsTrigger 
            value="upcoming" 
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Upcoming Milestones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-6">
          {displayPaymentTrails.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payment transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            displayPaymentTrails.map((payment) => (
            <Card key={payment.id} className="shadow-lg border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Payment Header */}
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{payment.projectTitle}</h3>
                      <div className="text-sm text-gray-600">
                        Milestone: <span className="font-medium">{payment.milestone}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Transaction ID: {payment.id}
                      </Badge>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-green-600">
                        {formatAmount(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(payment.releaseDate)}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-500 uppercase">Payment Method</div>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">{payment.paymentMethod}</span>
                      </div>
                      <div className="text-xs text-gray-600">Ref: {payment.mpesaReference}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-500 uppercase">Contractor</div>
                      <div className="text-sm font-medium">{payment.contractorPhone}</div>
                      <Badge className="text-xs bg-green-100 text-green-800">Payment Confirmed</Badge>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-medium text-gray-500 uppercase">Escrow Details</div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">{payment.holdingBank}</span>
                      </div>
                      <div className="text-xs text-gray-600">{payment.escrowAccount}</div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Verification Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">Citizen Verification</div>
                          <div className="text-xs text-gray-600">{payment.citizenVerifications} confirmations</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium">NCA Status</div>
                          <Badge className="text-xs bg-blue-100 text-blue-800 mt-1">
                            {payment.ncaVerification.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <div>
                          <div className="text-sm font-medium">EACC Clearance</div>
                          <Badge className="text-xs bg-green-100 text-green-800 mt-1">
                            {payment.eaccClearance.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        <div className="w-5 h-5 bg-purple-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          B
                        </div>
                        <div>
                          <div className="text-sm font-medium">Blockchain</div>
                          <div className="text-xs text-gray-600 font-mono">
                            {payment.blockchainHash.substring(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t">
                    <Button size="sm" variant="outline">
                      View Full Receipt
                    </Button>
                    <Button size="sm" variant="outline">
                      Verify on Blockchain
                    </Button>
                    <Button size="sm" variant="outline">
                      Download Audit Report
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )))}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingMilestones.map((milestone, index) => (
            <Card key={index} className="shadow-lg border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">{milestone.projectTitle}</h3>
                      <div className="text-sm text-gray-600">
                        Next Milestone: <span className="font-medium">{milestone.milestone}</span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatAmount(milestone.expectedAmount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Expected: {new Date(milestone.expectedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Progress Tracking */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Project Progress</span>
                        <span>{milestone.currentProgress}% of {milestone.progressRequired}% required</span>
                      </div>
                      <Progress value={milestone.currentProgress} className="h-3" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Citizen Verifications</span>
                        <span>{milestone.currentVerifications} of {milestone.citizenVerificationsNeeded} needed</span>
                      </div>
                      <Progress 
                        value={(milestone.currentVerifications / milestone.citizenVerificationsNeeded) * 100} 
                        className="h-3" 
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    {milestone.currentProgress >= milestone.progressRequired && 
                     milestone.currentVerifications >= milestone.citizenVerificationsNeeded ? (
                      <Badge className="bg-green-100 text-green-800">Ready for Payment Release</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Awaiting Completion</Badge>
                    )}
                    
                    <Button size="sm" variant="outline">
                      Track Progress
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">KES 156.8M</div>
            <div className="text-sm text-gray-600">Total Funds Tracked</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">247</div>
            <div className="text-sm text-gray-600">Verified Transactions</div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">100%</div>
            <div className="text-sm text-gray-600">Blockchain Verified</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentTransparency;
